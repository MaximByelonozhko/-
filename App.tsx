import React, { useState, useEffect } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { ResultCard } from './components/ResultCard';
import { ZoomableImage } from './components/ZoomableImage';
import { analyzeHygrometer } from './services/geminiService';
import { PsychrometricData, AppState, TrainingExample } from './types';
import { Droplets, Loader2, Info, BookOpen } from 'lucide-react';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [image, setImage] = useState<string | null>(null);
  const [data, setData] = useState<PsychrometricData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Knowledge Base State
  const [trainingExamples, setTrainingExamples] = useState<TrainingExample[]>([]);

  // Load knowledge from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('psychro_training_data');
    if (saved) {
        try {
            setTrainingExamples(JSON.parse(saved));
        } catch (e) {
            console.error("Failed to load training data", e);
        }
    }
  }, []);

  const handleImageSelected = async (base64: string) => {
    setImage(base64);
    setAppState(AppState.ANALYZING);
    setErrorMsg(null);

    try {
      // Pass the accumulated knowledge to the AI service
      const result = await analyzeHygrometer(base64, trainingExamples);
      setData(result);
      setAppState(AppState.SUCCESS);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Не вдалося розпізнати показники. Переконайтеся, що фото чітке і шкалу добре видно.");
      setAppState(AppState.ERROR);
    }
  };

  const handleReset = () => {
    setAppState(AppState.IDLE);
    setImage(null);
    setData(null);
    setErrorMsg(null);
  };

  const handleLearn = (correctedDry: number, correctedWet: number) => {
    if (!image) return;

    const newExample: TrainingExample = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        imageUrl: image, // Note: Storing full base64 in LocalStorage has limits (usually ~5MB). 
        correctedDry,
        correctedWet
    };

    // Keep only the last 3 examples to avoid quota limits/storage limits
    const updatedExamples = [...trainingExamples, newExample].slice(-3);
    
    setTrainingExamples(updatedExamples);
    localStorage.setItem('psychro_training_data', JSON.stringify(updatedExamples));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg">
                <Droplets className="text-white" size={20} />
            </div>
            <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-cyan-600">
              PsychroMinder
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
              {trainingExamples.length > 0 && (
                  <div className="flex items-center gap-1.5 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-md border border-amber-100" title="Кількість вивчених прикладів">
                      <BookOpen size={14} />
                      <span>Вивчено: {trainingExamples.length}</span>
                  </div>
              )}
              <div className="text-xs text-slate-400 font-medium hidden sm:block">
                AI Powered
              </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 pt-8">
        
        {/* Intro / Idle State */}
        {appState === AppState.IDLE && (
          <div className="space-y-8 animate-fade-in">
            <div className="text-center space-y-4 py-8">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-800">
                Розрахунок вологості <br/>
                <span className="text-blue-600">за фото</span>
              </h2>
              <p className="text-slate-500 max-w-lg mx-auto text-lg">
                Завантажте фото психрометра (ВІТ-1, ВІТ-2), і штучний інтелект зчитає температуру та визначить відносну вологість.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
               <ImageUploader onImageSelected={handleImageSelected} isLoading={false} />
            </div>
          </div>
        )}

        {/* Analyzing State */}
        {appState === AppState.ANALYZING && (
          <div className="flex flex-col items-center justify-center py-20 space-y-6 animate-fade-in">
             <div className="relative">
                <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-75"></div>
                <div className="relative bg-white p-4 rounded-full shadow-lg border border-blue-100">
                    <Loader2 className="text-blue-600 animate-spin" size={40} />
                </div>
             </div>
             <div className="text-center space-y-2">
                <h3 className="text-xl font-semibold text-slate-800">Аналіз зображення...</h3>
                <p className="text-slate-500">ШІ вивчає червоні стовпчики та шкалу з кроком 0,2°C.</p>
                {trainingExamples.length > 0 && (
                     <p className="text-xs text-amber-600 font-medium">Використовую ваш попередній досвід для уточнення.</p>
                )}
             </div>
             {image && (
                 <div className="w-32 h-32 rounded-lg overflow-hidden border-2 border-white shadow-lg opacity-50 grayscale">
                    <img src={image} alt="Analyzing thumbnail" className="w-full h-full object-cover" />
                 </div>
             )}
          </div>
        )}

        {/* Error State */}
        {appState === AppState.ERROR && (
          <div className="max-w-md mx-auto py-12 animate-fade-in">
             <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center space-y-4">
                <div className="mx-auto w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
                    <Info size={24} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-red-900">Помилка аналізу</h3>
                    <p className="text-red-700 mt-2">{errorMsg}</p>
                </div>
                <button 
                    onClick={handleReset}
                    className="mt-4 px-6 py-2 bg-white border border-red-200 text-red-700 font-medium rounded-lg hover:bg-red-50 transition-colors shadow-sm"
                >
                    Спробувати ще раз
                </button>
             </div>
          </div>
        )}

        {/* Success State */}
        {appState === AppState.SUCCESS && data && image && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 animate-fade-in">
            {/* Left Column: Image */}
            <div className="lg:col-span-2 space-y-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wide">Ваше фото</h3>
                <ZoomableImage src={image} alt="Uploaded hygrometer" />
                <div className="bg-blue-50 p-3 rounded-lg flex items-start gap-2">
                    <Info className="text-blue-500 shrink-0 mt-0.5" size={16} />
                    <p className="text-xs text-blue-800">
                        Ви можете наближати зображення, щоб перевірити правильність зчитаних показників.
                    </p>
                </div>
            </div>

            {/* Right Column: Results & Interactive Form */}
            <div className="lg:col-span-3">
                <ResultCard 
                    initialData={data} 
                    onReset={handleReset} 
                    onLearn={handleLearn}
                />
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default App;