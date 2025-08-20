import React from 'react';
import LoadingSpinner from './LoadingSpinner.js';

const LoginScreen = ({ playerName, setPlayerName, handleLogin, isLoading, error }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isLoading) {
      handleLogin();
    }
  };
  
  return (
    <div className="flex-grow flex flex-col justify-center items-center p-8 text-center">
      <div className="mb-8">
        <h1 className="text-5xl md:text-6xl font-bold text-yellow-400 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">Eldoria</h1>
        <p className="text-xl md:text-2xl text-gray-300 mt-2 font-cinzel tracking-wider">The Reincarnation Chronicles</p>
      </div>
      
      <form onSubmit={handleSubmit} className="w-full max-w-md">
        <p className="text-gray-400 mb-4">Masukkan nama Anda untuk masuk atau membuat karakter baru</p>
        <input
          type="text"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          placeholder="Nama karakter Anda..."
          disabled={isLoading}
          className="w-full px-4 py-3 bg-gray-900/50 border-2 border-gray-600 rounded-md text-lg text-yellow-100 placeholder-gray-500 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition duration-300"
          maxLength={50}
          required
        />
        <button 
          type="submit" 
          disabled={isLoading || !playerName.trim()}
          className="w-full mt-4 px-6 py-3 bg-yellow-600 text-gray-900 font-bold text-lg rounded-md hover:bg-yellow-500 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed transition duration-300 transform hover:scale-105 flex justify-center items-center"
        >
          {isLoading ? <LoadingSpinner /> : 'Masuk / Buat Baru'}
        </button>
      </form>
      
      {error && (
        <div className="mt-6 p-4 bg-red-900/50 border border-red-700 rounded-md text-red-300 w-full max-w-md">
          {error}
        </div>
      )}
    </div>
  );
};

export default LoginScreen;