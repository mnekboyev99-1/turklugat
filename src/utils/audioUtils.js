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
