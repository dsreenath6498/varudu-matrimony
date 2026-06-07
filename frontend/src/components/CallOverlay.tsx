import { useEffect, useRef } from 'react';
import { useCall } from '../context/CallContext';
import { Phone, PhoneOff, Mic, MicOff } from 'lucide-react';

export default function CallOverlay() {
  const { callState, caller, remoteStream, callDuration, isMuted, answerCall, endCall, toggleMute } = useCall();
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current && remoteStream) {
      audioRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  if (callState === 'idle') return null;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md transition-all">
      <audio ref={audioRef} autoPlay />

      <div
        className="w-full max-w-sm rounded-3xl p-8 text-center relative overflow-hidden"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--glass-border)',
          boxShadow: 'var(--shadow-card)',
          animation: 'fadeUp 0.4s ease both',
        }}
      >
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.4), transparent)' }} />
        
        {/* Caller Info */}
        <div className="relative mx-auto w-24 h-24 mb-4">
          <img
            src={caller?.photo || 'https://via.placeholder.com/150'}
            alt="Caller"
            className="w-full h-full rounded-full object-cover border-4"
            style={{
              borderColor: 'var(--bg-surface)',
              boxShadow: '0 0 20px rgba(0,0,0,0.1)',
            }}
          />
          {callState === 'ringing' && (
            <div
              className="absolute inset-0 rounded-full"
              style={{
                border: '2px solid rgba(225,29,72,0.4)',
                animation: 'pulseGlow 2s infinite',
              }}
            />
          )}
        </div>

        <h2 className="text-2xl font-bold mb-1" style={{ fontFamily: '"Cormorant Garamond", serif', color: 'var(--text-primary)' }}>
          {caller?.name || 'Unknown'}
        </h2>

        <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>
          {callState === 'ringing' && 'Incoming Audio Call...'}
          {callState === 'calling' && 'Calling...'}
          {callState === 'in-call' && formatTime(callDuration)}
        </p>

        {/* Controls */}
        <div className="flex items-center justify-center gap-6">
          {callState === 'ringing' && (
            <>
              <button
                onClick={endCall}
                className="w-14 h-14 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                style={{ background: '#EF4444', color: 'white', boxShadow: '0 4px 12px rgba(239,68,68,0.3)' }}
              >
                <PhoneOff className="w-6 h-6" />
              </button>
              <button
                onClick={answerCall}
                className="w-14 h-14 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                style={{ background: '#22C55E', color: 'white', boxShadow: '0 4px 12px rgba(34,197,94,0.3)' }}
              >
                <Phone className="w-6 h-6" />
              </button>
            </>
          )}

          {(callState === 'in-call' || callState === 'calling') && (
            <>
              <button
                onClick={toggleMute}
                className="w-12 h-12 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                style={{
                  background: isMuted ? 'rgba(239,68,68,0.1)' : 'var(--glass-bg)',
                  border: isMuted ? '1px solid rgba(239,68,68,0.3)' : '1px solid var(--glass-border)',
                  color: isMuted ? '#EF4444' : 'var(--text-primary)',
                }}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
              
              <button
                onClick={endCall}
                className="w-16 h-16 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                style={{ background: '#EF4444', color: 'white', boxShadow: '0 4px 12px rgba(239,68,68,0.3)' }}
              >
                <PhoneOff className="w-7 h-7" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
