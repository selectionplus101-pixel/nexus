import React from 'react';
import { Calendar, Clock, Video, Edit2, Trash2, X } from 'lucide-react';
import { Card, CardBody, CardHeader } from '../ui/Card';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { formatDistanceToNow } from 'date-fns';

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

interface MeetingCardProps {
  meeting: Meeting;
  currentUserId: string;
  onEdit?: (meeting: Meeting) => void;
  onDelete?: (meetingId: string) => void;
  onStatusUpdate?: (meetingId: string, status: 'accepted' | 'rejected') => void;
}

export const MeetingCard: React.FC<MeetingCardProps> = ({
  meeting,
  currentUserId,
  onEdit,
  onDelete,
  onStatusUpdate
}) => {
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
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="border-b border-gray-100">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">{meeting.title}</h3>
            <p className="text-sm text-gray-500 mt-1">
              {isHost ? 'You are hosting' : `Hosted by ${meeting.host.name}`}
            </p>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>

      <CardBody className="space-y-4">
        {/* Participants */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Avatar src={meeting.host.avatarUrl} alt={meeting.host.name} size="sm" />
            <span className="text-sm text-gray-700">{meeting.host.name}</span>
          </div>
          <X size={16} className="text-gray-400" />
          <div className="flex items-center space-x-2">
            <Avatar src={meeting.guest.avatarUrl} alt={meeting.guest.name} size="sm" />
            <span className="text-sm text-gray-700">{meeting.guest.name}</span>
          </div>
        </div>

        {/* Time */}
        <div className="space-y-2">
          <div className="flex items-center text-sm text-gray-600">
            <Calendar size={16} className="mr-2" />
            <span>{formatDateTime(meeting.startTime)}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Clock size={16} className="mr-2" />
            <span>
              Duration: {Math.round((new Date(meeting.endTime).getTime() - new Date(meeting.startTime).getTime()) / (1000 * 60))} minutes
            </span>
          </div>
        </div>

        {/* Description */}
        {meeting.description && (
          <p className="text-sm text-gray-600 border-t pt-3">{meeting.description}</p>
        )}

        {/* Meeting Link */}
        {meeting.meetingLink && meeting.status === 'accepted' && (
          <div className="border-t pt-3">
            <a
              href={meeting.meetingLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-sm text-primary-600 hover:text-primary-700"
            >
              <Video size={16} className="mr-2" />
              Join Meeting
            </a>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between items-center border-t pt-3">
          <span className="text-xs text-gray-500">
            Created {formatDistanceToNow(new Date(meeting.createdAt), { addSuffix: true })}
          </span>

          <div className="flex space-x-2">
            {!isHost && meeting.status === 'pending' && onStatusUpdate && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onStatusUpdate(meeting.id || meeting._id || '', 'rejected')}
                >
                  Decline
                </Button>
                <Button
                  size="sm"
                  variant="success"
                  onClick={() => onStatusUpdate(meeting.id || meeting._id || '', 'accepted')}
                >
                  Accept
                </Button>
              </>
            )}

            {isHost && (meeting.status === 'pending' || meeting.status === 'accepted') && (
              <>
                {onEdit && (
                  <Button
                    size="sm"
                    variant="outline"
                    leftIcon={<Edit2 size={14} />}
                    onClick={() => onEdit(meeting)}
                  >
                    Edit
                  </Button>
                )}
                {onDelete && (
                  <Button
                    size="sm"
                    variant="outline"
                    leftIcon={<Trash2 size={14} />}
                    onClick={() => onDelete(meeting.id || meeting._id || '')}
                  >
                    Cancel
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  );
};
