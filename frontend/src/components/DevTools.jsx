import { useState } from 'react';
import './DevTools.css';

function DevTools() {
  const [isOpen, setIsOpen] = useState(false);

  const clearAllVotes = async () => {
    try {
      // Generate fingerprint
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.font = '11pt Arial';
      ctx.fillText('fingerprint', 2, 15);
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
      ctx.font = '18pt Arial';
      ctx.fillText('fingerprint', 4, 17);
      const canvasData = canvas.toDataURL();
      
      const fingerprint = crypto.subtle ? 
        await crypto.subtle.digest('SHA-256', new TextEncoder().encode(
          `${navigator.userAgent}-${navigator.language}-${navigator.platform}-${canvasData}`
        )).then(hash => Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')) :
        btoa(`${navigator.userAgent}-${navigator.language}-${navigator.platform}-${canvasData.slice(0, 100)}`);

      // Call backend to delete votes
      const response = await fetch('https://bilete.multi-fights.com/dev/reset-my-votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fingerprint }),
      });
      
      const data = await response.json();
      
      if (data.status) {
        // Clear local storage
        localStorage.clear();
        sessionStorage.clear();
        
        alert(`✓ ${data.deletedCount} voturi șterse din baza de date! Refreshuiază pagina.`);
        window.location.reload();
      } else {
        alert('Eroare la ștergerea voturilor!');
      }
    } catch (error) {
      console.error('Error:', error);
      // Fallback to local clear only
      localStorage.clear();
      sessionStorage.clear();
      alert('✓ Date locale șterse! Refreshuiază pagina.');
      window.location.reload();
    }
  };

  const showFingerprint = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('fingerprint', 2, 2);
    const canvasData = canvas.toDataURL();
    
    const fingerprint = `${navigator.userAgent}-${navigator.language}-${canvasData.slice(0, 50)}`;
    
    alert(`Browser Fingerprint:\n${fingerprint.slice(0, 100)}...`);
    console.log('Full fingerprint:', fingerprint);
  };

  if (!isOpen) {
    return (
      <button className="dev-tools-toggle" onClick={() => setIsOpen(true)}>
        🛠️ Dev Tools
      </button>
    );
  }

  return (
    <div className="dev-tools-panel">
      <div className="dev-tools-header">
        <h3>🛠️ Development Tools</h3>
        <button className="close-btn" onClick={() => setIsOpen(false)}>✕</button>
      </div>
      <div className="dev-tools-buttons">
        <button className="dev-btn reset" onClick={clearAllVotes}>
          🔄 Reset Voturi
        </button>
        <button className="dev-btn info" onClick={showFingerprint}>
          🔍 Vezi Fingerprint
        </button>
        <button className="dev-btn refresh" onClick={() => window.location.reload()}>
          ↻ Refresh Pagina
        </button>
      </div>
      <div className="dev-tools-info">
        <p><strong>Note:</strong> Aceste tools sunt doar pentru development/testing.</p>
        <p>Pentru a testa votarea ca utilizatori diferiți, folosește:</p>
        <ul>
          <li>Browser-e diferite (Chrome, Firefox, Edge)</li>
          <li>Incognito/Private windows</li>
          <li>Telefoane diferite</li>
        </ul>
      </div>
    </div>
  );
}

export default DevTools;
