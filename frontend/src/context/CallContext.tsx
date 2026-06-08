import { createContext, useContext, useState, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useSocket } from './SocketContext';

interface CallerData {
  id: string;
  name: string;
  photo: string;
}

interface CallContextType {
  callState: 'idle' | 'calling' | 'ringing' | 'in-call';
  caller: CallerData | null;
  remoteStream: MediaStream | null;
  localStream: MediaStream | null;
  callDuration: number;
  isMuted: boolean;
  isVideoEnabled: boolean;
  callUser: (id: string, name: string, photo: string) => Promise<void>;
  answerCall: () => Promise<void>;
  endCall: () => void;
  toggleMute: () => void;
  toggleVideo: () => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export const CallProvider = ({ children }: { children: ReactNode }) => {
  const { socket } = useSocket();
  const [callState, setCallState] = useState<'idle' | 'calling' | 'ringing' | 'in-call'>('idle');
  const [caller, setCaller] = useState<CallerData | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [localStreamObj, setLocalStreamObj] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const localStream = useRef<MediaStream | null>(null);
  const currentPartnerId = useRef<string | null>(null);
  const pendingIceCandidates = useRef<RTCIceCandidateInit[]>([]);

  useEffect(() => {
    if (!socket) return;

    socket.on('incoming_call', async ({ signal, from, name, photo }) => {
      setCaller({ id: from, name, photo });
      setCallState('ringing');
      currentPartnerId.current = from;
      
      const pc = createPeerConnection(from);
      peerConnection.current = pc;
      
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(signal));
        // Process any ICE candidates that arrived before the remote description was set
        while (pendingIceCandidates.current.length > 0) {
          const candidate = pendingIceCandidates.current.shift();
          if (candidate) await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (err) {
        console.error('Error setting remote description:', err);
      }
    });

    socket.on('call_accepted', async ({ signal }) => {
      if (peerConnection.current) {
        try {
          await peerConnection.current.setRemoteDescription(new RTCSessionDescription(signal));
          setCallState('in-call');

          // Process any ICE candidates that arrived before the remote description was set
          while (pendingIceCandidates.current.length > 0) {
            const candidate = pendingIceCandidates.current.shift();
            if (candidate) await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
          }
        } catch (err) {
          console.error('Error handling call_accepted:', err);
        }
      }
    });

    socket.on('ice_candidate', async ({ candidate }) => {
      if (peerConnection.current && peerConnection.current.remoteDescription) {
        try {
          await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error('Error adding ice candidate', e);
        }
      } else {
        // Queue candidates if remote description isn't set yet
        pendingIceCandidates.current.push(candidate);
      }
    });

    socket.on('call_ended', () => {
      cleanupCall();
    });

    return () => {
      socket.off('incoming_call');
      socket.off('call_accepted');
      socket.off('ice_candidate');
      socket.off('call_ended');
    };
  }, [socket]);

  const createPeerConnection = (partnerId: string) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('ice_candidate', { to: partnerId, candidate: event.candidate });
      }
    };

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      }
    };

    if (localStream.current) {
      localStream.current.getTracks().forEach(track => {
        pc.addTrack(track, localStream.current!);
      });
    }

    return pc;
  };

  const startLocalMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      localStream.current = stream;
      setLocalStreamObj(stream);
      setIsVideoEnabled(true);
      setIsMuted(false);
      return true;
    } catch (err) {
      console.error('Failed to get local media', err);
      alert('Microphone and Camera access is required to make video calls.');
      return false;
    }
  };

  const callUser = async (userToCall: string, name: string, photo: string) => {
    const currentUserStr = localStorage.getItem('user');
    const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;
    
    if (!socket || !currentUser) return;
    const streamOk = await startLocalMedia();
    if (!streamOk) return;

    currentPartnerId.current = userToCall;
    setCaller({ id: userToCall, name, photo });
    setCallState('calling');

    const pc = createPeerConnection(userToCall);
    peerConnection.current = pc;

    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit('call_user', {
        userToCall,
        signalData: offer,
        from: currentUser.id,
        name: currentUser.name,
        photo: currentUser.photos?.[0] || 'https://via.placeholder.com/150'
      });
    } catch (err) {
      console.error('Error creating offer:', err);
      cleanupCall();
    }
  };

  const answerCall = async () => {
    if (!socket || !peerConnection.current || !currentPartnerId.current) return;
    const streamOk = await startLocalMedia();
    if (!streamOk) {
      cleanupCall();
      return;
    }

    localStream.current!.getTracks().forEach(track => {
      peerConnection.current!.addTrack(track, localStream.current!);
    });

    try {
      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);

      socket.emit('answer_call', {
        to: currentPartnerId.current,
        signal: answer
      });

      setCallState('in-call');
    } catch (err) {
      console.error('Error answering call:', err);
      cleanupCall();
    }
  };

  const endCall = () => {
    if (socket && currentPartnerId.current) {
      socket.emit('end_call', { to: currentPartnerId.current });
    }
    cleanupCall();
  };

  const cleanupCall = () => {
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    if (localStream.current) {
      localStream.current.getTracks().forEach(track => track.stop());
      localStream.current = null;
      setLocalStreamObj(null);
    }
    setRemoteStream(null);
    setCallState('idle');
    setCaller(null);
    currentPartnerId.current = null;
    pendingIceCandidates.current = [];
    setIsMuted(false);
    setIsVideoEnabled(true);
    setCallDuration(0);
  };

  const toggleMute = () => {
    if (localStream.current) {
      const audioTrack = localStream.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream.current) {
      const videoTrack = localStream.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  useEffect(() => {
    let interval: any;
    if (callState === 'in-call') {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(interval);
  }, [callState]);

  return (
    <CallContext.Provider value={{
      callState, caller, remoteStream, localStream: localStreamObj, callDuration, isMuted, isVideoEnabled,
      callUser, answerCall, endCall, toggleMute, toggleVideo
    }}>
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => {
  const context = useContext(CallContext);
  if (context === undefined) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
};
