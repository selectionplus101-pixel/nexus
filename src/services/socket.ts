import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket: Socket | null = null;
let isConnecting = false;

export const connectSocket = (token: string) => {
  // Prevent duplicate connections
  if (socket?.connected) {
    console.log('[Socket] Already connected, reusing existing socket');
    return socket;
  }

  // Prevent race condition during connection
  if (isConnecting) {
    console.log('[Socket] Connection already in progress, waiting...');
    return socket;
  }

  // Disconnect old socket if exists but not connected
  if (socket && !socket.connected) {
    console.log('[Socket] Cleaning up disconnected socket');
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }

  isConnecting = true;
  console.log('[Socket] Creating new connection...');

  socket = io(SOCKET_URL, {
    auth: { token },
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    isConnecting = false;
    console.log('[Socket] Connected successfully:', socket?.id);
  });

  socket.on('connect_error', (error) => {
    isConnecting = false;
    console.error('[Socket] Connection error:', error.message);
  });

  socket.on('disconnect', (reason) => {
    isConnecting = false;
    console.log('[Socket] Disconnected:', reason);
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    console.log('[Socket] Disconnecting...');
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
    isConnecting = false;
  }
};

export const getSocket = () => socket;

// Message events
export const sendSocketMessage = (receiverId: string, content: string) => {
  if (socket) {
    socket.emit('sendMessage', { receiverId, content });
  }
};

export const onReceiveMessage = (callback: (message: any) => void) => {
  if (socket) {
    socket.on('receiveMessage', callback);
  }
};

export const onMessageSent = (callback: (message: any) => void) => {
  if (socket) {
    socket.on('messageSent', callback);
  }
};

export const onMessageError = (callback: (error: any) => void) => {
  if (socket) {
    socket.on('messageError', callback);
  }
};

// Typing indicators
export const emitTyping = (receiverId: string) => {
  if (socket) {
    socket.emit('typing', { receiverId });
  }
};

export const emitStopTyping = (receiverId: string) => {
  if (socket) {
    socket.emit('stopTyping', { receiverId });
  }
};

export const onUserTyping = (callback: (data: { userId: string; userName: string }) => void) => {
  if (socket) {
    socket.on('userTyping', callback);
  }
};

export const onUserStoppedTyping = (callback: (data: { userId: string }) => void) => {
  if (socket) {
    socket.on('userStoppedTyping', callback);
  }
};

// Online users
export const onOnlineUsers = (callback: (userIds: string[]) => void) => {
  if (socket) {
    socket.on('onlineUsers', callback);
  }
};

// Mark as read
export const markMessagesAsRead = (senderId: string) => {
  if (socket) {
    socket.emit('markAsRead', { senderId });
  }
};

export const onMessagesRead = (callback: (data: { readBy: string }) => void) => {
  if (socket) {
    socket.on('messagesRead', callback);
  }
};

// Clean up listeners
export const removeAllListeners = () => {
  if (socket) {
    socket.removeAllListeners();
  }
};

// ============================================
// VIDEO CALL EVENTS
// ============================================

// Initiate a video call
export const initiateVideoCall = (calleeId: string) => {
  if (socket) {
    socket.emit('video:call-initiate', { calleeId });
  }
};

// Accept incoming call
export const acceptVideoCall = (callerId: string, roomId: string) => {
  if (socket) {
    socket.emit('video:call-accept', { callerId, roomId });
  }
};

// Reject incoming call
export const rejectVideoCall = (callerId: string, roomId: string) => {
  if (socket) {
    socket.emit('video:call-reject', { callerId, roomId });
  }
};

// End active call
export const endVideoCall = (roomId: string) => {
  if (socket) {
    socket.emit('video:call-end', { roomId });
  }
};

// Send WebRTC offer
export const sendVideoOffer = (roomId: string, offer: RTCSessionDescriptionInit) => {
  if (socket) {
    socket.emit('video:offer', { roomId, offer });
  }
};

// Send WebRTC answer
export const sendVideoAnswer = (roomId: string, answer: RTCSessionDescriptionInit) => {
  if (socket) {
    socket.emit('video:answer', { roomId, answer });
  }
};

// Send ICE candidate
export const sendIceCandidate = (roomId: string, candidate: RTCIceCandidateInit) => {
  if (socket) {
    socket.emit('video:ice-candidate', { roomId, candidate });
  }
};

// Toggle audio
export const toggleAudio = (roomId: string, audioEnabled: boolean) => {
  if (socket) {
    socket.emit('video:toggle-audio', { roomId, audioEnabled });
  }
};

// Toggle video
export const toggleVideo = (roomId: string, videoEnabled: boolean) => {
  if (socket) {
    socket.emit('video:toggle-video', { roomId, videoEnabled });
  }
};

// Listen for incoming call
export const onIncomingCall = (callback: (data: { callerId: string; callerName: string; callerAvatar: string; roomId: string }) => void) => {
  if (socket) {
    socket.on('video:incoming-call', callback);
  }
};

// Listen for call ringing
export const onCallRinging = (callback: (data: { calleeId: string; roomId: string }) => void) => {
  if (socket) {
    socket.on('video:call-ringing', callback);
  }
};

// Listen for call accepted
export const onCallAccepted = (callback: (data: { calleeId: string; roomId: string }) => void) => {
  if (socket) {
    socket.on('video:call-accepted', callback);
  }
};

// Listen for call rejected
export const onCallRejected = (callback: (data: { calleeId: string }) => void) => {
  if (socket) {
    socket.on('video:call-rejected', callback);
  }
};

// Listen for call ended
export const onCallEnded = (callback: (data: { endedBy: string; roomId: string; reason?: string }) => void) => {
  if (socket) {
    socket.on('video:call-ended', callback);
  }
};

// Listen for user busy
export const onUserBusy = (callback: (data: { calleeId: string }) => void) => {
  if (socket) {
    socket.on('video:busy', callback);
  }
};

// Listen for WebRTC offer
export const onVideoOffer = (callback: (data: { offer: RTCSessionDescriptionInit; senderId: string; roomId: string }) => void) => {
  if (socket) {
    socket.on('video:offer', callback);
  }
};

// Listen for WebRTC answer
export const onVideoAnswer = (callback: (data: { answer: RTCSessionDescriptionInit; senderId: string; roomId: string }) => void) => {
  if (socket) {
    socket.on('video:answer', callback);
  }
};

// Listen for ICE candidate
export const onIceCandidate = (callback: (data: { candidate: RTCIceCandidateInit; senderId: string; roomId: string }) => void) => {
  if (socket) {
    socket.on('video:ice-candidate', callback);
  }
};

// Listen for partner audio toggle
export const onPartnerAudioToggle = (callback: (data: { partnerId: string; audioEnabled: boolean }) => void) => {
  if (socket) {
    socket.on('video:partner-audio-toggle', callback);
  }
};

// Listen for partner video toggle
export const onPartnerVideoToggle = (callback: (data: { partnerId: string; videoEnabled: boolean }) => void) => {
  if (socket) {
    socket.on('video:partner-video-toggle', callback);
  }
};

// Listen for video errors
export const onVideoError = (callback: (data: { error: string }) => void) => {
  if (socket) {
    socket.on('video:error', callback);
  }
};
