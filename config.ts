// PENTING: JANGAN PERNAH BAGIKAN FILE INI ATAU MENGUNGGAHNYA KE REPOSITORI PUBLIK.
// File ini HARUS ada di dalam .gitignore Anda.

// SEGERA HAPUS KUNCI API LAMA ANDA DI GOOGLE AI STUDIO DAN BUAT YANG BARU.
// Ganti string di bawah ini dengan kunci API Gemini Anda yang BARU dan aman.

export const API_KEY = "GANTI_DENGAN_KUNCI_API_BARU_ANDA"; // <-- GANTI DENGAN KUNCI API BARU ANDA

if (API_KEY === "GANTI_DENGAN_KUNCI_API_BARU_ANDA") {
  alert("PENTING: Kunci API belum diatur di config.ts. Silakan ganti placeholder dengan kunci API Gemini Anda yang baru dan valid.");
  throw new Error("API_KEY is not set. Please update config.ts with your new, valid Gemini API key.");
}
