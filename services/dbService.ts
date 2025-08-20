import type { SaveData, EldoriaDatabase, PendingAction, GameContext, StoryPart } from '../types';

const DB_KEY = 'ELDORIA_DATABASE';

// --- Type Guards & Validators ---

/**
 * Memeriksa apakah suatu objek adalah objek StoryPart yang valid.
 * @param obj Objek yang akan diperiksa.
 * @returns {obj is StoryPart} True jika objek adalah StoryPart yang valid.
 */
const isValidStoryPart = (obj: any): obj is StoryPart => {
    return obj &&
        typeof obj.type === 'string' && ['narrator', 'user', 'system'].includes(obj.type) &&
        typeof obj.content === 'string' &&
        typeof obj.timestamp === 'string';
};

/**
 * Memeriksa apakah suatu objek adalah objek GameContext yang valid.
 * @param obj Objek yang akan diperiksa.
 * @returns {obj is GameContext} True jika objek adalah GameContext yang valid.
 */
const isValidGameContext = (obj: any): obj is GameContext => {
    return obj &&
        typeof obj.saveVersion === 'number' &&
        typeof obj.season === 'number' &&
        typeof obj.chapter === 'number' &&
        typeof obj.playerName === 'string' &&
        typeof obj.chapterObjective === 'string' &&
        typeof obj.defeatCondition === 'string' &&
        typeof obj.sanityStrikes === 'number' &&
        typeof obj.characters === 'object' && obj.characters !== null;
};

/**
 * Memeriksa apakah suatu objek adalah objek SaveData yang valid.
 * @param obj Objek yang akan diperiksa.
 * @returns {obj is SaveData} True jika objek adalah SaveData yang valid.
 */
const isValidSaveData = (obj: any): obj is SaveData => {
    return obj &&
        typeof obj.saveVersion === 'number' &&
        isValidGameContext(obj.gameContext) &&
        Array.isArray(obj.storyParts) && obj.storyParts.every(isValidStoryPart);
};


/**
 * Memeriksa apakah suatu objek adalah objek EldoriaDatabase yang valid.
 * @param obj Objek yang akan diperiksa.
 * @returns {obj is EldoriaDatabase} True jika objek adalah EldoriaDatabase yang valid.
 */
const isValidDatabase = (obj: any): obj is EldoriaDatabase => {
    return obj &&
        typeof obj.players === 'object' && obj.players !== null &&
        typeof obj.pendingActions === 'object' && obj.pendingActions !== null;
};


/**
 * Mengambil database dari localStorage dan memvalidasinya.
 * Jika data tidak ada atau rusak, akan mengembalikan database kosong yang bersih.
 * Ini adalah satu-satunya fungsi yang seharusnya membaca langsung dari localStorage.
 * @returns {EldoriaDatabase} Objek database yang valid.
 */
const getDb = (): EldoriaDatabase => {
    const defaultDb: EldoriaDatabase = { players: {}, pendingActions: {} };
    let data: string | null = null;

    try {
        data = localStorage.getItem(DB_KEY);
    } catch (error) {
        console.error("Kesalahan kritis saat mengakses localStorage:", error);
        return defaultDb;
    }

    if (!data) {
        return defaultDb;
    }

    try {
        const parsedDb = JSON.parse(data);

        if (!isValidDatabase(parsedDb)) {
            console.warn("Struktur database di localStorage tidak valid. Mereset ke default.");
            return defaultDb;
        }

        // Memvalidasi setiap entri pemain secara individual untuk mengisolasi data yang rusak
        const validatedPlayers: Record<string, SaveData> = {};
        for (const playerName in parsedDb.players) {
            if (Object.prototype.hasOwnProperty.call(parsedDb.players, playerName)) {
                const playerData = parsedDb.players[playerName];
                if (isValidSaveData(playerData)) {
                    validatedPlayers[playerName] = playerData;
                } else {
                    console.warn(`Data simpanan untuk pemain "${playerName}" rusak dan telah dilewati.`);
                }
            }
        }
        
        parsedDb.players = validatedPlayers;
        return parsedDb;

    } catch (error) {
        console.error("Gagal mem-parsing data DB dari localStorage. Mereset ke default.", error);
        return defaultDb;
    }
};

/**
 * Menyimpan objek database ke localStorage dan memberi tahu tab lain tentang perubahan tersebut.
 * Ini adalah satu-satunya fungsi yang seharusnya menulis langsung ke localStorage.
 * @param {EldoriaDatabase} db Objek database untuk disimpan.
 */
const saveDb = (db: EldoriaDatabase) => {
    try {
        const oldValue = localStorage.getItem(DB_KEY);
        const newValue = JSON.stringify(db);
        localStorage.setItem(DB_KEY, newValue);
        
        // Mengirim event storage secara manual agar tab lain (seperti admin) dapat bereaksi.
        // Ini memastikan konsistensi bahkan jika browser tidak selalu mengirimkannya secara otomatis.
        window.dispatchEvent(new StorageEvent('storage', {
            key: DB_KEY,
            oldValue,
            newValue,
            storageArea: localStorage,
        }));
    } catch (error) {
        console.error("Kesalahan kritis saat menulis ke simulated DB:", error);
    }
};

// --- API Publik untuk Manajemen Data Pemain ---

/**
 * Mengambil daftar semua pemain beserta data simpanan mereka.
 * @returns {{ name: string, saveData: SaveData }[]} Array objek pemain.
 */
export const getAllPlayers = (): { name: string, saveData: SaveData }[] => {
    const db = getDb();
    return Object.entries(db.players).map(([name, saveData]) => ({ name, saveData }));
};

/**
 * Mengambil data simpanan untuk satu pemain.
 * @param {string} playerName Nama pemain yang akan diambil.
 * @returns {SaveData | null} Data simpanan pemain atau null jika tidak ditemukan.
 */
export const getPlayerSave = (playerName: string): SaveData | null => {
    const db = getDb();
    return db.players[playerName] || null;
};

/**
 * Menyimpan atau memperbarui data simpanan untuk seorang pemain.
 * @param {string} playerName Nama pemain yang akan disimpan.
 * @param {SaveData} saveData Objek SaveData yang akan disimpan.
 */
export const saveGameForPlayer = (playerName: string, saveData: SaveData): void => {
    if (!playerName || !isValidSaveData(saveData)) {
        console.error("Upaya menyimpan data pemain yang tidak valid atau tanpa nama pemain.");
        return;
    }
    const db = getDb();
    db.players[playerName] = saveData;
    saveDb(db);
};

/**
 * Membuat entri baru untuk pemain jika belum ada.
 * @param {string} playerName Nama pemain baru.
 * @param {SaveData} initialSaveData Data simpanan awal untuk pemain baru.
 * @returns {boolean} True jika pemain berhasil dibuat, false jika sudah ada.
 */
export const createNewPlayer = (playerName: string, initialSaveData: SaveData): boolean => {
    const db = getDb();
    if (db.players[playerName]) {
        console.warn(`Pemain dengan nama "${playerName}" sudah ada.`);
        return false;
    }
    if (!isValidSaveData(initialSaveData)) {
        console.error("Upaya membuat pemain baru dengan data awal yang tidak valid.");
        return false;
    }
    db.players[playerName] = initialSaveData;
    saveDb(db);
    return true;
};

/**
 * Menghapus semua data untuk seorang pemain.
 * @param {string} playerName Nama pemain yang akan dihapus.
 */
export const deletePlayer = (playerName: string): void => {
    const db = getDb();
    if (db.players[playerName] || db.pendingActions[playerName]) {
        delete db.players[playerName];
        delete db.pendingActions[playerName]; // Juga hapus tindakan yang tertunda
        saveDb(db);
    }
};

// --- API Publik untuk Aksi Live GM ---

/**
 * Mengambil semua tindakan pemain yang tertunda menunggu respons GM.
 * @returns {Record<string, PendingAction>} Objek tindakan yang tertunda.
 */
export const getAllPendingActions = (): Record<string, PendingAction> => {
    const db = getDb();
    return db.pendingActions;
};

/**
 * Menetapkan tindakan yang tertunda untuk seorang pemain.
 * @param {string} playerName Nama pemain yang melakukan tindakan.
 * @param {string} action Teks tindakan.
 */
export const setPendingAction = (playerName: string, action: string): void => {
    const db = getDb();
    db.pendingActions[playerName] = { action, timestamp: Date.now() };
    saveDb(db);
};

/**
 * Menghapus tindakan yang tertunda untuk seorang pemain (setelah direspons atau waktu habis).
 * @param {string} playerName Nama pemain yang tindakannya akan dihapus.
 */
export const clearPendingAction = (playerName: string): void => {
    const db = getDb();
    if (db.pendingActions[playerName]) {
        delete db.pendingActions[playerName];
        saveDb(db);
    }
};
