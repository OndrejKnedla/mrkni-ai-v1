export default function HomePage() {
  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>MrkniAI - Coming Soon</h1>
      <p>We're working hard to bring you the ultimate AI image and video generation experience.</p>
      <p>Sign up to be notified when we launch!</p>
      
      <div style={{ marginTop: '20px' }}>
        <input 
          type="email" 
          placeholder="your.email@example.com" 
          style={{ 
            padding: '10px', 
            width: '300px', 
            marginRight: '10px',
            borderRadius: '4px',
            border: '1px solid #ccc'
          }} 
        />
        <button 
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#10b981', 
            color: 'white', 
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Notify Me
        </button>
      </div>
      
      <div style={{ marginTop: '40px' }}>
        <h2>Follow Us</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <a 
            href="https://www.youtube.com/@MrkniAI" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ 
              padding: '10px 20px', 
              backgroundColor: '#333', 
              color: 'white', 
              textDecoration: 'none',
              borderRadius: '4px'
            }}
          >
            YouTube
          </a>
          <a 
            href="https://www.tiktok.com/@mrkniai" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ 
              padding: '10px 20px', 
              backgroundColor: '#333', 
              color: 'white', 
              textDecoration: 'none',
              borderRadius: '4px'
            }}
          >
            TikTok
          </a>
        </div>
      </div>
    </div>
  );
}
