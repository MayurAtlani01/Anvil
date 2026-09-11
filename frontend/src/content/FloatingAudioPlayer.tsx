import React, { useState } from 'react';
import { Play, Pause, Square, Volume2, X } from 'lucide-react';

interface FloatingAudioPlayerProps {
  isSpeaking: boolean;
  onPlayPause: () => void;
  onStop: () => void;
  onSpeedChange: (speed: number) => void;
  currentSpeed: number;
  onClose: () => void;
}

export const FloatingAudioPlayer: React.FC<FloatingAudioPlayerProps> = ({
  isSpeaking,
  onPlayPause,
  onStop,
  onSpeedChange,
  currentSpeed,
  onClose,
}) => {
  const speeds = [1.0, 1.25, 1.5];

  return (
    <div
      className="anvil-audio-bar"
      onMouseDown={(e) => e.stopPropagation()}
      role="toolbar"
      aria-label="Anvil Read Aloud Controls"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--anvil-accent)', fontSize: 11, fontWeight: 700 }}>
        <Volume2 style={{ width: 14, height: 14 }} />
        <span>Read Aloud</span>
      </div>

      <div style={{ width: 1, height: 16, background: '#2A2A2A', margin: '0 2px' }} />

      {/* Play/Pause Button */}
      <button
        type="button"
        onClick={onPlayPause}
        className={`anvil-audio-btn ${isSpeaking ? 'anvil-audio-btn-active' : ''}`}
        title={isSpeaking ? 'Pause' : 'Play'}
      >
        {isSpeaking ? <Pause style={{ width: 13, height: 13 }} /> : <Play style={{ width: 13, height: 13 }} />}
      </button>

      {/* Stop Button */}
      <button
        type="button"
        onClick={onStop}
        className="anvil-audio-btn"
        title="Stop Speech"
      >
        <Square style={{ width: 11, height: 11 }} />
      </button>

      <div style={{ width: 1, height: 16, background: '#2A2A2A', margin: '0 2px' }} />

      {/* Speed Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
        {speeds.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onSpeedChange(s)}
            className={`anvil-speed-pill ${currentSpeed === s ? 'active' : ''}`}
          >
            {s}x
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          color: '#737373',
          cursor: 'pointer',
          padding: 3,
          marginLeft: 4,
          display: 'flex',
        }}
        title="Dismiss Audio Bar"
      >
        <X style={{ width: 13, height: 13 }} />
      </button>
    </div>
  );
};
