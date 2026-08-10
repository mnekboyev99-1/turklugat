export default function ResultsScreen({ score, total, onContinue }) {
  const percentage = Math.round((score / total) * 100) || 0;
  
  let stars = 0;
  if (percentage >= 90) stars = 3;
  else if (percentage >= 70) stars = 2;
  else if (percentage >= 40) stars = 1;

  return (
    <div className="results-container glass-panel" style={{ padding: '3rem', textAlign: 'center', maxWidth: '500px', width: '100%' }}>
      <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: 'var(--accent-secondary)' }}>
        {percentage >= 70 ? "Tabriklaymiz! 🎉" : "Yaxshi harakat! 💪"}
      </h2>
      
      <div className="stars-container" style={{ fontSize: '4rem', margin: '1.5rem 0', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
        <span style={{ opacity: stars >= 1 ? 1 : 0.2, textShadow: stars >= 1 ? '0 0 20px gold' : 'none' }}>⭐</span>
        <span style={{ opacity: stars >= 2 ? 1 : 0.2, textShadow: stars >= 2 ? '0 0 20px gold' : 'none', transform: 'translateY(-10px)' }}>⭐</span>
        <span style={{ opacity: stars >= 3 ? 1 : 0.2, textShadow: stars >= 3 ? '0 0 20px gold' : 'none' }}>⭐</span>
      </div>
      
      <div className="score-details" style={{ marginBottom: '2rem' }}>
        <p style={{ fontSize: '1.5rem', color: 'var(--text-main)' }}>
          To'g'ri javoblar: <span style={{ fontWeight: 'bold', color: 'var(--success)' }}>{score}</span> / {total}
        </p>
        <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>
          Aniqlik: {percentage}%
        </p>
      </div>
      
      <button 
        className="btn" 
        onClick={onContinue}
        style={{ width: '100%', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))' }}
      >
        Keyingi Bosqich ➔
      </button>
    </div>
  );
}
