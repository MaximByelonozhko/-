import React, { useRef, useState } from 'react';
import { Camera, Upload, AlertCircle } from 'lucide-react';

interface ImageUploaderProps {
  onImageSelected: (base64: string) => void;
  isLoading: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageSelected, isLoading }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    // Validate type
    if (!file.type.startsWith('image/')) {
      setError('Будь ласка, завантажте файл зображення (JPG, PNG).');
      return;
    }

    // Validate size (limit to ~10MB to be safe for base64)
    if (file.size > 10 * 1024 * 1024) {
      setError('Зображення занадто велике. Максимум 10MB.');
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      onImageSelected(result);
    };
    reader.onerror = () => {
      setError('Помилка при зчитуванні файлу.');
    };
    reader.readAsDataURL(file);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const triggerCamera = () => {
    // On mobile, file input with capture="environment" opens camera directly
    if (fileInputRef.current) {
        fileInputRef.current.setAttribute('capture', 'environment');
        fileInputRef.current.click();
        // Reset capture attribute after click so standard upload still works if needed later
        setTimeout(() => {
            fileInputRef.current?.removeAttribute('capture');
        }, 500);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      <div className="grid grid-cols-2 gap-4">
        {/* Camera Button */}
        <button
          onClick={triggerCamera}
          disabled={isLoading}
          className="flex flex-col items-center justify-center p-8 bg-blue-50 border-2 border-blue-200 border-dashed rounded-xl hover:bg-blue-100 hover:border-blue-400 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          <div className="bg-blue-500 text-white p-3 rounded-full mb-3 shadow-lg group-hover:scale-110 transition-transform">
            <Camera size={32} />
          </div>
          <span className="text-blue-900 font-semibold">Камера</span>
          <span className="text-blue-600 text-xs mt-1 text-center">Зробити фото</span>
        </button>

        {/* Upload Button */}
        <button
          onClick={triggerFileInput}
          disabled={isLoading}
          className="flex flex-col items-center justify-center p-8 bg-slate-50 border-2 border-slate-200 border-dashed rounded-xl hover:bg-slate-100 hover:border-slate-400 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          <div className="bg-slate-600 text-white p-3 rounded-full mb-3 shadow-lg group-hover:scale-110 transition-transform">
            <Upload size={32} />
          </div>
          <span className="text-slate-900 font-semibold">Галерея</span>
          <span className="text-slate-600 text-xs mt-1 text-center">Завантажити файл</span>
        </button>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-center gap-2 border border-red-200 animate-pulse">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <div className="mt-6 text-center">
        <p className="text-slate-500 text-sm">
          Підтримуються фото ВІТ-1, ВІТ-2 та інших психрометрів.
          <br />
          Для кращого результату фотографуйте шкалу прямо та при хорошому освітленні.
        </p>
      </div>
    </div>
  );
};