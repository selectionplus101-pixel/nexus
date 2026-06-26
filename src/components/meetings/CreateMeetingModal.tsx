import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, Video } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { usersApi, meetingsApi } from '../../services/api';
import toast from 'react-hot-toast';

interface CreateMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  preSelectedUserId?: string;
  meetingToEdit?: any;
}

const formatForDateTimeLocal = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export const CreateMeetingModal: React.FC<CreateMeetingModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  preSelectedUserId,
  meetingToEdit
}) => {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    guestId: preSelectedUserId || '',
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    meetingLink: '',
    status: 'pending'
  });

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      if (meetingToEdit) {
        setFormData({
          guestId: meetingToEdit.guest?.id || meetingToEdit.guest?._id || '',
          title: meetingToEdit.title || '',
          description: meetingToEdit.description || '',
          startTime: formatForDateTimeLocal(meetingToEdit.startTime),
          endTime: formatForDateTimeLocal(meetingToEdit.endTime),
          meetingLink: meetingToEdit.meetingLink || '',
          status: meetingToEdit.status || 'pending'
        });
      } else {
        setFormData({
          guestId: preSelectedUserId || '',
          title: '',
          description: '',
          startTime: '',
          endTime: '',
          meetingLink: '',
          status: 'pending'
        });
      }
    }
  }, [isOpen, preSelectedUserId, meetingToEdit]);

  const fetchUsers = async () => {
    try {
      setIsLoadingUsers(true);
      const data = await usersApi.getAll({});
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.guestId || !formData.title || !formData.startTime || !formData.endTime) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const payload: any = {
        title: formData.title,
        description: formData.description || undefined,
        startTime: new Date(formData.startTime).toISOString(),
        endTime: new Date(formData.endTime).toISOString(),
        meetingLink: formData.meetingLink || undefined
      };

      if (meetingToEdit) {
        payload.status = formData.status;
        await meetingsApi.update(meetingToEdit.id || meetingToEdit._id, payload);
        toast.success('Meeting updated successfully!');
      } else {
        payload.guestId = formData.guestId;
        await meetingsApi.create(payload);
        toast.success('Meeting scheduled successfully!');
      }

      onSuccess();
      onClose();
      resetForm();
    } catch (error: any) {
      console.error('Error submitting meeting:', error);
      toast.error(error.response?.data?.message || 'Failed to save meeting');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      guestId: '',
      title: '',
      description: '',
      startTime: '',
      endTime: '',
      meetingLink: '',
      status: 'pending'
    });
  };

  if (!isOpen) return null;

  // Merge fetched users with meeting guest/host if not present to ensure it's always displayable
  const displayUsers = [...users];
  if (meetingToEdit) {
    const guestId = meetingToEdit.guest?.id || meetingToEdit.guest?._id;
    const exists = users.some(u => (u.id || u._id) === guestId);
    if (!exists && meetingToEdit.guest) {
      displayUsers.push({
        id: guestId,
        name: meetingToEdit.guest.name,
        role: meetingToEdit.guest.role
      });
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {meetingToEdit ? 'Edit Meeting' : 'Schedule Meeting'}
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Guest Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <User size={16} className="inline mr-1" />
                  Select Guest *
                </label>
                <select
                  value={formData.guestId}
                  onChange={(e) => setFormData({ ...formData, guestId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-gray-50 disabled:opacity-70"
                  required
                  disabled={isLoadingUsers || !!preSelectedUserId || !!meetingToEdit}
                >
                  <option value="">Select a user...</option>
                  {displayUsers.map((u) => (
                    <option key={u.id || u._id} value={u.id || u._id}>
                      {u.name} ({u.role})
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meeting Title *
                </label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Investment Discussion"
                  required
                  fullWidth
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional meeting notes or agenda..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Start Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar size={16} className="inline mr-1" />
                  Start Time *
                </label>
                <input
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>

              {/* End Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Clock size={16} className="inline mr-1" />
                  End Time *
                </label>
                <input
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>

              {/* Meeting Link */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Video size={16} className="inline mr-1" />
                  Meeting Link (Optional)
                </label>
                <Input
                  value={formData.meetingLink}
                  onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
                  placeholder="https://zoom.us/..."
                  type="url"
                  fullWidth
                />
              </div>

              {/* Status Select (only when editing) */}
              {meetingToEdit && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  >
                    <option value="pending">Pending</option>
                    <option value="accepted">Accepted</option>
                    <option value="rejected">Rejected</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : (meetingToEdit ? 'Save Changes' : 'Schedule Meeting')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
