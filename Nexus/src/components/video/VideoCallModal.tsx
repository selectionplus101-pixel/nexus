import React, { useState, useEffect, useRef } from 'react';
import { X, Mic, MicOff, Video, VideoOff, PhoneOff } from 'lucide-react';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import toast from 'react-hot-toast';
import {
  sendVideoOffer,
  sendVideoAnswer,
  sendIceCandidate,
  toggleAudio,
  toggleVideo,
  endVideoCall,
  onVideoOffer,
  onVideoAnswer,
  onIceCandidate,
  onCallEnded,
  onPartnerAudioToggle,
  onPartnerVideoToggle,
  getSocket,
} from '../../services/socket';

interface VideoCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  partnerId: string;
  partnerName: string;
  partnerAvatar?: string;
  roomId: string;
  isCaller: boolean;
}

// ICE servers configuration (using public STUN servers)
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export const VideoCallModal: React.FC<VideoCallModalProps> = ({
  isOpen,
  onClose,
  partnerId,
  partnerName,
  partnerAvatar,
  roomId,
  isCaller,
}) => {
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isConnecting, setIsConnecting] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [partnerAudioEnabled, setPartnerAudioEnabled] = useState(true);
  const [partnerVideoEnabled, setPartnerVideoEnabled] = useState(true);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // Initialize WebRTC peer connection
  const initializePeerConnection = () => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendIceCandidate(roomId, event.candidate.toJSON());
      }
    };

    // Handle incoming remote stream
    pc.ontrack = (event) => {
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
        setIsConnected(true);
        setIsConnecting(false);
      }
    };

    // Monitor connection state
    pc.onconnectionstatechange = () => {
      console.log('[WebRTC] Connection state:', pc.connectionState);
      if (pc.connectionState === 'connected') {
        setIsConnected(true);
        setIsConnecting(false);
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        toast.error('Connection lost');
        handleEndCall();
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  };

  // Get local media stream
  const getLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      localStreamRef.current = stream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      return stream;
    } catch (error) {
      console.error('[WebRTC] Error accessing media devices:', error);
      toast.error('Failed to access camera/microphone');
      throw error;
    }
  };

  // Start call (caller initiates)
  const startCall = async () => {
    try {
      const pc = initializePeerConnection();
      const stream = await getLocalStream();

      // Add local stream tracks to peer connection
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      // Create and send offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      sendVideoOffer(roomId, offer);

      console.log('[WebRTC] Offer sent');
    } catch (error) {
      console.error('[WebRTC] Error starting call:', error);
      toast.error('Failed to start call');
      handleEndCall();
    }
  };

  // Answer call (callee responds)
  const answerCall = async (offer: RTCSessionDescriptionInit) => {
    try {
      const pc = initializePeerConnection();
      const stream = await getLocalStream();

      // Add local stream tracks to peer connection
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      // Set remote description (offer)
      await pc.setRemoteDescription(new RTCSessionDescription(offer));

      // Create and send answer
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      sendVideoAnswer(roomId, answer);

      console.log('[WebRTC] Answer sent');
    } catch (error) {
      console.error('[WebRTC] Error answering call:', error);
      toast.error('Failed to answer call');
      handleEndCall();
    }
  };

  // Handle incoming offer
  const handleIncomingOffer = async (data: { offer: RTCSessionDescriptionInit; senderId: string; roomId: string }) => {
    if (data.roomId === roomId) {
      console.log('[WebRTC] Received offer');
      await answerCall(data.offer);
    }
  };

  // Handle incoming answer
  const handleIncomingAnswer = async (data: { answer: RTCSessionDescriptionInit; senderId: string; roomId: string }) => {
    if (data.roomId === roomId && peerConnectionRef.current) {
      console.log('[WebRTC] Received answer');
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
    }
  };

  // Handle incoming ICE candidate
  const handleIncomingIceCandidate = async (data: { candidate: RTCIceCandidateInit; senderId: string; roomId: string }) => {
    if (data.roomId === roomId && peerConnectionRef.current) {
      try {
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
      } catch (error) {
        console.error('[WebRTC] Error adding ICE candidate:', error);
      }
    }
  };

  // Handle call ended by partner
  const handleCallEndedByPartner = (data: { endedBy: string; roomId: string; reason?: string }) => {
    if (data.roomId === roomId) {
      toast.info(data.reason || 'Call ended');
      cleanup();
      onClose();
    }
  };

  // Toggle audio
  const handleToggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
        toggleAudio(roomId, audioTrack.enabled);
      }
    }
  };

  // Toggle video
  const handleToggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
        toggleVideo(roomId, videoTrack.enabled);
      }
    }
  };

  // End call
  const handleEndCall = () => {
    endVideoCall(roomId);
    cleanup();
    onClose();
  };

  // Cleanup resources
  const cleanup = () => {
    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // Clear video elements
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    // Remove Socket.IO listeners to prevent duplicates
    const socket = getSocket();
    if (socket) {
      socket.off('video:offer');
      socket.off('video:answer');
      socket.off('video:ice-candidate');
      socket.off('video:call-ended');
      socket.off('video:partner-audio-toggle');
      socket.off('video:partner-video-toggle');
    }
  };

  // Initialize call on mount
  useEffect(() => {
    if (!isOpen) return;

    // Set up WebRTC event listeners
    onVideoOffer(handleIncomingOffer);
    onVideoAnswer(handleIncomingAnswer);
    onIceCandidate(handleIncomingIceCandidate);
    onCallEnded(handleCallEndedByPartner);
    onPartnerAudioToggle((data) => setPartnerAudioEnabled(data.audioEnabled));
    onPartnerVideoToggle((data) => setPartnerVideoEnabled(data.videoEnabled));

    // Start call if caller
    if (isCaller) {
      startCall();
    }

    // Cleanup on unmount
    return () => {
      cleanup();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Remote video (full screen) */}
      <div className="relative w-full h-full">
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />

        {/* Show partner avatar when video is off or connecting */}
        {(!isConnected || !partnerVideoEnabled) && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <div className="text-center">
              <Avatar
                src={partnerAvatar}
                alt={partnerName}
                size="xl"
                className="mx-auto mb-4"
              />
              <h2 className="text-white text-2xl font-semibold">{partnerName}</h2>
              <p className="text-gray-400 mt-2">
                {isConnecting ? 'Connecting...' : 'Camera is off'}
              </p>
            </div>
          </div>
        )}

        {/* Local video (picture-in-picture) */}
        <div className="absolute top-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden shadow-lg">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          {!isVideoEnabled && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
              <VideoOff size={32} className="text-gray-400" />
            </div>
          )}
        </div>

        {/* Partner name overlay */}
        <div className="absolute top-4 left-4 bg-black bg-opacity-50 px-4 py-2 rounded-lg">
          <p className="text-white font-medium">{partnerName}</p>
          <div className="flex items-center gap-2 mt-1">
            {!partnerAudioEnabled && (
              <MicOff size={16} className="text-red-400" />
            )}
            {!partnerVideoEnabled && (
              <VideoOff size={16} className="text-red-400" />
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center gap-4">
          {/* Toggle Audio */}
          <Button
            onClick={handleToggleAudio}
            className={`rounded-full w-14 h-14 ${
              isAudioEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'
            }`}
            aria-label="Toggle audio"
          >
            {isAudioEnabled ? <Mic size={24} /> : <MicOff size={24} />}
          </Button>

          {/* End Call */}
          <Button
            onClick={handleEndCall}
            className="rounded-full w-16 h-16 bg-red-600 hover:bg-red-700"
            aria-label="End call"
          >
            <PhoneOff size={28} />
          </Button>

          {/* Toggle Video */}
          <Button
            onClick={handleToggleVideo}
            className={`rounded-full w-14 h-14 ${
              isVideoEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'
            }`}
            aria-label="Toggle video"
          >
            {isVideoEnabled ? <Video size={24} /> : <VideoOff size={24} />}
          </Button>
        </div>
      </div>
    </div>
  );
};
