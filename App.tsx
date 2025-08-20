import React, { useState, useEffect } from 'react';
import { useGame } from './hooks/useGame';
import LoginScreen from './components/LoginScreen';
import GameScreen from './components/GameScreen';
import LoadingSpinner from './components/LoadingSpinner';
import AdminPage from './components/AdminPage';
import LobbyScreen from './components/LobbyScreen';

const App: React.FC = () => {
  const [isAdminView, setIsAdminView] = useState(false);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('admin') === 'true') {
      setIsAdminView(true);
    }
  }, []);

  const game = useGame();
  
  if (isAdminView) {
    return <AdminPage />;
  }

  const renderView = () => {
    switch (game.gameState.currentView) {
      case 'loading':
        return (
          <div className="flex-grow flex flex-col justify-center items-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-lg text-yellow-300 font-cinzel tracking-widest animate-pulse">Memuat Takdir...</p>
          </div>
        );
      case 'login':
        return (
          <LoginScreen
            playerName={game.playerName}
            setPlayerName={game.setPlayerName}
            handleLogin={game.handleLogin}
            isLoading={game.gameState.isLoading}
            error={game.gameState.error}
          />
        );
      case 'lobby':
         return (
          <LobbyScreen
            gameContext={game.gameState.gameContext!}
            storyParts={game.gameState.storyParts}
            handleContinue={game.handleContinueGame}
            handleLogout={game.handleLogout}
          />
        );
      case 'game':
        return (
          <GameScreen
            gameContext={game.gameState.gameContext!}
            storyParts={game.gameState.storyParts}
            isProcessingAction={game.gameState.isProcessingAction}
            isWaitingForGM={game.gameState.isWaitingForGM}
            handleSendAction={game.handleSendAction}
            inputText={game.inputText}
            setInputText={game.setInputText}
            handleReturnToLobby={game.handleReturnToLobby}
          />
        );
      default:
        return <p>Error: Tampilan tidak diketahui</p>;
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl h-[95vh] bg-gray-900/60 backdrop-blur-md rounded-lg shadow-2xl shadow-black/50 border border-yellow-700/20 flex flex-col">
        {renderView()}
      </div>
    </div>
  );
};

export default App;
