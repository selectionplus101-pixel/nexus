import React, { useState, useEffect } from 'react';
import { Plus, Calendar as CalendarIcon, Filter, List, Grid } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardBody } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { MeetingCard } from '../../components/meetings/MeetingCard';
import { MeetingCalendar } from '../../components/meetings/MeetingCalendar';
import { MeetingDetailsModal } from '../../components/meetings/MeetingDetailsModal';
import { CreateMeetingModal } from '../../components/meetings/CreateMeetingModal';
import { useAuth } from '../../context/AuthContext';
import { meetingsApi } from '../../services/api';
import toast from 'react-hot-toast';

export const MeetingsPage: React.FC = () => {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<any>(null);
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [detailsMeeting, setDetailsMeeting] = useState<any>(null);

  useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = async () => {
    try {
      setIsLoading(true);
      const data = await meetingsApi.getAll();
      setMeetings(data);
    } catch (error: any) {
      console.error('Error fetching meetings:', error);
      toast.error('Failed to load meetings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (meetingId: string) => {
    if (!window.confirm('Are you sure you want to cancel this meeting?')) {
      return;
    }

    try {
      await meetingsApi.delete(meetingId);
      toast.success('Meeting cancelled successfully');
      fetchMeetings();
    } catch (error: any) {
      console.error('Error deleting meeting:', error);
      toast.error('Failed to cancel meeting');
    }
  };

  const handleStatusUpdate = async (meetingId: string, status: 'accepted' | 'rejected') => {
    try {
      await meetingsApi.update(meetingId, { status });
      toast.success(`Meeting ${status === 'accepted' ? 'accepted' : 'declined'}`);
      fetchMeetings();
    } catch (error: any) {
      console.error('Error updating meeting:', error);
      toast.error('Failed to update meeting status');
    }
  };

  const handleEdit = (meeting: any) => {
    setSelectedMeeting(meeting);
    setIsModalOpen(true);
  };

  const handleSelectMeeting = (meeting: any) => {
    setDetailsMeeting(meeting);
    setIsDetailsModalOpen(true);
  };

  const toggleStatus = (status: string) => {
    setSelectedStatus(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  const filteredMeetings = selectedStatus.length === 0
    ? meetings
    : meetings.filter(m => selectedStatus.includes(m.status));

  const upcomingMeetings = filteredMeetings.filter(
    m => new Date(m.startTime) > new Date() && m.status === 'accepted'
  );
  const pendingMeetings = filteredMeetings.filter(m => m.status === 'pending');
  const pastMeetings = filteredMeetings.filter(
    m => new Date(m.startTime) <= new Date() || m.status === 'rejected' || m.status === 'cancelled'
  );

  if (!user) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meetings</h1>
          <p className="text-gray-600">Manage your scheduled meetings and appointments</p>
        </div>

        <div className="flex gap-2">
          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List size={16} className="inline mr-1" />
              List
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'calendar'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Grid size={16} className="inline mr-1" />
              Calendar
            </button>
          </div>

          <Button
            leftIcon={<Plus size={18} />}
            onClick={() => setIsModalOpen(true)}
          >
            Schedule Meeting
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-primary-50 border-primary-100">
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-primary-100 rounded-lg mr-3">
                <CalendarIcon size={20} className="text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Upcoming</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {upcomingMeetings.length}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-warning-50 border-warning-100">
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-warning-100 rounded-lg mr-3">
                <CalendarIcon size={20} className="text-warning-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {pendingMeetings.length}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gray-50 border-gray-100">
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-gray-100 rounded-lg mr-3">
                <CalendarIcon size={20} className="text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {meetings.length}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Filters - Only show in list view */}
      {viewMode === 'list' && (
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-gray-500" />
          <span className="text-sm text-gray-600 mr-2">Filter by status:</span>
          {['pending', 'accepted', 'rejected', 'cancelled'].map(status => (
            <Badge
              key={status}
              variant={selectedStatus.includes(status) ? 'primary' : 'gray'}
              className="cursor-pointer capitalize"
              onClick={() => toggleStatus(status)}
            >
              {status}
            </Badge>
          ))}
        </div>
      )}

      {/* Calendar View */}
      {viewMode === 'calendar' && !isLoading && (
        <MeetingCalendar
          meetings={meetings}
          onSelectMeeting={handleSelectMeeting}
          currentUserId={user.id}
        />
      )}

      {/* Meetings List */}
      {viewMode === 'list' && (
        isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
          <p className="ml-4 text-gray-600">Loading meetings...</p>
        </div>
      ) : filteredMeetings.length === 0 ? (
        <Card>
          <CardBody className="text-center py-12">
            <div className="bg-gray-100 p-6 rounded-full inline-block mb-4">
              <CalendarIcon size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">No meetings found</h3>
            <p className="text-gray-600 mt-2">
              {selectedStatus.length > 0
                ? 'No meetings match the selected filters.'
                : 'Schedule your first meeting to get started.'}
            </p>
            {selectedStatus.length === 0 && (
              <Button
                className="mt-4"
                onClick={() => setIsModalOpen(true)}
              >
                Schedule Meeting
              </Button>
            )}
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Pending Meetings */}
          {pendingMeetings.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                Pending ({pendingMeetings.length})
              </h2>
              <div className="grid grid-cols-1 gap-4">
                {pendingMeetings.map(meeting => (
                  <MeetingCard
                    key={meeting.id || meeting._id}
                    meeting={meeting}
                    currentUserId={user.id}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onStatusUpdate={handleStatusUpdate}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Meetings */}
          {upcomingMeetings.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                Upcoming ({upcomingMeetings.length})
              </h2>
              <div className="grid grid-cols-1 gap-4">
                {upcomingMeetings.map(meeting => (
                  <MeetingCard
                    key={meeting.id || meeting._id}
                    meeting={meeting}
                    currentUserId={user.id}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onStatusUpdate={handleStatusUpdate}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Past Meetings */}
          {pastMeetings.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                Past ({pastMeetings.length})
              </h2>
              <div className="grid grid-cols-1 gap-4">
                {pastMeetings.map(meeting => (
                  <MeetingCard
                    key={meeting.id || meeting._id}
                    meeting={meeting}
                    currentUserId={user.id}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )
      )}

      {/* Meeting Details Modal */}
      <MeetingDetailsModal
        isOpen={isDetailsModalOpen}
        meeting={detailsMeeting}
        currentUserId={user.id}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setDetailsMeeting(null);
        }}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onStatusUpdate={handleStatusUpdate}
      />

      {/* Create Meeting Modal */}
      <CreateMeetingModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedMeeting(null);
        }}
        onSuccess={fetchMeetings}
        meetingToEdit={selectedMeeting}
      />
    </div>
  );
};
