export function generateCrossword(wordList) {
  // Deep copy and shuffle the word list to try different combinations
  const shuffled = [...wordList].sort(() => Math.random() - 0.5);
  // Sort by length descending to start with longer words
  shuffled.sort((a, b) => b.word.length - a.word.length);

  const GRID_SIZE = 30; // 30x30 max
  const grid = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));
  const placedWords = [];

  const canPlaceWord = (word, startRow, startCol, isHorizontal) => {
    // Check bounds
    if (isHorizontal) {
      if (startCol + word.length > GRID_SIZE || startCol < 0) return false;
    } else {
      if (startRow + word.length > GRID_SIZE || startRow < 0) return false;
    }

    let intersections = 0;

    for (let i = 0; i < word.length; i++) {
      const r = isHorizontal ? startRow : startRow + i;
      const c = isHorizontal ? startCol + i : startCol;

      if (grid[r][c] !== null) {
        if (grid[r][c].char !== word[i]) {
          return false; // Collision with a different letter
        }
        intersections++;
      } else {
        // Check neighbors to avoid adjacent words touching parallelly
        const checkNeighbors = (nr, nc) => {
          if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE) {
            return grid[nr][nc] !== null;
          }
          return false;
        };

        if (isHorizontal) {
          if (checkNeighbors(r - 1, c) || checkNeighbors(r + 1, c)) return false;
          // check before start and after end
          if (i === 0 && checkNeighbors(r, c - 1)) return false;
          if (i === word.length - 1 && checkNeighbors(r, c + 1)) return false;
        } else {
          if (checkNeighbors(r, c - 1) || checkNeighbors(r, c + 1)) return false;
          // check before start and after end
          if (i === 0 && checkNeighbors(r - 1, c)) return false;
          if (i === word.length - 1 && checkNeighbors(r + 1, c)) return false;
        }
      }
    }

    // Must intersect with at least one word, unless it's the first word
    if (placedWords.length > 0 && intersections === 0) return false;

    return true;
  };

  const placeWord = (wordObj, startRow, startCol, isHorizontal) => {
    const word = wordObj.word;
    for (let i = 0; i < word.length; i++) {
      const r = isHorizontal ? startRow : startRow + i;
      const c = isHorizontal ? startCol + i : startCol;
      grid[r][c] = {
        char: word[i],
        wordIds: grid[r][c] ? [...grid[r][c].wordIds, wordObj.id] : [wordObj.id]
      };
    }
    
    placedWords.push({
      ...wordObj,
      startRow,
      startCol,
      isHorizontal,
      length: word.length
    });
  };

  // Place first word at center
  if (shuffled.length > 0) {
    const first = shuffled[0];
    const startRow = Math.floor(GRID_SIZE / 2);
    const startCol = Math.floor((GRID_SIZE - first.word.length) / 2);
    placeWord(first, startRow, startCol, true);
    shuffled.splice(0, 1);
  }

  // Try to place the rest
  let wordsToPlace = [...shuffled];
  let iterations = 0;

  while (wordsToPlace.length > 0 && iterations < 100) {
    iterations++;
    const wordObj = wordsToPlace.shift();
    let placed = false;

    // Find all possible intersections with currently placed words
    for (const placedWord of placedWords) {
      if (placed) break;

      for (let i = 0; i < wordObj.word.length; i++) {
        if (placed) break;

        for (let j = 0; j < placedWord.length; j++) {
          if (wordObj.word[i] === placedWord.word[j]) {
            // Found a matching character
            const isHorizontal = !placedWord.isHorizontal;
            let startRow, startCol;

            if (isHorizontal) {
              startRow = placedWord.startRow + j;
              startCol = placedWord.startCol - i;
            } else {
              startRow = placedWord.startRow - i;
              startCol = placedWord.startCol + j;
            }

            if (canPlaceWord(wordObj.word, startRow, startCol, isHorizontal)) {
              placeWord(wordObj, startRow, startCol, isHorizontal);
              placed = true;
              break;
            }
          }
        }
      }
    }

    if (!placed) {
      // Put it back to try again later, maybe other words will provide anchors
      // To prevent infinite loops, we just drop it after too many iterations (handled by loop bound)
      wordsToPlace.push(wordObj);
    }
  }

  // Determine actual bounds to crop the grid
  let minRow = GRID_SIZE, maxRow = -1, minCol = GRID_SIZE, maxCol = -1;
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c] !== null) {
        minRow = Math.min(minRow, r);
        maxRow = Math.max(maxRow, r);
        minCol = Math.min(minCol, c);
        maxCol = Math.max(maxCol, c);
      }
    }
  }

  // If no words placed (somehow)
  if (maxRow === -1) {
    return { grid: [], words: [], width: 0, height: 0 };
  }

  const width = maxCol - minCol + 1;
  const height = maxRow - minRow + 1;
  
  const croppedGrid = [];
  for (let r = minRow; r <= maxRow; r++) {
    const row = [];
    for (let c = minCol; c <= maxCol; c++) {
      row.push(grid[r][c]);
    }
    croppedGrid.push(row);
  }

  // Adjust placed words coordinates
  const finalWords = placedWords.map((w, idx) => ({
    ...w,
    startRow: w.startRow - minRow,
    startCol: w.startCol - minCol,
    number: idx + 1
  }));

  // Assign numbers to cells for UI
  for (const w of finalWords) {
    const cell = croppedGrid[w.startRow][w.startCol];
    if (!cell.number) {
      cell.number = w.number;
    }
  }

  return { grid: croppedGrid, words: finalWords, width, height };
}
