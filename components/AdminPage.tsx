import React, { useState, useEffect, useCallback } from 'react';
import type { SaveData, StoryPart, GameContext, PendingAction } from '../types';
import StoryDisplay from './StoryDisplay';
import * as db from '../services/dbService';

const GM_TIMEOUT = 30000;

const AdminPage: React.FC = () => {
  const [players, setPlayers] = useState<{name: string, saveData: SaveData}[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);

  const [editedContext, setEditedContext] = useState<Partial<GameContext>>({});
  const [editedStory, setEditedStory] = useState<StoryPart[]>([]);
  const [editedChars, setEditedChars] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [mode, setMode] = useState<'live' | 'editor'>('live');

  const [pendingActions, setPendingActions] = useState<Record<string, PendingAction>>({});
  const [gmResponse, setGmResponse] = useState('');
  const [activeGmPlayer, setActiveGmPlayer] = useState<string | null>(null);
  const [, setTick] = useState(0); // For re-rendering countdowns

  const loadAllData = useCallback(() => {
    const allPlayers = db.getAllPlayers();
    setPlayers(allPlayers);
    const allPending = db.getAllPendingActions();
    setPendingActions(allPending);

    if (selectedPlayer && !allPlayers.find(p => p.name === selectedPlayer)) {
        setSelectedPlayer(null);
        setEditedContext({});
        setEditedStory([]);
        setEditedChars('');
    } else if (selectedPlayer) {
        const playerData = allPlayers.find(p => p.name === selectedPlayer);
        if (playerData) {
            setEditedContext(playerData.saveData.gameContext);
            setEditedStory(playerData.saveData.storyParts);
            setEditedChars(JSON.stringify(playerData.saveData.gameContext.characters, null, 2));
        }
    }
  }, [selectedPlayer]);

  useEffect(() => {
    loadAllData();
    const pollInterval = setInterval(loadAllData, 2000);
    const tickInterval = setInterval(() => setTick(t => t + 1), 1000);
    window.addEventListener('storage', loadAllData);
    return () => {
      clearInterval(pollInterval);
      clearInterval(tickInterval);
      window.removeEventListener('storage', loadAllData);
    };
  }, [loadAllData]);

  const handlePlayerSelect = (playerName: string) => {
    if (playerName) {
        setSelectedPlayer(playerName);
        const playerData = players.find(p => p.name === playerName);
        if (playerData) {
            setEditedContext(playerData.saveData.gameContext);
            setEditedStory(playerData.saveData.storyParts);
            setEditedChars(JSON.stringify(playerData.saveData.gameContext.characters, null, 2));
            setError(null);
            setSuccess(null);
        }
    } else {
        setSelectedPlayer(null);
    }
  };

  const handleGmResponse = (playerName: string) => {
    if (!gmResponse.trim()) return;
    const playerData = db.getPlayerSave(playerName);
    if (!playerData) return;

    const newStoryPart: StoryPart = {
      type: 'narrator',
      content: gmResponse.trim(),
      timestamp: new Date().toISOString()
    };
    playerData.storyParts.push(newStoryPart);
    db.saveGameForPlayer(playerName, playerData);
    db.clearPendingAction(playerName);
    setGmResponse('');
    setActiveGmPlayer(null);
    loadAllData();
  };

  const handlePassToAI = (playerName: string) => {
    db.clearPendingAction(playerName);
    loadAllData();
  };
  
  const handleContextChange = (field: keyof GameContext, value: string | number) => setEditedContext(prev => ({ ...prev, [field]: value }));
  const handleStoryChange = (index: number, field: keyof StoryPart, value: string) => setEditedStory(prev => prev.map((part, i) => i === index ? { ...part, [field]: value } : part));
  const deleteStoryPart = (index: number) => { if(window.confirm('Hapus entri cerita ini?')) { setEditedStory(prev => prev.filter((_, i) => i !== index)); }};
  const addStoryPart = () => setEditedStory(prev => [...prev, {type: 'narrator', content: 'Narasi baru...', timestamp: new Date().toISOString()}]);

  const handleSaveChanges = () => {
    if (!selectedPlayer) { setError("Pilih pemain terlebih dahulu."); return; }
    const currentSaveData = db.getPlayerSave(selectedPlayer);
    if (!currentSaveData) { setError("Data pemain tidak ditemukan."); return; }
    try {
      const newCharacters = JSON.parse(editedChars);
      const newGameContext: GameContext = { ...currentSaveData.gameContext, ...editedContext as GameContext, characters: newCharacters };
      const newSaveData: SaveData = { ...currentSaveData, gameContext: newGameContext, storyParts: editedStory };
      db.saveGameForPlayer(selectedPlayer, newSaveData);
      setSuccess('Perubahan berhasil disimpan!');
      loadAllData();
    } catch (e) {
      setError('Gagal menyimpan. Pastikan format JSON Karakter Dossier valid.');
    }
  };

  const handleDeleteSave = () => {
    if (!selectedPlayer) { setError("Pilih pemain terlebih dahulu."); return; }
    if (window.confirm(`Yakin ingin menghapus semua data untuk pemain "${selectedPlayer}"?`)) {
      db.deletePlayer(selectedPlayer);
      loadAllData();
    }
  };

  const getCountdown = (timestamp: number) => Math.ceil(Math.max(0, GM_TIMEOUT - (Date.now() - timestamp)) / 1000);

  const selectedPlayerData = selectedPlayer ? players.find(p => p.name === selectedPlayer)?.saveData : null;

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 p-4">
      <div className="w-full max-w-7xl mx-auto bg-gray-800/50 rounded-lg shadow-2xl border border-red-700/20">
        <header className="p-4 border-b-2 border-red-700/30 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-red-400 font-cinzel">Dasbor Admin Eldoria</h1>
          <div className="flex items-center space-x-4">
            <div className="bg-gray-900 p-1 rounded-md border border-gray-600">
                <button onClick={() => setMode('live')} className={`px-3 py-1 text-sm rounded ${mode === 'live' ? 'bg-red-700 text-white' : 'bg-transparent text-gray-400'}`}>Live GM</button>
                <button onClick={() => setMode('editor')} className={`px-3 py-1 text-sm rounded ${mode === 'editor' ? 'bg-red-700 text-white' : 'bg-transparent text-gray-400'}`}>Save Editor</button>
            </div>
            <select onChange={(e) => handlePlayerSelect(e.target.value)} value={selectedPlayer || ''} className="bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white min-w-[150px]">
              <option value="" disabled>Pilih Pemain...</option>
              {players.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
            </select>
          </div>
        </header>

        {mode === 'editor' && (!selectedPlayer ? (
          <div className="p-10 text-center text-gray-500">Pilih pemain dari dropdown di atas untuk mengedit data mereka.</div>
        ) : (
        <div className="p-6">
            {error && <div className="mb-4 p-3 bg-red-900/70 border border-red-700 rounded-md text-red-200">{error}</div>}
            {success && <div className="mb-4 p-3 bg-green-900/70 border border-green-700 rounded-md text-green-200">{success}</div>}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 space-y-4"><h2 className="text-2xl text-yellow-400 font-cinzel border-b border-yellow-700/50 pb-2">Game Context</h2>
                <input type="text" value={editedContext.playerName || ''} onChange={e => handleContextChange('playerName', e.target.value)} className="w-full p-2 bg-gray-900 border-2 border-gray-600 rounded-md"/>
                 <div className="grid grid-cols-3 gap-2"><input type="number" value={editedContext.season || 1} onChange={e => handleContextChange('season', parseInt(e.target.value))} className="w-full p-2 bg-gray-900 border-2 border-gray-600 rounded-md"/><input type="number" value={editedContext.chapter || 1} onChange={e => handleContextChange('chapter', parseInt(e.target.value))} className="w-full p-2 bg-gray-900 border-2 border-gray-600 rounded-md"/><input type="number" value={editedContext.sanityStrikes || 0} onChange={e => handleContextChange('sanityStrikes', parseInt(e.target.value))} className="w-full p-2 bg-gray-900 border-2 border-gray-600 rounded-md"/></div>
                <textarea value={editedContext.chapterObjective || ''} onChange={e => handleContextChange('chapterObjective', e.target.value)} rows={3} className="w-full p-2 bg-gray-900 border-2 border-gray-600 rounded-md"/>
                <textarea value={editedContext.defeatCondition || ''} onChange={e => handleContextChange('defeatCondition', e.target.value)} rows={3} className="w-full p-2 bg-gray-900 border-2 border-gray-600 rounded-md"/>
                <textarea value={editedChars} onChange={e => setEditedChars(e.target.value)} rows={10} className="w-full p-2 bg-gray-900 border-2 border-gray-600 rounded-md font-mono text-sm"/>
              </div>
              <div className="lg:col-span-2"><div className="flex justify-between items-center border-b border-yellow-700/50 pb-2"><h2 className="text-2xl text-yellow-400 font-cinzel">Story Log</h2><button onClick={addStoryPart} className="px-3 py-1 bg-green-700 text-sm rounded hover:bg-green-600">+</button></div>
                <div className="mt-4 space-y-3 max-h-[70vh] overflow-y-auto pr-2 scrollbar-thin">
                  {editedStory.map((part, index) => (
                    <div key={index} className="p-3 bg-gray-900/70 rounded-md border border-gray-700">
                      <div className="flex justify-between items-center mb-2">
                        <select value={part.type} onChange={e => handleStoryChange(index, 'type', e.target.value)} className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm"><option value="narrator">Narrator</option> <option value="user">User</option> <option value="system">System</option></select>
                        <button onClick={() => deleteStoryPart(index)} className="text-red-500 hover:text-red-400 text-xl font-bold">&times;</button>
                      </div><textarea value={part.content} onChange={e => handleStoryChange(index, 'content', e.target.value)} rows={4} className="w-full p-2 bg-gray-800 border border-gray-600 rounded-md text-sm"/></div>
                  ))}</div></div></div>
            <div className="mt-6 pt-6 border-t border-red-700/30 flex items-center space-x-4"><button onClick={handleSaveChanges} className="px-6 py-3 bg-yellow-600 text-gray-900 font-bold text-lg rounded hover:bg-yellow-500">Simpan Perubahan</button><button onClick={handleDeleteSave} className="px-5 py-2 bg-red-800 text-red-100 font-semibold rounded hover:bg-red-700">Hapus Pemain</button></div>
        </div>
        ))}

        {mode === 'live' && (
          <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-120px)]">
            <div className="lg:col-span-2 flex flex-col h-full"><h2 className="text-2xl text-yellow-400 font-cinzel border-b border-yellow-700/50 pb-2 mb-4 flex-shrink-0">Story Feed (Pemain: {selectedPlayer || 'N/A'})</h2>
              <div className="flex-grow overflow-y-hidden -mr-4 bg-black/20 rounded-md">{selectedPlayerData ? <StoryDisplay storyParts={selectedPlayerData.storyParts} isProcessingAction={false} /> : <div className="p-10 text-center text-gray-500">Pilih pemain untuk melihat cerita mereka.</div>}</div>
            </div>
            <div className="lg:col-span-1 h-full flex flex-col"><h2 className="text-2xl text-yellow-400 font-cinzel border-b border-yellow-700/50 pb-2 mb-4">Intervensi GM</h2>
              <div className="space-y-4 overflow-y-auto pr-2 scrollbar-thin">
                {Object.keys(pendingActions).length === 0 ? (<div className="flex-grow flex items-center justify-center p-4 bg-gray-900/50 border border-gray-700 rounded-lg"><p className="text-gray-400 text-center italic">Menunggu tindakan pemain...</p></div>) : 
                (Object.entries(pendingActions).map(([name, action]) => {
                  const isResponding = activeGmPlayer === name;
                  return (
                  <div key={name} className={`p-4 bg-gray-900/70 border-2 rounded-lg transition-all ${isResponding ? 'border-yellow-500' : 'border-red-500/50'}`}>
                    <div className="flex justify-between items-center"><h3 className="text-red-400 font-bold text-lg">{name}</h3><div className="text-lg font-mono bg-red-900/50 px-2 rounded">{getCountdown(action.timestamp)}s</div></div>
                    <p className="mt-2 p-3 bg-gray-800 rounded text-yellow-200 italic">"{action.action}"</p>
                    {isResponding ? (
                      <div className="mt-3">
                        <textarea value={gmResponse} onChange={e => setGmResponse(e.target.value)} placeholder={`Tulis respons untuk ${name}...`} rows={5} className="w-full my-2 p-2 bg-gray-800 border border-gray-600 rounded-md text-sm"/>
                        <div className="grid grid-cols-2 gap-2"><button onClick={() => handleGmResponse(name)} disabled={!gmResponse.trim()} className="w-full px-4 py-2 bg-yellow-600 text-gray-900 font-bold rounded hover:bg-yellow-500 disabled:bg-gray-700">Kirim</button><button onClick={() => setActiveGmPlayer(null)} className="w-full px-4 py-2 bg-gray-600 text-gray-200 rounded hover:bg-gray-500">Batal</button></div>
                      </div>
                    ) : (
                      <div className="mt-3 grid grid-cols-2 gap-2"><button onClick={() => {setActiveGmPlayer(name); setGmResponse('')}} className="w-full px-4 py-2 bg-yellow-700 text-yellow-100 font-semibold rounded hover:bg-yellow-600">Jawab</button><button onClick={() => handlePassToAI(name)} className="w-full px-4 py-2 bg-gray-600 text-gray-200 rounded hover:bg-gray-500">Lewatkan ke AI</button></div>
                    )}
                  </div>
                )})
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
