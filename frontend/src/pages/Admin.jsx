import { useState, useEffect } from 'react';
import './Admin.css';

const API_URL = 'https://bilete.multi-fights.com';

function Admin() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [statistics, setStatistics] = useState(null);
  const [votingEnabled, setVotingEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      fetchStatistics();
      const interval = setInterval(fetchStatistics, 5000); // Refresh every 5 seconds
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const fetchStatistics = async () => {
    try {
      const response = await fetch(`${API_URL}/admin/statistics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await response.json();
      
      if (data.status) {
        setStatistics(data);
        setVotingEnabled(data.votingEnabled);
      } else {
        setIsAuthenticated(false);
        setMessage('Sesiune expirată. Te rog să te autentifici din nou.');
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch(`${API_URL}/admin/statistics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await response.json();
      
      if (data.status) {
        setIsAuthenticated(true);
        setStatistics(data);
        setVotingEnabled(data.votingEnabled);
        setMessage('');
      } else {
        setMessage('Parolă incorectă!');
      }
    } catch (error) {
      setMessage('Eroare de conexiune!');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVoting = async () => {
    setLoading(true);
    
    try {
      const response = await fetch(`${API_URL}/admin/toggle-voting`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, enabled: !votingEnabled }),
      });
      const data = await response.json();
      
      if (data.status) {
        setVotingEnabled(data.votingEnabled);
        setMessage(data.message);
        await fetchStatistics();
      } else {
        setMessage(data.message);
      }
    } catch (error) {
      setMessage('Eroare la schimbarea statusului!');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="admin-login">
        <div className="login-card">
          <h1 className="login-title">🔐 Admin Panel</h1>
          <p className="login-subtitle">Panou de Administrare Votare</p>
          
          <form onSubmit={handleLogin} className="login-form">
            <input
              type="password"
              placeholder="Introdu parola de admin"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="password-input"
              autoFocus
            />
            <button type="submit" className="login-button" disabled={loading}>
              {loading ? 'Se verifică...' : 'Autentifică-te'}
            </button>
          </form>
          
          {message && <div className="error-message">{message}</div>}
        </div>
      </div>
    );
  }

  const missParticipants = statistics?.participants.filter(p => p.gender === 'miss') || [];
  const misterParticipants = statistics?.participants.filter(p => p.gender === 'mister') || [];

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h1 className="admin-title">📊 Statistici Votare - Around the World</h1>
        <button 
          className="logout-button"
          onClick={() => {
            setIsAuthenticated(false);
            setPassword('');
          }}
        >
          Deconectare
        </button>
      </div>

      {/* Voting Control */}
      <div className="voting-control">
        <div className="control-info">
          <h2>Status Votare</h2>
          <p className={`status-badge ${votingEnabled ? 'active' : 'inactive'}`}>
            {votingEnabled ? '🟢 ACTIVĂ' : '🔴 OPRITĂ'}
          </p>
        </div>
        <button 
          className={`toggle-button ${votingEnabled ? 'stop' : 'start'}`}
          onClick={handleToggleVoting}
          disabled={loading}
        >
          {votingEnabled ? '⏸ OPREȘTE VOTAREA' : '▶ PORNEȘTE VOTAREA'}
        </button>
      </div>

      {message && <div className="admin-message">{message}</div>}

      {/* Total Votes */}
      <div className="total-votes">
        <div className="vote-stat">
          <span className="stat-label">Total Voturi</span>
          <span className="stat-value">{statistics?.totalVotes.total || 0}</span>
        </div>
        <div className="vote-stat miss">
          <span className="stat-label">👸 Miss Boboc</span>
          <span className="stat-value">{statistics?.totalVotes.miss || 0}</span>
        </div>
        <div className="vote-stat mister">
          <span className="stat-label">🤴 Mister Boboc</span>
          <span className="stat-value">{statistics?.totalVotes.mister || 0}</span>
        </div>
      </div>

      {/* Miss Boboc Results */}
      <div className="results-section">
        <h2 className="section-title">👸 Miss Boboc - Rezultate</h2>
        <div className="participants-grid">
          {missParticipants
            .sort((a, b) => (b.voturi || 0) - (a.voturi || 0))
            .map((participant, index) => (
              <div key={participant.id} className="participant-card">
                <div className="rank">{index + 1}</div>
                <img 
                  src={`${API_URL}/api/photos/${participant.fileName}`}
                  alt={participant.name}
                  className="participant-photo"
                />
                <h3 className="participant-name">{participant.nume} {participant.prenume}</h3>
                <p className="participant-country">{participant.country}</p>
                <div className="votes-count">{participant.voturi || 0} voturi</div>
              </div>
            ))}
        </div>
      </div>

      {/* Mister Boboc Results */}
      <div className="results-section">
        <h2 className="section-title">🤴 Mister Boboc - Rezultate</h2>
        <div className="participants-grid">
          {misterParticipants
            .sort((a, b) => (b.voturi || 0) - (a.voturi || 0))
            .map((participant, index) => (
              <div key={participant.id} className="participant-card">
                <div className="rank">{index + 1}</div>
                <img 
                  src={`${API_URL}/api/photos/${participant.fileName}`}
                  alt={participant.name}
                  className="participant-photo"
                />
                <h3 className="participant-name">{participant.nume} {participant.prenume}</h3>
                <p className="participant-country">{participant.country}</p>
                <div className="votes-count">{participant.voturi || 0} voturi</div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

export default Admin;
