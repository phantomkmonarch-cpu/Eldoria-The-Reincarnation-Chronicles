import React, { useEffect, useRef } from 'react';

const StoryPartItem = ({ part }) => {
  const baseClasses = "mb-4 p-4 rounded-lg max-w-full md:max-w-[85%] lg:max-w-[75%] whitespace-pre-wrap leading-relaxed transition-opacity duration-700 opacity-0 animate-fade-in";
  
  const style = {
    animationFillMode: 'forwards',
  };

  switch (part.type) {
    case 'narrator':
      return <div className={`${baseClasses} bg-gray-900/50 self-start text-gray-300 italic border border-gray-700/50`} style={style}>{part.content}</div>;
    case 'user':
      return <div className={`${baseClasses} bg-yellow-900/40 self-end text-yellow-200 border border-yellow-800/60`} style={style}>{part.content}</div>;
    case 'system':
      return <div className={`${baseClasses} bg-red-900/60 self-center text-red-200 text-sm text-center w-full max-w-full font-bold`} style={style}>{part.content}</div>;
    default:
      return null;
  }
};

const StoryDisplay = ({ storyParts, isProcessingAction, isWaitingForGM }) => {
  const storyEndRef = useRef(null);

  useEffect(() => {
    setTimeout(() => {
        storyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, [storyParts, isProcessingAction]);

  return (
    <div className="flex-grow p-4 md:p-6 overflow-y-auto flex flex-col space-y-4 scrollbar-thin">
       <style>{`
        @keyframes fade-in {
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation-name: fade-in;
        }
      `}</style>
      {storyParts.map((part, index) => (
        <StoryPartItem key={`${part.timestamp}-${index}`} part={part} />
      ))}
      
      {isProcessingAction && (
        <div className="self-start flex items-center space-x-2 p-4 bg-gray-900/50 rounded-lg border border-gray-700/50">
          <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse delay-0"></div>
          <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse delay-200"></div>
          <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse delay-400"></div>
          <span className="text-gray-400 italic">
            {isWaitingForGM ? 'Game Master sedang mengamati...' : 'Narrator sedang merangkai takdir...'}
          </span>
        </div>
      )}
      <div ref={storyEndRef} />
    </div>
  );
};

export default StoryDisplay;