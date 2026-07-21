// ============================================================
//  UIOverlay.jsx — glassmorphic HUD: title, balloon counter,
//  big counting splash, phonics card, topper palette,
//  candle-mode toggle and the Celebration button.
// ============================================================
import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Star, Heart, Candy, Flame, PartyPopper } from 'lucide-react';
import { useGameStore, TOTAL_CANDLES } from '../store/useGameStore.js';
import { playCelebrationFanfare, playChime, playSparkle, warmUpAudio } from '../audio/soundEngine.js';

const WORD_EMOJI = { PIG: '🐷', DUCK: '🦆', BALL: '⚽' };
const LETTER_COLORS = ['#f2709c', '#f7b267', '#7bc8a4', '#6aa9e0', '#a58fd6'];

export default function UIOverlay() {
  const balloonCount = useGameStore((s) => s.balloonCount);
  const activePhonicsWord = useGameStore((s) => s.activePhonicsWord);
  const isCandleBlowingMode = useGameStore((s) => s.isCandleBlowingMode);
  const candlesBlown = useGameStore((s) => s.candlesBlown);
  const toggleCandleMode = useGameStore((s) => s.toggleCandleMode);
  const addDecoration = useGameStore((s) => s.addDecoration);
  const celebrating = useGameStore((s) => s.celebrating);
  const setCelebrating = useGameStore((s) => s.setCelebrating);

  // unlock the Web Audio context on the very first tap (mobile requirement)
  useEffect(() => {
    const warm = () => warmUpAudio();
    window.addEventListener('pointerdown', warm, { once: true });
    return () => window.removeEventListener('pointerdown', warm);
  }, []);

  function handleTopper(type) {
    warmUpAudio();
    playChime(type === 'star' ? 659.25 : type === 'heart' ? 587.33 : 523.25);
    addDecoration(type);
  }

  function handleCandleMode() {
    warmUpAudio();
    playSparkle();
    toggleCandleMode();
  }

  function handleCelebrate() {
    if (celebrating) return;
    warmUpAudio();
    setCelebrating(true);
    playCelebrationFanfare();

    const balloonShape = confetti.shapeFromText({ text: '🎈', scalar: 2.4 });
    const pigShape = confetti.shapeFromText({ text: '🐷', scalar: 2.2 });
    const colors = ['#f7a8b8', '#a8e6cf', '#a9d4f0', '#d8c9f2', '#ffe8c8'];
    const end = Date.now() + 3200;

    (function frame() {
      // balloon cascade from both bottom corners
      confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0, y: 0.75 }, colors, shapes: [balloonShape], scalar: 2.2 });
      confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1, y: 0.75 }, colors, shapes: [balloonShape], scalar: 2.2 });
      // pastel confetti drifting down the whole screen
      confetti({ particleCount: 9, spread: 100, origin: { x: Math.random(), y: -0.1 }, gravity: 0.6, ticks: 300, colors, scalar: 0.9 });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
    confetti({ particleCount: 10, spread: 120, origin: { y: 0.4 }, shapes: [pigShape], scalar: 2.4 });

    setTimeout(() => setCelebrating(false), 4200);
  }

  return (
    <div className="hud">
      <header className="hud-top">
        <div className="glass title-card">
          <span className="title-emoji">🐷</span>
          <div>
            <h1>Peppa's Party Time</h1>
            <p>tap, pop, play &amp; learn!</p>
          </div>
        </div>
        <div className="glass counter-card" aria-live="polite">
          <span className="counter-emoji">🎈</span>
          <span className="counter-num">{balloonCount}</span>
          <span className="counter-label">popped!</span>
        </div>
      </header>

      {/* big, joyful counting splash (re-animates every pop) */}
      {balloonCount > 0 && !celebrating && (
        <div key={balloonCount} className="count-splash">{balloonCount}</div>
      )}

      {/* phonics card from unboxed presents */}
      {activePhonicsWord && (
        <div className="glass phonics-card">
          <div className="phonics-letters">
            {activePhonicsWord.split('').map((l, i) => (
              <span key={i} style={{ color: LETTER_COLORS[i % LETTER_COLORS.length], animationDelay: `${i * 0.12}s` }}>
                {l}
              </span>
            ))}
          </div>
          <div className="phonics-emoji">{WORD_EMOJI[activePhonicsWord]}</div>
          <div className="phonics-word">{activePhonicsWord.toLowerCase()}!</div>
        </div>
      )}

      {isCandleBlowingMode && (
        <div className="glass wish-card">
          <span>🕯️ Make a wish… tap the flames!</span>
          <strong>{candlesBlown} / {TOTAL_CANDLES}</strong>
        </div>
      )}

      {celebrating && <div className="celebration-banner">🎂 HAPPY BIRTHDAY! 🎂</div>}

      <footer className="hud-bottom">
        <div className="glass toolbar">
          <button className="tool-btn" onClick={() => handleTopper('star')} aria-label="Add star topper">
            <Star size={26} /><span>Star</span>
          </button>
          <button className="tool-btn" onClick={() => handleTopper('heart')} aria-label="Add heart topper">
            <Heart size={26} /><span>Heart</span>
          </button>
          <button className="tool-btn" onClick={() => handleTopper('candy')} aria-label="Add candy topper">
            <Candy size={26} /><span>Candy</span>
          </button>
          <div className="toolbar-divider" />
          <button
            className={`tool-btn candle-btn ${isCandleBlowingMode ? 'active' : ''}`}
            onClick={handleCandleMode}
            aria-label="Toggle candle blowing mode"
          >
            <Flame size={26} /><span>{isCandleBlowingMode ? 'Done' : 'Candles'}</span>
          </button>
          <button
            className={`tool-btn celebrate-btn ${celebrating ? 'active' : ''}`}
            onClick={handleCelebrate}
            aria-label="Start celebration"
          >
            <PartyPopper size={26} /><span>Celebrate!</span>
          </button>
        </div>
      </footer>
    </div>
  );
}
