export default function Controls({ onNext, disabled }) {
  return (
    <div className="controls">
      <button 
        className="btn btn-dont-know" 
        onClick={() => onNext(false)}
        disabled={disabled}
      >
        ❌ Bilmayman
      </button>
      <button 
        className="btn btn-know" 
        onClick={() => onNext(true)}
        disabled={disabled}
      >
        ✅ Bilaman
      </button>
    </div>
  );
}
