import React, { useState } from 'react';
import { X, Calendar, Clock, User, MapPin, Video, Check, XCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import { format } from 'date-fns';

interface Meeting {
  id: string;
  _id?: string;
  title: string;
  description?: string;
  host: {
    id: string;
    _id?: string;
    name: string;
    avatarUrl: string;
  };
  guest: {
    id: string;
    _id?: string;
    name: string;
    avatarUrl: string;
  };
  startTime: string;
  endTime: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  meetingLink?: string;
  createdAt: string;
}

interface MeetingDetailsModalProps {
  isOpen: boolean;
  meeting: Meeting | null;
  currentUserId: string;
  onClose: () => void;
  onEdit?: (meeting: Meeting) => void;
  onDelete?: (meetingId: string) => void;
  onStatusUpdate?: (meetingId: string, status: 'accepted' | 'rejected') => void;
}

export const MeetingDetailsModal: React.FC<MeetingDetailsModalProps> = ({
  isOpen,
  meeting,
  currentUserId,
  onClose,
  onEdit,
  onDelete,
  onStatusUpdate,
}) => {
  if (!isOpen || !meeting) return null;

  const hostId = meeting.host.id || meeting.host._id;
  const isHost = hostId === currentUserId;

  const getStatusBadge = () => {
    switch (meeting.status) {
      case 'pending':
        return <Badge variant="warning">Pending</Badge>;
      case 'accepted':
        return <Badge variant="success">Accepted</Badge>;
      case 'rejected':
        return <Badge variant="error">Rejected</Badge>;
      case 'cancelled':
        return <Badge variant="gray">Cancelled</Badge>;
      default:
        return null;
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'EEEE, MMMM d, yyyy \'at\' h:mm a');
  };

  const getDuration = () => {
    const start = new Date(meeting.startTime);
    const end = new Date(meeting.endTime);
    const minutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours > 0) {
      return `${hours}h ${mins > 0 ? `${mins}m` : ''}`;
    }
    return `${mins}m`;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-white mb-1">
                  {meeting.title}
                </h3>
                <div className="flex items-center gap-2">
                  {getStatusBadge()}
                  <span className="text-sm text-primary-100">
                    {isHost ? 'You are hosting this meeting' : `Hosted by ${meeting.host.name}`}
                  </span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white px-6 py-5 space-y-5">
            {/* Participants */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Participants</h4>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <Avatar src={meeting.host.avatarUrl} alt={meeting.host.name} size="md" />
                  <div>
                    <p className="font-medium text-gray-900">{meeting.host.name}</p>
                    <p className="text-sm text-gray-500">Host</p>
                  </div>
                </div>
                <div className="text-gray-400">
                  <XCircle size={20} />
                </div>
                <div className="flex items-center gap-3">
                  <Avatar src={meeting.guest.avatarUrl} alt={meeting.guest.name} size="md" />
                  <div>
                    <p className="font-medium text-gray-900">{meeting.guest.name}</p>
                    <p className="text-sm text-gray-500">Guest</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Date & Time */}
            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Date & Time</h4>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Calendar size={18} className="text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {formatDateTime(meeting.startTime)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Ends at {format(new Date(meeting.endTime), 'h:mm a')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock size={18} className="text-gray-400" />
                  <p className="text-sm text-gray-900">Duration: {getDuration()}</p>
                </div>
              </div>
            </div>

            {/* Description */}
            {meeting.description && (
              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">
                  {meeting.description}
                </p>
              </div>
            )}

            {/* Meeting Link */}
            {meeting.meetingLink && (
              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Meeting Link</h4>
                <a
                  href={meeting.meetingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 hover:underline"
                >
                  <Video size={16} />
                  {meeting.meetingLink}
                </a>
              </div>
            )}

            {/* Actions */}
            <div className="border-t border-gray-200 pt-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">
                  Created {format(new Date(meeting.createdAt), 'MMM d, yyyy')}
                </span>

                <div className="flex gap-2">
                  {/* Guest actions for pending meetings */}
                  {!isHost && meeting.status === 'pending' && onStatusUpdate && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        leftIcon={<XCircle size={16} />}
                        onClick={() => {
                          onStatusUpdate(meeting.id || meeting._id || '', 'rejected');
                          onClose();
                        }}
                      >
                        Decline
                      </Button>
                      <Button
                        size="sm"
                        variant="success"
                        leftIcon={<Check size={16} />}
                        onClick={() => {
                          onStatusUpdate(meeting.id || meeting._id || '', 'accepted');
                          onClose();
                        }}
                      >
                        Accept
                      </Button>
                    </>
                  )}

                  {/* Host actions */}
                  {isHost && (meeting.status === 'pending' || meeting.status === 'accepted') && (
                    <>
                      {onEdit && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            onEdit(meeting);
                            onClose();
                          }}
                        >
                          Edit Meeting
                        </Button>
                      )}
                      {onDelete && (
                        <Button
                          size="sm"
                          variant="error"
                          onClick={() => {
                            onDelete(meeting.id || meeting._id || '');
                            onClose();
                          }}
                        >
                          Cancel Meeting
                        </Button>
                      )}
                    </>
                  )}

                  {/* Close button for completed/cancelled meetings */}
                  {(meeting.status === 'cancelled' || meeting.status === 'rejected' ||
                    (meeting.status === 'accepted' && !isHost)) && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={onClose}
                    >
                      Close
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
