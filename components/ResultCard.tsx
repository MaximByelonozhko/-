import React, { useEffect, useState } from 'react';
import { Droplets, Thermometer, RefreshCw, CheckCircle2, GraduationCap, AlertTriangle } from 'lucide-react';
import { PsychrometricData, CalculationResult } from '../types';
import { calculateHumidity, calculateDewPoint } from '../utils/psychrometry';

interface ResultCardProps {
  initialData: PsychrometricData;
  onReset: () => void;
  onLearn: (dry: number, wet: number) => void;
}

export const ResultCard: React.FC<ResultCardProps> = ({ initialData, onReset, onLearn }) => {
  const [readings, setReadings] = useState<PsychrometricData>(initialData);
  const [result, setResult] = useState<CalculationResult>({
    ...initialData,
    relativeHumidity: 0,
    dewPoint: 0
  });
  const [isCorrected, setIsCorrected] = useState(false);
  const [hasLearned, setHasLearned] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Recalculate whenever inputs change
  useEffect(() => {
    // Validate physics
    if (readings.wetTemp > readings.dryTemp) {
        setValidationError("Температура вологого термометра не може бути вищою за сухий!");
        setResult(prev => ({ ...prev, relativeHumidity: 0, dewPoint: undefined }));
        return;
    } else {
        setValidationError(null);
    }

    const rh = calculateHumidity(readings.dryTemp, readings.wetTemp);
    const dp = calculateDewPoint(readings.dryTemp, rh);
    setResult({
      ...readings,
      relativeHumidity: rh,
      dewPoint: parseFloat(dp.toFixed(1))
    });

    // Check if user has changed from AI initial values
    const hasChanged = 
      Math.abs(readings.dryTemp - initialData.dryTemp) > 0.01 || 
      Math.abs(readings.wetTemp - initialData.wetTemp) > 0.01;
    
    setIsCorrected(hasChanged);

    // If inputs change, reset the "Learned" status until clicked again
    if (hasChanged) {
        setHasLearned(false);
    }

  }, [readings, initialData]);

  const handleChange = (field: keyof PsychrometricData, value: string) => {
    if (value === '' || value === '-') return;
    
    const num = parseFloat(value);
    if (!isNaN(num)) {
      setReadings(prev => ({ ...prev, [field]: num }));
    }
  };

  const handleLearnClick = () => {
    if (validationError) return;
    onLearn(readings.dryTemp, readings.wetTemp);
    setHasLearned(true);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg border border-slate-100 p-6">
        <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Thermometer className="text-blue-500" />
                Результати вимірювань
            </h2>
            {isCorrected && !hasLearned && (
                <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full font-medium border border-amber-200">
                    Змінено вручну
                </span>
            )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Dry Bulb Input */}
          <div className="relative group">
            <label className="block text-sm font-bold text-red-500 mb-2">
              Сухий термометр (Лівий)
            </label>
            <div className="relative flex items-center">
                <input
                    type="number"
                    step="0.2"
                    value={readings.dryTemp}
                    onChange={(e) => handleChange('dryTemp', e.target.value)}
                    className="w-full text-3xl font-bold text-slate-800 bg-red-50/50 border border-slate-200 rounded-lg py-3 px-4 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                />
                <span className="absolute right-4 text-slate-400 text-xl">°C</span>
            </div>
            <p className="text-xs text-slate-400 mt-2">
                Крок шкали 0,2°C
            </p>
          </div>

          {/* Wet Bulb Input */}
          <div className="relative group">
            <label className="block text-sm font-bold text-blue-500 mb-2">
              Вологий термометр (Правий)
            </label>
            <div className="relative flex items-center">
                <input
                    type="number"
                    step="0.2"
                    value={readings.wetTemp}
                    onChange={(e) => handleChange('wetTemp', e.target.value)}
                    className={`w-full text-3xl font-bold text-blue-900 bg-blue-50 border rounded-lg py-3 px-4 focus:ring-2 outline-none transition-all ${validationError ? 'border-red-300 ring-2 ring-red-200' : 'border-blue-100 focus:ring-blue-500 focus:border-blue-500'}`}
                />
                <span className="absolute right-4 text-blue-400 text-xl">°C</span>
            </div>
             <p className="text-xs text-slate-400 mt-2">
                Крок шкали 0,2°C
            </p>
          </div>
        </div>

        {validationError && (
             <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-center gap-2 border border-red-200 animate-pulse">
                <AlertTriangle size={16} />
                {validationError}
             </div>
        )}

        {/* Calculated Humidity Display */}
        <div className="mt-8 pt-8 border-t border-slate-100">
            <div className={`rounded-2xl p-6 text-white shadow-xl transform transition-all hover:scale-[1.01] ${validationError ? 'bg-slate-400 shadow-none' : 'bg-gradient-to-r from-blue-500 to-cyan-500 shadow-blue-200'}`}>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-blue-100 text-sm font-medium mb-1 uppercase tracking-wider">Відносна вологість</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-5xl md:text-6xl font-extrabold tracking-tight">
                                {validationError ? '--' : result.relativeHumidity}
                            </span>
                            <span className="text-3xl opacity-80">%</span>
                        </div>
                    </div>
                    <div className="bg-white/20 p-4 rounded-full backdrop-blur-md">
                        <Droplets size={40} className="text-white" />
                    </div>
                </div>
                
                {!validationError && result.dewPoint !== undefined && (
                   <div className="mt-4 pt-4 border-t border-white/20 flex items-center gap-2 text-sm text-blue-50">
                        <span>Точка роси:</span>
                        <span className="font-bold">{result.dewPoint}°C</span>
                   </div> 
                )}
            </div>
        </div>

        {/* Learn Button (Only if corrected and valid) */}
        {isCorrected && !hasLearned && !validationError && (
             <div className="mt-6 animate-fade-in">
                <button 
                    onClick={handleLearnClick}
                    className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-lg shadow-amber-200 transition-all flex items-center justify-center gap-2 font-medium"
                >
                    <GraduationCap size={20} />
                    Навчатися (зберегти правильні дані)
                </button>
                <p className="text-center text-xs text-slate-400 mt-2">
                    Застосунок запам'ятає це фото та значення для покращення наступних розпізнавань.
                </p>
             </div>
        )}

        {/* Success Feedback */}
        {hasLearned && (
             <div className="mt-4 flex items-start gap-3 p-3 bg-green-50 text-green-700 rounded-lg border border-green-200 animate-in fade-in slide-in-from-bottom-2">
                <CheckCircle2 size={20} className="mt-0.5 shrink-0" />
                <div className="text-sm">
                    <p className="font-semibold">Дані збережено!</p>
                    <p className="opacity-90">Наступного разу ШІ використає цей приклад для точнішого аналізу.</p>
                </div>
             </div>
        )}
      </div>

      <button
        onClick={onReset}
        className="w-full py-4 text-slate-500 font-medium hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors flex items-center justify-center gap-2"
      >
        <RefreshCw size={18} />
        Просканувати інше фото
      </button>
    </div>
  );
};