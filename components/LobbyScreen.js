import React, { useState, useEffect, useMemo } from 'react';
import { generateSummary } from '../services/geminiService.js';
import LoadingSpinner from './LoadingSpinner.js';

const CharacterCard = ({ char }) => {
    const intimacyPercentage = useMemo(() => {
        if (char.intimacyMax === 0) return 0;
        return (char.intimacy / char.intimacyMax) * 100;
    }, [char.intimacy, char.intimacyMax]);

  return (
    <div className="bg-gray-900/50 p-4 rounded-lg border border-yellow-700/20 shadow-lg">
      <h3 className="text-xl text-yellow-400 font-cinzel">{char.name}</h3>
      <p className="text-sm text-gray-400 italic mt-1 h-16 overflow-y-auto">{char.description}</p>
      <div className="mt-3">
        <div className="flex justify-between items-center text-xs text-gray-400 mb-1">
          <span>Keintiman</span>
          <span>{char.intimacy}/{char.intimacyMax}</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2.5">
          <div className="bg-yellow-600 h-2.5 rounded-full" style={{ width: `${intimacyPercentage}%` }}></div>
        </div>
      </div>
    </div>
  );
};

const LobbyScreen = ({ gameContext, storyParts, handleContinue, handleLogout }) => {
  const [summary, setSummary] = useState(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      setIsLoadingSummary(true);
      try {
        const result = await generateSummary(storyParts);
        setSummary(result);
      } catch (error) {
        console.error("Failed to generate summary:", error);
        setSummary("Tidak dapat memuat ringkasan petualangan Anda.");
      } finally {
        setIsLoadingSummary(false);
      }
    };

    if (storyParts && storyParts.length > 1) { // Only summarize if there's a story to tell
        fetchSummary();
    } else {
        setSummary("Petualangan baru saja dimulai...");
        setIsLoadingSummary(false);
    }
  }, [storyParts]);

  const encounteredCharacters = useMemo(() => {
    return Object.values(gameContext.characters).filter(c => c.status !== 'Unknown' || c.intimacy > 0);
  }, [gameContext.characters]);

  return (
    <div className="flex-grow flex flex-col p-6 md:p-8 text-white overflow-y-auto scrollbar-thin">
      <header className="text-center mb-6">
        <h1 className="text-4xl md:text-5xl font-bold text-yellow-400 font-cinzel drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
          Selamat Datang Kembali, {gameContext.playerName}
        </h1>
        <p className="text-lg text-gray-300 mt-2">Takdir Anda menanti.</p>
      </header>
      
      <main className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel: Summary & Actions */}
        <div className="lg:col-span-2 bg-black/20 p-6 rounded-lg border border-gray-700/50 flex flex-col">
          <h2 className="text-2xl font-cinzel text-yellow-500 border-b border-yellow-700/30 pb-2 mb-4">Ringkasan Petualangan</h2>
          <div className="flex-grow text-gray-300 italic min-h-[100px]">
            {isLoadingSummary ? <div className="flex items-center space-x-2"><LoadingSpinner size="sm" /><span>Merangkum takdir...</span></div> : summary}
          </div>
          <div className="mt-6 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <button onClick={handleContinue} className="w-full px-6 py-3 bg-yellow-600 text-gray-900 font-bold text-lg rounded-md hover:bg-yellow-500 transition duration-300 transform hover:scale-105">
              Lanjutkan Petualangan
            </button>
            <button onClick={handleLogout} className="w-full sm:w-auto px-6 py-3 bg-red-800 text-red-100 font-semibold rounded-md hover:bg-red-700 transition duration-300">
              Keluar
            </button>
          </div>
        </div>

        {/* Right Panel: Character Dossier */}
        <div className="bg-black/20 p-6 rounded-lg border border-gray-700/50">
          <h2 className="text-2xl font-cinzel text-yellow-500 border-b border-yellow-700/30 pb-2 mb-4">Dossier Karakter</h2>
          {encounteredCharacters.length > 0 ? (
             <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin">
                {encounteredCharacters.map(char => <CharacterCard key={char.name} char={char} />)}
            </div>
          ) : (
            <p className="text-gray-500 italic">Anda belum menjalin hubungan berarti dengan siapa pun.</p>
          )}
        </div>
      </main>
    </div>
  );
};

export default LobbyScreen;