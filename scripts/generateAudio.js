import fs from 'fs';
import path from 'path';
import pkg from '@lixen/edge-tts';
const { EdgeTTS } = pkg;
import wordsData from '../src/data/words.json' with { type: 'json' };

const AUDIO_DIR = path.resolve('public/audio');

// Ensure directory exists
if (!fs.existsSync(AUDIO_DIR)) {
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
}

// Ikkita mashhur turkcha ovoz (Biri Erkak, Biri Ayol kishi)
const VOICES = [
  { id: 'tr-TR-EmelNeural', name: 'Emel' },
  { id: 'tr-TR-AhmetNeural', name: 'Ahmet' }
];

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function generateAudioFile(text, filePath, voiceId) {
  const tts = new EdgeTTS();
  await tts.synthesize(text, voiceId, {});
  await tts.toFile(filePath);
}

async function generateAll() {
  console.log(`Starting generation of ${wordsData.length} audio files in ${VOICES.length} voices...`);
  console.log(`This might take a while. You can use the app while it runs in the background.`);

  let generated = 0;
  let skipped = 0;

  for (let i = 0; i < wordsData.length; i++) {
    const wordData = wordsData[i];
    const turkishWord = wordData["Turkcha (Türkçe)"] || wordData["Turkish"];
    
    if (!turkishWord) continue;

    for (const voice of VOICES) {
      const filePath = path.join(AUDIO_DIR, `${i}_${voice.name}.mp3`);
      
      if (fs.existsSync(filePath)) {
        skipped++;
        continue;
      }

      try {
        await generateAudioFile(turkishWord, filePath, voice.id);
        generated++;
        console.log(`[${i+1}/${wordsData.length}] Saved: ${turkishWord} (${voice.name})`);
        
        await delay(200);
      } catch (err) {
        console.error(`Failed to generate audio for word: ${turkishWord} (${voice.name})`, err.message);
      }
    }
  }

  console.log(`\nDone! Generated: ${generated}, Skipped (already exists): ${skipped}`);
  console.log("All audio files generated successfully!");
}

generateAll();
