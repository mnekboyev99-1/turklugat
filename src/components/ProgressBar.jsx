export default function ProgressBar({ current, total, learned }) {
  const percentage = total > 0 ? (current / total) * 100 : 0;
  
  return (
    <div className="progress-container">
      <div className="stats">
        <span>Yodlangan: <strong style={{color: "var(--success)"}}>{learned}</strong> so'z</span>
        <span>{current} / {total}</span>
      </div>
      <div className="progress-bar-bg">
        <div 
          className="progress-bar-fill" 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
}
