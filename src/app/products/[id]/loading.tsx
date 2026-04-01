export default function Loading() {
  return (
    <div className="loading-container" style={{
      height: '100vh',
      width: '100vw',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#fff',
      zIndex: 9999,
      position: 'fixed',
      top: 0,
      left: 0,
      fontFamily: 'var(--font-serif)'
    }}>
      <div className="spinner" style={{
        width: '40px',
        height: '40px',
        border: '3px solid rgba(255, 105, 180, 0.1)',
        borderTop: '3px solid var(--accent-pink, #ff69b4)',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        marginBottom: '1rem'
      }}></div>
      <p style={{ 
        color: '#333', 
        fontSize: '1rem', 
        letterSpacing: '0.05em',
        textTransform: 'uppercase'
      }}>Preparing your beauty experience...</p>
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
