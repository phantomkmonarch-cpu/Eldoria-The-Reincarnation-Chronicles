import React, { useState } from 'react';

interface ApiKeyPromptScreenProps {
  onApiKeySubmit: (key: string) => void;
}

const ApiKeyPromptScreen: React.FC<ApiKeyPromptScreenProps> = ({ onApiKeySubmit }) => {
  const [apiKey, setApiKey] = useState('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedKey = apiKey.trim();
    if (trimmedKey) {
      onApiKeySubmit(trimmedKey);
    }
  };

  return (
    <div className="flex-grow flex flex-col justify-center items-center p-8 text-center text-gray-300">
      <div className="w-full max-w-lg bg-gray-900/80 p-8 rounded-lg border border-yellow-700/30 shadow-xl">
        <h1 className="text-3xl font-bold text-yellow-400 font-cinzel mb-4">API Key Diperlukan</h1>
        <p className="mb-6 text-gray-400">
          Untuk terhubung dengan AI Gemini dan menjalankan Eldoria, aplikasi ini memerlukan kunci API Google AI Anda.
          Kunci Anda akan disimpan dengan aman di <strong className="text-yellow-300">penyimpanan lokal browser Anda</strong> dan tidak akan pernah dibagikan atau diunggah ke mana pun.
        </p>
        
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Masukkan kunci API Gemini Anda..."
            className="w-full px-4 py-3 bg-gray-900/50 border-2 border-gray-600 rounded-md text-lg text-yellow-100 placeholder-gray-500 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition duration-300"
            required
          />
          <button 
            type="submit" 
            disabled={!apiKey.trim()}
            className="w-full mt-4 px-6 py-3 bg-yellow-600 text-gray-900 font-bold text-lg rounded-md hover:bg-yellow-500 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed transition duration-300 transform hover:scale-105"
          >
            Simpan & Mulai Petualangan
          </button>
        </form>
        <p className="mt-6 text-xs text-gray-500">
          Anda bisa mendapatkan kunci API gratis dari <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-yellow-500 hover:underline">Google AI Studio</a>.
        </p>
      </div>
    </div>
  );
};

export default ApiKeyPromptScreen;
