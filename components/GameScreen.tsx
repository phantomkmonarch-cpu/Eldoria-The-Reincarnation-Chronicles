import React from 'react';
import type { GameContext, StoryPart } from '../types';
import StoryDisplay from './StoryDisplay';
import ActionInput from './ActionInput';

interface GameScreenProps {
  gameContext: GameContext;
  storyParts: StoryPart[];
  isProcessingAction: boolean;
  handleSendAction: () => void;
  inputText: string;
  setInputText: (text: string) => void;
  handleReturnToLobby: () => void;
  isWaitingForGM?: boolean;
}

const GameScreen: React.FC<GameScreenProps> = ({
  gameContext,
  storyParts,
  isProcessingAction,
  handleSendAction,
  inputText,
  setInputText,
  handleReturnToLobby,
  isWaitingForGM
}) => {
  return (
    <div className="flex-grow flex flex-col h-full">
      <header className="p-4 bg-black/20 backdrop-blur-sm border-b-2 border-yellow-700/30 flex justify-between items-center relative z-10">
        <div className="w-24 flex justify-start">
            <button 
                onClick={handleReturnToLobby} 
                className="text-sm text-gray-400 hover:text-yellow-400 border border-transparent hover:border-yellow-500/50 rounded-md px-3 py-1 transition-all duration-300"
                aria-label="Kembali ke Lobi"
            >
                &larr; Lobi
            </button>
        </div>
        <div className="text-center">
            <h1 className="text-2xl font-bold text-yellow-400 tracking-wide">{gameContext.playerName}</h1>
            <p className="text-sm text-gray-400 font-cinzel">Season {gameContext.season} - Bab {gameContext.chapter}</p>
        </div>
        <div className="w-24"></div> {/* Spacer */}
      </header>
      
      <StoryDisplay storyParts={storyParts} isProcessingAction={isProcessingAction} isWaitingForGM={isWaitingForGM} />
      
      <ActionInput
        inputText={inputText}
        setInputText={setInputText}
        handleSendAction={handleSendAction}
        isProcessingAction={isProcessingAction}
      />
    </div>
  );
};

export default GameScreen;
