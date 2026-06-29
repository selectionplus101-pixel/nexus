import React from 'react';
import { Phone, PhoneOff, Video } from 'lucide-react';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';

interface IncomingCallModalProps {
  isOpen: boolean;
  callerName: string;
  callerAvatar?: string;
  onAccept: () => void;
  onReject: () => void;
}

export const IncomingCallModal: React.FC<IncomingCallModalProps> = ({
  isOpen,
  callerName,
  callerAvatar,
  onAccept,
  onReject,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        {/* Background overlay */}
        <div className="fixed inset-0 bg-black bg-opacity-75 transition-opacity" />

        {/* Modal panel */}
        <div className="relative bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl shadow-2xl p-8 w-full max-w-md text-center animate-pulse-slow">
          {/* Caller info */}
          <div className="mb-8">
            <Avatar
              src={callerAvatar}
              alt={callerName}
              size="xl"
              className="mx-auto mb-4 ring-4 ring-white ring-opacity-50"
            />
            <h2 className="text-white text-2xl font-bold mb-2">{callerName}</h2>
            <div className="flex items-center justify-center gap-2 text-white text-lg">
              <Video size={20} />
              <span>Incoming video call...</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-center gap-6">
            {/* Reject button */}
            <button
              onClick={onReject}
              className="flex flex-col items-center gap-2 group"
              aria-label="Reject call"
            >
              <div className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 transition-all flex items-center justify-center shadow-lg group-hover:scale-110">
                <PhoneOff size={28} className="text-white" />
              </div>
              <span className="text-white text-sm font-medium">Decline</span>
            </button>

            {/* Accept button */}
            <button
              onClick={onAccept}
              className="flex flex-col items-center gap-2 group"
              aria-label="Accept call"
            >
              <div className="w-16 h-16 rounded-full bg-green-600 hover:bg-green-700 transition-all flex items-center justify-center shadow-lg group-hover:scale-110 animate-bounce">
                <Phone size={28} className="text-white" />
              </div>
              <span className="text-white text-sm font-medium">Accept</span>
            </button>
          </div>

          {/* Ringing animation */}
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-white bg-opacity-10 rounded-full animate-ping" />
          <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-white bg-opacity-10 rounded-full animate-ping animation-delay-1000" />
        </div>
      </div>
    </div>
  );
};
