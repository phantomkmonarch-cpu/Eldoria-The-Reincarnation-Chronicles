import React from 'react';

const ActionInput = ({
  inputText,
  setInputText,
  handleSendAction,
  isProcessingAction
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputText.trim()) {
      handleSendAction();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (inputText.trim() && !isProcessingAction) {
        handleSendAction();
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t-2 border-yellow-700/30">
      <div className="flex items-center space-x-3 bg-gray-900/50 rounded-lg border-2 border-gray-600 focus-within:border-yellow-500 focus-within:ring-2 focus-within:ring-yellow-500/50 transition-all duration-300">
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Apa yang akan Anda lakukan...?"
          disabled={isProcessingAction}
          rows={2}
          maxLength={1000}
          className="flex-grow bg-transparent p-3 text-lg text-gray-200 placeholder-gray-500 focus:outline-none resize-none"
        />
        <button
          type="submit"
          disabled={isProcessingAction || !inputText.trim()}
          className="m-2 px-6 py-2 bg-yellow-600 text-gray-900 font-bold rounded-md hover:bg-yellow-500 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed transition duration-300"
        >
          Kirim
        </button>
      </div>
    </form>
  );
};

export default ActionInput;