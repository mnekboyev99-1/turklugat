const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src', 'components');
const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.jsx'));

files.forEach(file => {
  const filePath = path.join(srcDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  let changed = false;

  // Add import if not exists but we need playTurkishAudio
  if (content.includes('playFallbackAudio') || content.includes('new Audio(getAudioPath')) {
    if (!content.includes('playTurkishAudio')) {
      content = content.replace(
        "import { getAudioPath } from '../utils/audioUtils';",
        "import { getAudioPath, playTurkishAudio } from '../utils/audioUtils';"
      );
      changed = true;
    }
    
    // Replace the block
    // Specifically looking for:
    // const localAudio = new Audio(getAudioPath(turkishWord, selectedVoice));
    // localAudio.play().catch(() => {
    //   playFallbackAudio();
    // });
    // OR similar
    
    const blockRegex = /const localAudio = new Audio\(getAudioPath[^\}]+?(?:playFallbackAudio\(\);|new Audio\(url\)\.play\(\)\.catch\(\(\) => \{\}\);)[^\}]+?\}/g;
    
    if (blockRegex.test(content)) {
      content = content.replace(blockRegex, 'playTurkishAudio(turkishWord, selectedVoice);');
      changed = true;
    }
    
    // Wait, Flashcard.jsx has playFallbackAudio defined inside the component. We should remove it or just let the regex handle it.
    // Actually, in Flashcard.jsx, the structure is:
    /*
      const playAudio = (e) => {
        e.stopPropagation();
        
        // Play Turkish audio by word slug
        if (turkishWord && selectedVoice) {
          const localAudio = new Audio(getAudioPath(turkishWord, selectedVoice));
          localAudio.play().catch(() => {
            playFallbackAudio();
          });
        } else {
          playFallbackAudio();
        }
      };
    */
  }

  if (changed) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${file}`);
  }
});
