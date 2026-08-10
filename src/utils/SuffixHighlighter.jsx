export default function SuffixHighlighter({ word }) {
  if (!word) return null;

  // Very basic NLP rules for Turkish suffixes (simplified for MVP)
  const suffixes = [
    'lar', 'ler', // Plurals
    'yor', // Present continuous
    'ecek', 'acak', // Future
    'di', 'dı', 'du', 'dü', 'ti', 'tı', 'tu', 'tü', // Past
    'mek', 'mak', // Infinitive
    'im', 'ım', 'um', 'üm', 'sin', 'sın', 'sun', 'sün', // Person
    'da', 'de', 'ta', 'te', // Locative
    'dan', 'den', 'tan', 'ten' // Ablative
  ];

  let root = word;
  let suffix = "";

  // Try to find the longest matching suffix at the end of the word
  // Note: This is highly simplified and won't catch complex agglutinations perfectly, 
  // but it demonstrates the "Killer Feature" concept well.
  
  // Sort by length descending to match longer suffixes first (e.g. 'ecek' before 'ek')
  const sortedSuffixes = [...suffixes].sort((a, b) => b.length - a.length);

  for (let s of sortedSuffixes) {
    if (word.length > s.length + 2 && word.toLowerCase().endsWith(s)) {
      root = word.slice(0, -s.length);
      suffix = word.slice(-s.length);
      break;
    }
  }

  if (!suffix) {
    return <span>{word}</span>;
  }

  return (
    <span>
      <span style={{ color: 'var(--text-main)' }}>{root}</span>
      <span style={{ color: 'var(--accent-secondary)' }}>{suffix}</span>
    </span>
  );
}
