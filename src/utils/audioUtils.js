/**
 * Turkcha so'zdan audio fayl uchun slug yaratadi.
 * Masalan: "ad (isim)" → "ad_isim", "ağaç" → "ağaç"
 */
export function getAudioSlug(word) {
  if (!word) return '';
  return word
    .trim()
    .replace(/[\s()[\]{}/\\,;:'"!?@#$%^&*+=<>|~`]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

/**
 * So'z va ovoz nomi bo'yicha audio fayl yo'lini qaytaradi
 * @param {string} turkishWord - Turkcha so'z
 * @param {string} voice - Ovoz nomi ('Emel' yoki 'Ahmet')
 * @returns {string} - Audio fayl URL yo'li
 */
export function getAudioPath(turkishWord, voice) {
  const slug = getAudioSlug(turkishWord);
  return `/audio/${slug}_${voice}.mp3`;
}

/**
 * Turkcha so'zni oflayn/onlayn rejimda o'qiydi
 */
export async function playTurkishAudio(turkishWord, selectedVoice) {
  if (!turkishWord) return;
  
  const url = getAudioPath(turkishWord, selectedVoice);
  
  const playFallback = () => {
    const text = encodeURIComponent(turkishWord);
    const fbUrl = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=tr&q=${text}`;
    new Audio(fbUrl).play().catch(() => {
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(turkishWord);
        utterance.lang = 'tr-TR';
        window.speechSynthesis.speak(utterance);
      }
    });
  };

  try {
    // Try Cache API first to bypass Safari Range Request issues
    if ('caches' in window) {
      const cache = await caches.open('turk-audio-cache');
      const response = await cache.match(url);
      if (response) {
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        const audio = new Audio(objectUrl);
        audio.play().catch(playFallback);
        return;
      }
    }
  } catch(e) {}
  
  // Fallback to normal network request
  new Audio(url).play().catch(playFallback);
}
