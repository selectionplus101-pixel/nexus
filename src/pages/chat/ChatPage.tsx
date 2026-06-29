import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Send, Video, Info, Smile } from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ChatMessage } from '../../components/chat/ChatMessage';
import { useAuth } from '../../context/AuthContext';
import { Message } from '../../types';
import { usersApi, messagesApi } from '../../services/api';
import {
  sendSocketMessage,
  onReceiveMessage,
  onMessageSent,
  emitTyping,
  emitStopTyping,
  onUserTyping,
  onUserStoppedTyping,
  removeAllListeners,
  initiateVideoCall,
  acceptVideoCall,
  rejectVideoCall,
  onIncomingCall,
  onCallRinging,
  onCallAccepted,
  onCallRejected,
  onUserBusy,
  onVideoError,
} from '../../services/socket';
import { VideoCallModal } from '../../components/video/VideoCallModal';
import { IncomingCallModal } from '../../components/video/IncomingCallModal';
import toast from 'react-hot-toast';

export const ChatPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatPartner, setChatPartner] = useState<any>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Video call states
  const [isVideoCallActive, setIsVideoCallActive] = useState(false);
  const [isIncomingCall, setIsIncomingCall] = useState(false);
  const [incomingCallData, setIncomingCallData] = useState<any>(null);
  const [currentRoomId, setCurrentRoomId] = useState<string>('');
  const [isCaller, setIsCaller] = useState(false);
  const [isCallRinging, setIsCallRinging] = useState(false);

  // Fetch chat partner details
  useEffect(() => {
    const fetchChatPartner = async () => {
      if (!userId) return;

      try {
        const user = await usersApi.getById(userId);
        setChatPartner(user);
      } catch (error) {
        console.error('Error fetching chat partner:', error);
        toast.error('Failed to load user details');
      }
    };

    fetchChatPartner();
  }, [userId]);

  // Fetch messages
  useEffect(() => {
    const fetchMessages = async () => {
      if (!userId) return;

      try {
        setIsLoadingMessages(true);
        const data = await messagesApi.getConversation(userId);
        setMessages(data);

        // Mark messages as read
        await messagesApi.markAsRead(userId);
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setIsLoadingMessages(false);
      }
    };

    fetchMessages();
  }, [userId]);

  // Set up Socket.IO listeners
  useEffect(() => {
    // Chat message listeners
    onReceiveMessage((message) => {
      if (message.senderId === userId || message.receiverId === userId) {
        setMessages((prev) => [...prev, message]);

        // Mark as read if this is the active chat
        if (message.senderId === userId) {
          messagesApi.markAsRead(userId).catch(console.error);
        }
      }
    });

    onMessageSent((message) => {
      setMessages((prev) => {
        const exists = prev.some((m) => m.id === message.id);
        return exists ? prev : [...prev, message];
      });
    });

    // Typing indicators
    onUserTyping((data) => {
      if (data.userId === userId) {
        setIsTyping(true);
      }
    });

    onUserStoppedTyping((data) => {
      if (data.userId === userId) {
        setIsTyping(false);
      }
    });

    // Video call listeners
    onIncomingCall((data) => {
      if (data.callerId === userId) {
        setIncomingCallData(data);
        setIsIncomingCall(true);
      }
    });

    onCallRinging((data) => {
      setIsCallRinging(true);
      setCurrentRoomId(data.roomId);
      toast.success('Calling...');
    });

    onCallAccepted((data) => {
      setIsCallRinging(false);
      setIsVideoCallActive(true);
      setCurrentRoomId(data.roomId);
      setIsCaller(true);
      toast.success('Call connected!');
    });

    onCallRejected(() => {
      setIsCallRinging(false);
      setCurrentRoomId('');
      setIsCaller(false);
      toast.error('Call was declined');
    });

    onUserBusy(() => {
      toast.error('User is busy on another call');
    });

    onVideoError((data) => {
      toast.error(data.error);
    });

    // Clean up listeners on unmount
    return () => {
      removeAllListeners();
    };
  }, [userId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle typing
  const handleTyping = () => {
    if (!userId) return;

    emitTyping(userId);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      emitStopTyping(userId);
    }, 2000);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || !currentUser || !userId) return;

    const messageContent = newMessage.trim();
    setNewMessage('');

    emitStopTyping(userId);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    try {
      sendSocketMessage(userId, messageContent);
      const savedMessage = await messagesApi.send(userId, messageContent);
      setMessages((prev) => [...prev, savedMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    handleTyping();
  };

  // Video call handlers
  const handleStartVideoCall = () => {
    if (!userId) return;

    if (!chatPartner?.isOnline) {
      toast.error('User is offline');
      return;
    }

    initiateVideoCall(userId);
    setIsCaller(true);
  };

  const handleAcceptCall = () => {
    if (!incomingCallData) return;

    acceptVideoCall(incomingCallData.callerId, incomingCallData.roomId);
    setIsIncomingCall(false);
    setIsVideoCallActive(true);
    setCurrentRoomId(incomingCallData.roomId);
    setIsCaller(false);
  };

  const handleRejectCall = () => {
    if (!incomingCallData) return;

    rejectVideoCall(incomingCallData.callerId, incomingCallData.roomId);
    setIsIncomingCall(false);
    setIncomingCallData(null);
  };

  const handleCloseVideoCall = () => {
    setIsVideoCallActive(false);
    setIsCallRinging(false);
    setCurrentRoomId('');
    setIsCaller(false);
  };

  if (!currentUser) return null;

  return (
    <>
      <div className="flex h-[calc(100vh-4rem)] bg-white border border-gray-200 rounded-lg overflow-hidden animate-fade-in">
        {/* Main chat area */}
        <div className="flex-1 flex flex-col">
          {/* Chat header */}
          {chatPartner ? (
            <>
              <div className="border-b border-gray-200 p-4 flex justify-between items-center">
                <div className="flex items-center">
                  <Avatar
                    src={chatPartner.avatarUrl}
                    alt={chatPartner.name}
                    size="md"
                    status={chatPartner.isOnline ? 'online' : 'offline'}
                    className="mr-3"
                  />

                  <div>
                    <h2 className="text-lg font-medium text-gray-900">{chatPartner.name}</h2>
                    <p className="text-sm text-gray-500">
                      {isTyping ? 'Typing...' : chatPartner.isOnline ? 'Online' : 'Offline'}
                    </p>
                  </div>
                </div>

                <div className="flex space-x-2">
                  {/* Video Call Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full p-2"
                    aria-label="Start video call"
                    onClick={handleStartVideoCall}
                    disabled={isCallRinging || isVideoCallActive || !chatPartner.isOnline}
                  >
                    <Video size={18} className={chatPartner.isOnline ? 'text-primary-600' : 'text-gray-400'} />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full p-2"
                    aria-label="Info"
                  >
                    <Info size={18} />
                  </Button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {isLoadingMessages ? (
                  <div className="flex justify-center items-center h-full">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex justify-center items-center h-full">
                    <p className="text-gray-500">No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <ChatMessage
                      key={message.id}
                      message={message}
                      isCurrentUser={message.senderId === currentUser.id}
                    />
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message input */}
              <div className="border-t border-gray-200 p-4">
                <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="rounded-full p-2"
                    aria-label="Add emoji"
                  >
                    <Smile size={18} />
                  </Button>

                  <Input
                    value={newMessage}
                    onChange={handleMessageChange}
                    placeholder="Type a message..."
                    fullWidth
                    className="flex-1"
                  />

                  <Button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="rounded-full"
                  >
                    <Send size={18} />
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <p className="text-gray-500">Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Incoming Call Modal */}
      {isIncomingCall && incomingCallData && (
        <IncomingCallModal
          isOpen={isIncomingCall}
          callerName={incomingCallData.callerName}
          callerAvatar={incomingCallData.callerAvatar}
          onAccept={handleAcceptCall}
          onReject={handleRejectCall}
        />
      )}

      {/* Video Call Modal */}
      {isVideoCallActive && chatPartner && (
        <VideoCallModal
          isOpen={isVideoCallActive}
          onClose={handleCloseVideoCall}
          partnerId={userId!}
          partnerName={chatPartner.name}
          partnerAvatar={chatPartner.avatarUrl}
          roomId={currentRoomId}
          isCaller={isCaller}
        />
      )}

      {/* Call Ringing Indicator */}
      {isCallRinging && (
        <div className="fixed bottom-4 right-4 bg-primary-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-pulse">
          <Video size={20} />
          <span>Calling {chatPartner?.name}...</span>
        </div>
      )}
    </>
  );
};
