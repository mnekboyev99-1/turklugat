import { getAudioPath } from './audioUtils';
import wordsData from '../data/words.json';

const VOICES = ['Emel', 'Ahmet'];
const CACHE_NAME = 'turk-audio-cache';
const CHUNK_SIZE = 50;

/**
 * Downloads all audio files to the cache.
 * @param {function} onProgress - Callback function that receives percentage (0-100)
 * @returns {Promise<boolean>} True if successful, false if failed
 */
export const downloadAudioFiles = async (onProgress = () => {}) => {
  try {
    const urlsToCache = [];
    
    // Barcha URL larni yig'ish
    wordsData.forEach(w => {
      const tr = w["Turkcha (Türkçe)"] || w["Turkish"];
      if (tr) {
        VOICES.forEach(voice => {
          urlsToCache.push(getAudioPath(tr, voice));
        });
      }
    });

    // Duplikatlarni olib tashlash
    const uniqueUrls = [...new Set(urlsToCache)];
    const total = uniqueUrls.length;
    let downloaded = 0;

    const cache = await caches.open(CACHE_NAME);

    // Bo'lib-bo'lib yuklash (Chunking)
    for (let i = 0; i < total; i += CHUNK_SIZE) {
      const chunk = uniqueUrls.slice(i, i + CHUNK_SIZE);
      
      await Promise.all(chunk.map(async (url) => {
        try {
          // Avval keshda bormi tekshiramiz
          const match = await cache.match(url);
          if (!match) {
            await cache.add(url);
          }
        } catch (err) {
          console.error(`Failed to cache ${url}`, err);
        }
      }));

      downloaded += chunk.length;
      if (downloaded > total) downloaded = total;
      onProgress(Math.round((downloaded / total) * 100));
    }

    // Yakunlash
    localStorage.setItem('turk_vocab_audio_downloaded', 'true');
    return true;
  } catch (error) {
    console.error("Yuklashda xatolik yuz berdi:", error);
    return false;
  }
};
