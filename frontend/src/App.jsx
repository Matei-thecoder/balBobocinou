import { useState, useEffect } from 'react';
import PassportPage from './components/PassportPage';
import { generateAdvancedFingerprint } from './utils/advancedFingerprint';
import './App.css';

const API_URL = 'https://bilete.multi-fights.com';

// Country mapping
const countryConfig = {
  'China': { flagEmoji: '🇨🇳', color: '#DE2910' },
  'India': { flagEmoji: '🇮🇳', color: '#FF9933' },
  'Cuba': { flagEmoji: '🇨🇺', color: '#CB1515' },
  'Franta': { flagEmoji: '🇫🇷', color: '#0055A4' },
  'Argentina': { flagEmoji: '🇦🇷', color: '#74ACDF' },
  'Italia': { flagEmoji: '🇮🇹', color: '#009246' },
  'Romania': { flagEmoji: '🇷🇴', color: '#002B7F' }
};

function App() {
  const [allParticipants, setAllParticipants] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [missVoted, setMissVoted] = useState(false);
  const [missVotedFor, setMissVotedFor] = useState(null);
  const [missVotedName, setMissVotedName] = useState('');
  const [misterVoted, setMisterVoted] = useState(false);
  const [misterVotedFor, setMisterVotedFor] = useState(null);
  const [misterVotedName, setMisterVotedName] = useState('');
  const [notification, setNotification] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [selectedGender, setSelectedGender] = useState('miss');
  const [browserFingerprint, setBrowserFingerprint] = useState('');
  const [loading, setLoading] = useState(true);
  const [showVoteSuccess, setShowVoteSuccess] = useState(false);
  const [lastVotedParticipant, setLastVotedParticipant] = useState(null);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [flipBackTrigger, setFlipBackTrigger] = useState(0);
  const [votingEnabled, setVotingEnabled] = useState(true);

  // Generate advanced device fingerprint + persistent device ID on mount
  useEffect(() => {
    const generateFP = async () => {
      // Get or create persistent device ID
      let deviceId = localStorage.getItem('deviceId');
      if (!deviceId) {
        deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('deviceId', deviceId);
      }
      
      const fingerprint = await generateAdvancedFingerprint();
      const combinedFingerprint = fingerprint + '|||' + deviceId;
      setBrowserFingerprint(combinedFingerprint);
      console.log('Advanced device fingerprint:', fingerprint);
      console.log('Device ID:', deviceId);
    };
    generateFP();
  }, []);

  // Load participants from API
  useEffect(() => {
    fetchParticipants();
    checkVoteStatus();
    checkVotingStatus();
  }, [browserFingerprint]);

  const checkVotingStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/voting-status`);
      const data = await response.json();
      if (data.status) {
        setVotingEnabled(data.votingEnabled);
      }
    } catch (error) {
      console.error('Error checking voting status:', error);
    }
  };

  const fetchParticipants = async () => {
    try {
      const response = await fetch(`${API_URL}/participants`);
      const data = await response.json();
      
      if (data.status && data.data) {
        const participants = data.data.map(p => ({
          ...p,
          votes: p.voturi || 0,
          photo: `${API_URL}/api/photos/${p.fileName}`,
          countryColor: countryConfig[p.country]?.color || '#666',
          flagEmoji: countryConfig[p.country]?.flagEmoji || '🌍'
        }));
        setAllParticipants(participants);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching participants:', error);
      showNotification('Eroare la încărcarea participanților');
      setLoading(false);
    }
  };

  const checkVoteStatus = async () => {
    if (!browserFingerprint) return;
    
    try {
      const response = await fetch(`${API_URL}/check-vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fingerprint: browserFingerprint })
      });
      
      const data = await response.json();
      if (data.status) {
        setMissVoted(data.missVoted);
        setMissVotedFor(data.missVotedFor);
        setMissVotedName(data.missVotedName || '');
        setMisterVoted(data.misterVoted);
        setMisterVotedFor(data.misterVotedFor);
        setMisterVotedName(data.misterVotedName || '');
      }
    } catch (error) {
      console.error('Error checking vote status:', error);
    }
  };

  // Check if user has already voted (from localStorage)
  useEffect(() => {
    const voted = localStorage.getItem('hasVoted');
    const votedId = localStorage.getItem('votedFor');
    if (voted === 'true') {
      setHasVoted(true);
      setVotedFor(votedId);
    }
  }, []);

  const handleVote = async (participantId) => {
    const participant = allParticipants.find(p => p.id === participantId);
    if (!participant) return;

    const gender = participant.gender;
    const hasVotedForGender = gender === 'miss' ? missVoted : misterVoted;

    if (hasVotedForGender) {
      const votedName = gender === 'miss' ? missVotedName : misterVotedName;
      showNotification(`Ai votat deja pentru ${gender === 'miss' ? 'Miss Boboc' : 'Mister Boboc'}: ${votedName}! ✓`);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          vote: participantId,
          fingerprint: browserFingerprint
        }),
      });

      const data = await response.json();
      
      if (data.status === true) {
        if (gender === 'miss') {
          setMissVoted(true);
          setMissVotedFor(participantId);
          setMissVotedName(data.votedName);
        } else {
          setMisterVoted(true);
          setMisterVotedFor(participantId);
          setMisterVotedName(data.votedName);
        }
        
        // Show success page
        setLastVotedParticipant(participant);
        setShowVoteSuccess(true);
        
        // Update votes count locally
        setAllParticipants(prev => 
          prev.map(p => 
            p.id === participantId ? { ...p, votes: p.votes + 1, voturi: p.voturi + 1 } : p
          )
        );
      } else {
        showNotification(data.message || 'Ai votat deja!');
        if (gender === 'miss') {
          setMissVoted(true);
          if (data.votedName) setMissVotedName(data.votedName);
        } else {
          setMisterVoted(true);
          if (data.votedName) setMisterVotedName(data.votedName);
        }
      }
    } catch (error) {
      console.error('Voting error:', error);
      showNotification('Eroare la votare. Încearcă din nou!');
    }
  };

  const handleBackToVoting = () => {
    setShowVoteSuccess(false);
    setLastVotedParticipant(null);
  };

  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(''), 3000);
  };

  const nextParticipant = () => {
    const filtered = getFilteredParticipants();
    setCurrentIndex((prev) => (prev + 1) % filtered.length);
    setIsCardFlipped(false);
  };

  const prevParticipant = () => {
    const filtered = getFilteredParticipants();
    setCurrentIndex((prev) => (prev - 1 + filtered.length) % filtered.length);
    setIsCardFlipped(false);
  };

  const handleCardFlip = (flipped) => {
    setIsCardFlipped(flipped);
  };

  const handleBackToParticipants = () => {
    setFlipBackTrigger(prev => prev + 1);
    setIsCardFlipped(false);
  };

  const getFilteredParticipants = () => {
    let filtered = allParticipants;
    
    if (selectedCountry !== 'all') {
      filtered = filtered.filter(p => p.country === selectedCountry);
    }
    
    if (selectedGender !== 'all') {
      filtered = filtered.filter(p => p.gender === selectedGender);
    }
    
    return filtered;
  };

  // Get unique countries from participants
  const getCountries = () => {
    const uniqueCountries = [...new Set(allParticipants.map(p => p.country))];
    return uniqueCountries.map(country => ({
      name: country,
      ...countryConfig[country]
    }));
  };

  const filteredParticipants = getFilteredParticipants();
  const currentParticipant = filteredParticipants[currentIndex];

  if (loading || allParticipants.length === 0) {
    return <div className="loading">Loading... ✈️</div>;
  }

  // Vote Success Screen - Show after voting or if already voted at both
  if (showVoteSuccess && lastVotedParticipant) {
    return (
      <div className="vote-success-screen">
        <div className="success-content">
          <div className="success-icon">✓</div>
          <h1 className="success-title">Votul Tău a Fost Înregistrat!</h1>
          <div className="voted-info">
            <img 
              src={lastVotedParticipant.photo} 
              alt={lastVotedParticipant.name}
              className="success-photo"
            />
            <h2 className="voted-name">{lastVotedParticipant.nume} {lastVotedParticipant.prenume}</h2>
            <p className="voted-country">
              {countryConfig[lastVotedParticipant.country]?.flagEmoji} {lastVotedParticipant.country}
            </p>
          </div>
          <button className="back-button" onClick={handleBackToVoting}>
            ← Înapoi la Votare
          </button>
        </div>
      </div>
    );
  }

  // Note: After voting, user can continue browsing and vote for the other category
  // No blocking screens - they can freely switch between Miss and Mister categories

  return (
    <div className="app">
      {/* Background Pattern */}
      <div className="world-map-bg"></div>
      
      {/* Header */}
      {!isCardFlipped && (
        <header className="app-header">
          <div className="header-content">
            <h1 className="title">
              AROUND THE WORLD
            </h1>
            <p className="subtitle">✈️ Miss & Mister Popularitate ✈️</p>
          </div>
        </header>
      )}

      {/* Gender Filter */}
      {!isCardFlipped && (
        <div className="gender-filter">
          <button 
            className={`filter-btn gender-btn ${selectedGender === 'miss' ? 'active' : ''}`}
            onClick={() => { setSelectedGender('miss'); setCurrentIndex(0); }}
          >
            👸 MISS BOBOC
          </button>
          <button 
            className={`filter-btn gender-btn ${selectedGender === 'mister' ? 'active' : ''}`}
            onClick={() => { setSelectedGender('mister'); setCurrentIndex(0); }}
          >
            🤴 MISTER BOBOC
          </button>
        </div>
      )}

      {/* Country Filter */}
      {!isCardFlipped && (
        <div className="country-filter">
          <button 
            className={`filter-btn ${selectedCountry === 'all' ? 'active' : ''}`}
            onClick={() => { setSelectedCountry('all'); setCurrentIndex(0); }}
          >
            🌎 TOATE
          </button>
          {getCountries().map((country, index) => (
            <button 
              key={index}
              className={`filter-btn ${selectedCountry === country.name ? 'active' : ''}`}
              onClick={() => { setSelectedCountry(country.name); setCurrentIndex(0); }}
              style={{ borderColor: country.color }}
            >
              {country.flagEmoji} {country.name.toUpperCase()}
            </button>
          ))}
        </div>
      )}

      {/* Main Content */}
      <div className="passport-container">
        {/* Navigation Arrow Left */}
        {!isCardFlipped && (
          <button className="nav-arrow left" onClick={prevParticipant}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
        )}

        {/* Passport Page */}
        {currentParticipant && (
          <PassportPage
            key={currentParticipant.id}
            participant={currentParticipant}
            onVote={handleVote}
            isVoted={currentParticipant.gender === 'miss' ? missVoted : misterVoted}
            votedName={currentParticipant.gender === 'miss' ? missVotedName : misterVotedName}
            onFlipChange={handleCardFlip}
            shouldFlipBack={flipBackTrigger}
            votingEnabled={votingEnabled}
          />
        )}

        {/* Navigation Arrow Right */}
        {!isCardFlipped && (
          <button className="nav-arrow right" onClick={nextParticipant}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        )}
      </div>

      {/* Back to Participants Button - Only shown when card is flipped */}
      {isCardFlipped && (
        <div className="back-to-participants-container">
          <button className="back-to-participants-btn" onClick={handleBackToParticipants}>
            ← Înapoi la Participanți
          </button>
        </div>
      )}

      {/* Progress Indicator */}
      {!isCardFlipped && (
        <div className="progress-indicator">
          <span className="current-number">{currentIndex + 1}</span>
          <span className="separator">/</span>
          <span className="total-number">{filteredParticipants.length}</span>
        </div>
      )}

      {/* Dots Navigation */}
      {!isCardFlipped && (
        <div className="dots-navigation">
          {filteredParticipants.map((_, index) => (
            <button
              key={index}
              className={`dot ${index === currentIndex ? 'active' : ''}`}
              onClick={() => setCurrentIndex(index)}
            />
          ))}
        </div>
      )}

      {/* Notification Toast */}
      {notification && (
        <div className="notification">
          {notification}
        </div>
      )}
    </div>
  );
}

export default App;
