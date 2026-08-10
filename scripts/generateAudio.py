import json
import os
import asyncio
import re
import edge_tts

# Paths
WORDS_FILE = os.path.join(os.path.dirname(__file__), '../src/data/words.json')
AUDIO_DIR = os.path.join(os.path.dirname(__file__), '../public/audio')

if not os.path.exists(AUDIO_DIR):
    os.makedirs(AUDIO_DIR)

VOICES = [
    {'id': 'tr-TR-EmelNeural', 'name': 'Emel'},
    {'id': 'tr-TR-AhmetNeural', 'name': 'Ahmet'}
]

def get_audio_slug(word):
    """
    JS dagi getAudioSlug() funksiyasi bilan bir xil mantiq.
    "ad (isim)" -> "ad_isim", "ağaç" -> "ağaç"
    """
    if not word:
        return ''
    # Replace spaces and special punctuation with underscore
    slug = re.sub(r'[\s()\[\]{}/\\,;:\'"!?@#$%^&*+=<>|~`]', '_', word.strip())
    # Collapse multiple underscores
    slug = re.sub(r'_+', '_', slug)
    # Strip leading/trailing underscores
    slug = slug.strip('_')
    return slug

async def generate_all():
    with open(WORDS_FILE, 'r', encoding='utf-8') as f:
        words_data = json.load(f)
        
    print(f"Starting generation of {len(words_data)} words in {len(VOICES)} voices...")
    print(f"Naming: word-slug based (e.g., araba_Emel.mp3)")
    
    generated = 0
    skipped = 0
    errors = 0

    for i, word_data in enumerate(words_data):
        turkish_word = word_data.get("Turkcha (Türkçe)") or word_data.get("Turkish")
        if not turkish_word:
            continue
            
        slug = get_audio_slug(turkish_word)
        if not slug:
            continue
            
        for voice in VOICES:
            file_name = f"{slug}_{voice['name']}.mp3"
            file_path = os.path.join(AUDIO_DIR, file_name)
            
            if os.path.exists(file_path):
                skipped += 1
                continue
                
            try:
                communicate = edge_tts.Communicate(turkish_word, voice['id'])
                await communicate.save(file_path)
                generated += 1
                print(f"[{i+1}/{len(words_data)}] Saved: {file_name}")
                
                # Small delay to avoid rate limits
                await asyncio.sleep(0.15)
            except Exception as e:
                errors += 1
                print(f"Error for {turkish_word} ({voice['name']}): {e}")
                
    print(f"\nDone! Generated: {generated}, Skipped: {skipped}, Errors: {errors}")
    print("All audio files generated successfully!")

if __name__ == "__main__":
    asyncio.run(generate_all())

