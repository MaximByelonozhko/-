import { GoogleGenAI, Type, Schema } from "@google/genai";
import { PsychrometricData, TrainingExample } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = "gemini-2.5-flash";

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    isPsychrometer: {
      type: Type.BOOLEAN,
      description: "True if the image clearly contains a psychrometric hygrometer (VIT-1, VIT-2 style) with two thermometers. False if it is a random photo, selfie, landscape, etc.",
    },
    dryTemp: {
      type: Type.NUMBER,
      description: "Temperature reading from the Dry Bulb thermometer (Left). Value must be precise to 0.2 degrees.",
    },
    wetTemp: {
      type: Type.NUMBER,
      description: "Temperature reading from the Wet Bulb thermometer (Right). Value must be precise to 0.2 degrees. MUST be <= dryTemp.",
    },
  },
  required: ["isPsychrometer", "dryTemp", "wetTemp"],
};

export const analyzeHygrometer = async (
  base64Image: string, 
  examples: TrainingExample[] = []
): Promise<PsychrometricData> => {
  try {
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");
    
    // Construct the prompt parts
    const parts: any[] = [];

    // 1. System Instruction / Context
    const systemPrompt = `
      Ти - експертний метролог. Твоє завдання - зчитати покази психрометра (ВІТ-1, ВІТ-2).

      АЛГОРИТМ РОБОТИ:
      1. **Ідентифікація**: Перевір, чи є на фото психрометр (два вертикальні термометри, шкала, резервуар з водою). Якщо це фото кота, пейзажу або людини - поверни isPsychrometer: false і 0 для температур.
      2. **Пошук рідини**: Знайди два стовпчики з ЧЕРВОНОЮ (або підфарбованою) рідиною.
         - Зліва: Сухий термометр (Dry).
         - Справа: Вологий термометр (Wet).
      3. **Аналіз шкали**:
         - Основні цифри йдуть з кроком 10 або 5 градусів.
         - Числові підписи (наприклад, 10, 20) мають велику риску, що знаходиться ВНИЗУ числа (або навпроти нижнього краю).
         - Між цифрами є довгі риски (кожні 1 або 2 градуси).
         - **ВАЖЛИВО**: Найменші короткі риски відповідають 0,2°C.
      4. **Зчитування**:
         - Подивись на верхівку меніска (верхній край червоного стовпчика).
         - Визнач найближчу нижню риску і додай кількість маленьких поділок (x * 0.2).
      5. **Фізична перевірка**:
         - Температура вологого термометра НЕ МОЖЕ бути вищою за температуру сухого.
         - Wet <= Dry. Якщо ти бачиш інакше - ти помилився в зчитуванні шкали. Передивись ще раз.
    `;

    // 2. Add Training Examples (Few-Shot Learning)
    // We limit to the last 1 example to save tokens/bandwidth, but usually 2-3 is better if possible.
    // Ideally, we pass the image and the correct text output.
    if (examples.length > 0) {
      parts.push({ text: "Ось приклад попереднього правильного зчитування, яке надав користувач. Використовуй це як еталон для розуміння шкали:" });
      
      // Use the most recent example
      const ex = examples[examples.length - 1];
      const exBase64 = ex.imageUrl.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");
      
      parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: exBase64
        }
      });
      parts.push({ text: `Правильні значення для фото вище: Сухий=${ex.correctedDry.toFixed(1)}°C, Вологий=${ex.correctedWet.toFixed(1)}°C.` });
    }

    // 3. Add the Target Image and Request
    parts.push({ text: "Тепер проаналізуй це НОВЕ зображення. Будь уважний до червоних стовпчиків." });
    parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: cleanBase64,
        },
    });
    parts.push({ text: systemPrompt });

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: parts,
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.1, // Very low for precision
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response text from Gemini");

    const data = JSON.parse(text) as PsychrometricData;

    // Safety check for non-psychrometer
    if (!data.isPsychrometer) {
        throw new Error("NOT_A_PSYCHROMETER");
    }

    // Client-side sanity enforcement (if model fails constraint despite prompt)
    if (data.wetTemp > data.dryTemp) {
        // Swap or clamp? Technically an error, but let's clamp wet to dry
        // so calculations don't break, but ideally we show raw data.
        // Let's rely on the model first, but if it fails, the UI will show it.
        console.warn("Model returned Wet > Dry despite instructions.");
    }

    return data;

  } catch (error: any) {
    if (error.message === "NOT_A_PSYCHROMETER") {
        throw new Error("На зображенні не знайдено психрометра. Будь ласка, сфотографуйте прилад ВІТ-1 або ВІТ-2.");
    }
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};