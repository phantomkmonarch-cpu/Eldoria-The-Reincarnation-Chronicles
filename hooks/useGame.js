import { useState, useEffect, useCallback, useRef } from 'react';
import { generateStory } from '../services/geminiService.js';
import * as db from '../services/dbService.js';

const CURRENT_SAVE_VERSION = 2;
const GM_TIMEOUT = 30000; // 30 seconds

const seasonChapters = {
  1: {
    1: {
      objective: "Bertahan hidup dan menemukan desa terdekat untuk memahami dunia baru ini.",
      defeat: "Menyerah pada keputusasaan atau terbunuh oleh satwa liar di persimpangan jalan."
    },
    2: {
      objective: "Mendapatkan kepercayaan dari penduduk desa dan mempelajari dasar-dasar sihir atau keterampilan bertahan hidup.",
      defeat: "Diusir dari desa karena tindakan ceroboh atau gagal membuktikan diri."
    },
    3: {
      objective: "Menyelidiki laporan tentang 'The Ice Mountain Beast' dan mengalahkannya untuk melindungi wilayah tersebut.",
      defeat: "Kalah dalam pertempuran melawan monster atau gagal menemukan kelemahannya."
    }
  },
  2: {
    1: {
      objective: "Menemukan cara melewati perbatasan Kerajaan Elf, Silvanesti, baik dengan diplomasi atau stealth.",
      defeat: "Ditangkap oleh patroli Elf dan dipenjara tanpa batas waktu."
    },
    2: {
      objective: "Mendapatkan audiensi dengan Ratu Elf, Lyra, dan meyakinkannya tentang ancaman yang lebih besar.",
      defeat: "Gagal dalam diplomasi dan diusir secara permanen dari Silvanesti."
    },
    3: {
      objective: "Membuktikan kelayakan dengan menyelesaikan Ujian Kepercayaan yang diberikan oleh Ratu Lyra.",
      defeat: "Gagal dalam Ujian Kepercayaan, yang mengakibatkan permusuhan total dengan Kerajaan Elf."
    }
  }
};

const getInitialGameContext = (playerName) => ({
  saveVersion: CURRENT_SAVE_VERSION,
  season: 1,
  chapter: 1,
  playerName: playerName,
  chapterObjective: seasonChapters[1][1].objective,
  defeatCondition: seasonChapters[1][1].defeat,
  sanityStrikes: 0,
  characters: {
    'ice_mountain_beast': {
      name: "The Ice Mountain Beast",
      description: "Monster buas dan misterius yang meneror wilayah utara. Dikatakan memiliki kekuatan es yang luar biasa.",
      status: 'Unknown',
      relationship: 'Hostile',
      intimacy: 0,
      intimacyMax: 10,
      difficulty: 'Medium'
    },
    'shadow_of_silvanesti': {
        name: "Shadow of Silvanesti",
        description: "Entitas misterius yang tampaknya menjadi dalang di balik agresi bangsa Elf. Motifnya tidak diketahui.",
        status: 'Unknown',
        relationship: 'Hostile',
        intimacy: 0,
        intimacyMax: 100,
        difficulty: 'Very Hard'
    },
    'queen_lyra': {
        name: "Ratu Elf Lyra",
        description: "Penguasa Silvanesti yang anggun, bijaksana, namun sangat waspada terhadap orang luar. Telah hidup ribuan tahun.",
        status: 'Alive',
        relationship: 'Neutral',
        intimacy: 0,
        intimacyMax: 100,
        difficulty: 'Very Hard'
    }
  }
});

export const useGame = () => {
  const [gameState, setGameState] = useState({
    isLoggedIn: false,
    isLoading: false,
    isProcessingAction: false,
    isWaitingForGM: false,
    error: null,
    storyParts: [],
    gameContext: null,
    currentView: 'login',
  });
  const [playerName, setPlayerName] = useState('');
  const [inputText, setInputText] = useState('');
  const gmTimeoutRef = useRef(null);
  const loggedInPlayerName = useRef(null);

  const saveGame = useCallback((pName, context, story) => {
    if (!pName || !context || !story) return;
    try {
      const saveData = {
        saveVersion: CURRENT_SAVE_VERSION,
        gameContext: context,
        storyParts: story,
      };
      db.saveGameForPlayer(pName, saveData);
    } catch (error) {
      console.error("Gagal menyimpan game:", error);
    }
  }, []);

  const addStoryPart = useCallback((part) => {
    const newPart = { ...part, timestamp: new Date().toISOString() };
    setGameState(prev => {
      const newState = { ...prev, storyParts: [...prev.storyParts, newPart] };
      if (loggedInPlayerName.current && newState.gameContext) {
        saveGame(loggedInPlayerName.current, newState.gameContext, newState.storyParts);
      }
      return newState;
    });
    return newPart;
  }, [saveGame]);

  const handleDefeat = useCallback(() => {
    if (!gameState.gameContext) return;
    
    addStoryPart({ type: 'system', content: `ANDA TELAH GAGAL. Bab ${gameState.gameContext.chapter} akan diulang.`});
    
    setGameState(prev => {
        if (!prev.gameContext) return prev;
        return {
            ...prev,
            gameContext: {
                ...prev.gameContext,
                sanityStrikes: 0,
            }
        };
    });
  }, [addStoryPart, gameState.gameContext]);
  
  const handleChapterComplete = useCallback(() => {
     if (!gameState.gameContext) return;

     const { season, chapter } = gameState.gameContext;
     const nextChapter = chapter + 1;

     addStoryPart({ type: 'system', content: `SELAMAT! Anda telah menyelesaikan Bab ${chapter}. Melanjutkan ke Bab ${nextChapter}.` });

     if (seasonChapters[season] && seasonChapters[season][nextChapter]) {
         const newRule = seasonChapters[season][nextChapter];
         setGameState(prev => {
             if (!prev.gameContext) return prev;
             return {
                 ...prev,
                 gameContext: {
                     ...prev.gameContext,
                     chapter: nextChapter,
                     chapterObjective: newRule.objective,
                     defeatCondition: newRule.defeat,
                     sanityStrikes: 0
                 }
             };
         });
     } else {
        addStoryPart({ type: 'system', content: `Anda telah menyelesaikan semua bab yang tersedia di Season ${season}. Nantikan kelanjutannya!` });
     }
  }, [addStoryPart, gameState.gameContext]);

  const handleLogin = useCallback(async () => {
    const trimmedName = playerName.trim();
    if (!trimmedName) {
      setGameState(prev => ({ ...prev, error: 'Nama pemain tidak boleh kosong.' }));
      return;
    }
    
    setGameState(prev => ({ ...prev, isLoading: true, error: null, currentView: 'loading' }));
    
    const existingSave = db.getPlayerSave(trimmedName);
    
    if (existingSave) {
        loggedInPlayerName.current = trimmedName;
        setGameState({
            isLoggedIn: true,
            gameContext: existingSave.gameContext,
            storyParts: existingSave.storyParts,
            isLoading: false,
            isProcessingAction: false,
            error: null,
            currentView: 'lobby',
        });
    } else {
        loggedInPlayerName.current = trimmedName;
        const initialContext = getInitialGameContext(trimmedName);
        const introStory = {
          type: 'narrator',
          content: `Selamat datang di Eldoria, ${trimmedName}!\n\nAnda terbangun dalam tubuh yang bukan milik Anda di dunia yang asing namun familiar. Ingatan dari kehidupan masa lalu bercampur dengan realitas baru ini.\n\nAnda berdiri di persimpangan jalan. Di sebelah kiri, jalan menuju hutan gelap. Di sebelah kanan, jalur yang mengarah ke desa kecil. Di depan, jalan lurus yang menuju pegunungan di kejauhan.\n\nApa langkah pertama yang akan Anda ambil dalam hidup baru ini?`,
          timestamp: new Date().toISOString()
        };
        const newSaveData = {
            saveVersion: CURRENT_SAVE_VERSION,
            gameContext: initialContext,
            storyParts: [introStory]
        };
        db.createNewPlayer(trimmedName, newSaveData);
        setGameState({
          isLoggedIn: true,
          gameContext: initialContext,
          storyParts: [introStory],
          isLoading: false,
          isProcessingAction: false,
          error: null,
          currentView: 'lobby',
        });
    }
  }, [playerName]);

  const processAIResponse = useCallback((response) => {
    let context = { ...gameState.gameContext };
    let storyContent = response;
    let defeated = false;
    let chapterCompleted = false;

    if (response.includes('[SANITY_STRIKE]')) {
      context.sanityStrikes += 1;
      const strikeMessage = `[PERINGATAN: Tindakan Anda tidak masuk akal. Anda mendapatkan 1 Peringatan Kewarasan. Peringatan ke-2 akan mengakibatkan kegagalan.]`;
      addStoryPart({ type: 'system', content: strikeMessage });
      if(context.sanityStrikes >= 2) {
        storyContent += '\n\n[DEFEAT]';
      }
    }

    const intimacyRegex = /\[INTIMACY_CHANGE: ([\w_]+) ([\-]?\d+)\]/g;
    let match;
    while ((match = intimacyRegex.exec(response)) !== null) {
      const charKey = match[1].toLowerCase();
      const change = parseInt(match[2], 10);
      if (context.characters[charKey]) {
        const oldIntimacy = context.characters[charKey].intimacy;
        const maxIntimacy = context.characters[charKey].intimacyMax;
        const newIntimacy = Math.max(0, Math.min(maxIntimacy, oldIntimacy + change));
        context.characters[charKey].intimacy = newIntimacy;
        const changeText = change > 0 ? `meningkat` : `menurun`;
        addStoryPart({ type: 'system', content: `[Hubungan Anda dengan ${context.characters[charKey].name} ${changeText}.]`});
      }
    }
    
    if (response.includes('[DEFEAT]')) defeated = true;
    if (response.includes('[CHAPTER_COMPLETE]')) chapterCompleted = true;

    storyContent = storyContent.replace(/\[.*?\]/g, '').trim();
    if(storyContent) {
        addStoryPart({ type: 'narrator', content: storyContent });
    }

    setGameState(prev => ({...prev, gameContext: context}));
    
    if (defeated) handleDefeat();
    else if (chapterCompleted) handleChapterComplete();

  }, [gameState.gameContext, addStoryPart, handleDefeat, handleChapterComplete]);
  
  const callAI = useCallback(async (actionText) => {
    if (!gameState.gameContext) return;
    setGameState(prev => ({ ...prev, isWaitingForGM: false, isProcessingAction: true }));
    try {
      const recentHistory = gameState.storyParts
        .slice(-10)
        .map(p => `${p.type === 'user' ? gameState.gameContext?.playerName : p.type.charAt(0).toUpperCase() + p.type.slice(1)}: ${p.content}`)
        .join('\n');
      
      const aiResponse = await generateStory(gameState.gameContext, recentHistory, actionText);
      processAIResponse(aiResponse);
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Terjadi kesalahan tidak dikenal.';
      addStoryPart({ type: 'system', content: `[Sistem Error: ${error}]` });
    } finally {
      setGameState(prev => ({ ...prev, isProcessingAction: false }));
    }
  }, [gameState.gameContext, gameState.storyParts, addStoryPart, processAIResponse]);

  const handleSendAction = useCallback(async () => {
    if (gameState.isProcessingAction || !inputText.trim() || !gameState.gameContext) return;
    
    const actionText = inputText.trim();
    const currentPlayer = loggedInPlayerName.current;
    if (!currentPlayer) return;
    
    setInputText('');
    
    addStoryPart({ type: 'user', content: actionText });
    setGameState(prev => ({ ...prev, isProcessingAction: true, isWaitingForGM: true, error: null }));
    
    gmTimeoutRef.current = window.setTimeout(() => {
        console.log('GM timed out, AI is taking over.');
        db.clearPendingAction(currentPlayer);
        callAI(actionText);
    }, GM_TIMEOUT);

    db.setPendingAction(currentPlayer, actionText);
  }, [inputText, gameState, addStoryPart, callAI]);
  
  useEffect(() => {
    const handleStorageChange = (event) => {
        if (event.key === 'ELDORIA_DATABASE') {
            const currentPlayer = loggedInPlayerName.current;
            if (!currentPlayer) return;

            const dbState = event.newValue ? JSON.parse(event.newValue) : { pendingActions: {} };
            const isActionStillPending = dbState.pendingActions && dbState.pendingActions[currentPlayer];
            
            if (gmTimeoutRef.current && !isActionStillPending) {
                clearTimeout(gmTimeoutRef.current);
                gmTimeoutRef.current = null;
                
                const updatedSaveData = db.getPlayerSave(currentPlayer);
                if (updatedSaveData && updatedSaveData.storyParts.length > gameState.storyParts.length) {
                     setGameState(prev => ({
                        ...prev,
                        storyParts: updatedSaveData.storyParts,
                        gameContext: updatedSaveData.gameContext,
                        isProcessingAction: false,
                        isWaitingForGM: false,
                    }));
                } else {
                    const oldDbState = event.oldValue ? JSON.parse(event.oldValue) : { pendingActions: {} };
                    const pendingAction = oldDbState.pendingActions && oldDbState.pendingActions[currentPlayer];
                    if (pendingAction) {
                        callAI(pendingAction.action);
                    }
                }
            }
        }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
        window.removeEventListener('storage', handleStorageChange);
        if (gmTimeoutRef.current) clearTimeout(gmTimeoutRef.current);
    };
  }, [gameState.storyParts.length, callAI]);

  const handleLogout = useCallback(() => {
    if (window.confirm('Apakah Anda yakin ingin keluar? Anda dapat masuk kembali dengan nama yang sama.')) {
        loggedInPlayerName.current = null;
        setGameState({
          isLoggedIn: false,
          isLoading: false,
          isProcessingAction: false,
          error: null,
          storyParts: [],
          gameContext: null,
          currentView: 'login',
        });
        setPlayerName('');
        setInputText('');
    }
  }, []);

  const handleContinueGame = useCallback(() => setGameState(prev => ({ ...prev, currentView: 'game' })), []);
  const handleReturnToLobby = useCallback(() => setGameState(prev => ({ ...prev, currentView: 'lobby' })), []);
  
  useEffect(() => {
    if (loggedInPlayerName.current && gameState.gameContext && gameState.storyParts.length > 0) {
      saveGame(loggedInPlayerName.current, gameState.gameContext, gameState.storyParts);
    }
  }, [gameState.gameContext, gameState.storyParts, saveGame]);

  return {
    gameState,
    playerName,
    setPlayerName,
    inputText,
    setInputText,
    handleLogin,
    handleSendAction,
    handleLogout,
    handleContinueGame,
    handleReturnToLobby,
  };
};