import { useState, useEffect } from 'react';
import './PassportPage.css';

const PassportPage = ({ participant, onVote, isVoted, votedName, onFlipChange, shouldFlipBack, votingEnabled }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    if (shouldFlipBack && isFlipped) {
      setIsFlipped(false);
    }
  }, [shouldFlipBack]);

  const handleFlip = () => {
    const newFlipState = !isFlipped;
    setIsFlipped(newFlipState);
    if (onFlipChange) {
      onFlipChange(newFlipState);
    }
  };

  const handleVote = () => {
    if (!isVoted) {
      onVote(participant.id);
    }
  };

  return (
    <div className="passport-page" onClick={handleFlip}>
      <div className={`page-content ${isFlipped ? 'flipped' : ''}`}>
        {/* Front Side - Photo and Info */}
        <div className="page-front">
          <div className="passport-header">
            <div className="header-line"></div>
            <h3 className="passport-title">PASSPORT</h3>
            <div className="header-line"></div>
          </div>
          
          <div className="photo-container">
            <div className="photo-frame">
              <img 
                src={participant.photo} 
                alt={participant.name}
                className="participant-photo"
              />
            </div>
            <div className="country-badge">
              <span className="flag-emoji">{participant.country === 'China' ? '🇨🇳' : 
                                            participant.country === 'India' ? '🇮🇳' :
                                            participant.country === 'Cuba' ? '🇨🇺' :
                                            participant.country === 'Franța' ? '🇫🇷' :
                                            participant.country === 'Argentina' ? '🇦🇷' : '🇮🇹'}</span>
            </div>
          </div>

          <div className="info-section">
            <div className="info-row">
              <span className="label">NAME / NOM</span>
              <span className="value">{participant.name.toUpperCase()}</span>
            </div>
            <div className="info-row">
              <span className="label">NATIONALITY / NATIONALITÉ</span>
              <span className="value">{participant.country.toUpperCase()}</span>
            </div>
            <div className="info-row">
              <span className="label">FACULTY / FACULTÉ</span>
              <span className="value">AUTOMATICĂ ȘI CALCULATOARE</span>
            </div>
            <div className="info-row">
              <span className="label">SPECIALIZATION / SPÉCIALISATION</span>
              <span className="value">{participant.description}</span>
            </div>
          </div>

          <div className="stamp-section">
            <div className="stamp">AROUND THE WORLD</div>
            {isVoted && (
              <div className="voted-stamp">✓ VOTAT</div>
            )}
          </div>

          <div className="tap-hint">TAP TO FLIP</div>
        </div>

        {/* Back Side - Voting */}
        <div className="page-back">
          <div className="passport-header">
            <h3 className="passport-title">VOTE NOW</h3>
          </div>

          <div className="voting-section">
            <div className="confirm-vote-section">
              <div className="back-photo-container">
                <img 
                  src={participant.photo} 
                  alt={participant.name}
                  className="back-participant-photo"
                />
              </div>
              <p className="confirm-text">
                Ești sigur că o votezi pe<br/>
                <strong>{participant.nume} {participant.prenume}</strong>?
              </p>
            </div>

            {!votingEnabled ? (
              <div className="voting-disabled-message">
                <p className="disabled-text">🔒 Votarea nu a început încă</p>
                <p className="disabled-subtext">Te rugăm să aștepți anunțul organizatorilor</p>
              </div>
            ) : (
              <button 
                className={`vote-button ${isVoted ? 'voted' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleVote();
                }}
                disabled={isVoted}
              >
                {isVoted ? (
                  <>
                    <span className="checkmark">✓</span>
                    VOTAT
                  </>
                ) : (
                  <>
                    ❤️ VOTEAZĂ {participant.name.split(' ')[0].toUpperCase()}
                  </>
                )}
              </button>
            )}

            {isVoted && votedName && (
              <div className="thank-you-message">
                <p className="thank-you-text">
                  🎭 Ai votat deja pentru<br/>
                  <strong>{participant.gender === 'miss' ? 'Miss Boboc' : 'Mister Boboc'}</strong><br/>
                  Votul tău: <strong>{votedName}</strong><br/>
                  Mulțumim! 🌟
                </p>
              </div>
            )}

            <div className="visa-stamps">
              <div className="visa-stamp stamp-1">MISS & MISTER</div>
              <div className="visa-stamp stamp-2">POPULARITATE</div>
            </div>
          </div>

          <div className="tap-hint back">TAP TO RETURN</div>
        </div>
      </div>
    </div>
  );
};

export default PassportPage;
