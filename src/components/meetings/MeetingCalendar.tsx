import React, { useState } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';

// Setup the localizer for react-big-calendar
const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface CalendarMeeting {
  id: string;
  _id?: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
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
  meetingLink?: string;
}

interface MeetingCalendarProps {
  meetings: any[];
  onSelectMeeting: (meeting: any) => void;
  currentUserId: string;
}

export const MeetingCalendar: React.FC<MeetingCalendarProps> = ({
  meetings,
  onSelectMeeting,
  currentUserId,
}) => {
  const [view, setView] = useState<View>('month');
  const [date, setDate] = useState(new Date());

  // Transform meetings for calendar display
  const calendarEvents: CalendarMeeting[] = meetings.map((meeting) => ({
    ...meeting,
    id: meeting.id || meeting._id,
    start: new Date(meeting.startTime),
    end: new Date(meeting.endTime),
  }));

  // Custom event styling based on status
  const eventStyleGetter = (event: CalendarMeeting) => {
    const hostId = event.host.id || event.host._id;
    const isHost = hostId === currentUserId;

    let backgroundColor = '#3b82f6'; // default blue
    let borderColor = '#2563eb';

    switch (event.status) {
      case 'pending':
        backgroundColor = '#f59e0b';
        borderColor = '#d97706';
        break;
      case 'accepted':
        backgroundColor = '#10b981';
        borderColor = '#059669';
        break;
      case 'rejected':
        backgroundColor = '#ef4444';
        borderColor = '#dc2626';
        break;
      case 'cancelled':
        backgroundColor = '#6b7280';
        borderColor = '#4b5563';
        break;
    }

    return {
      style: {
        backgroundColor,
        borderColor,
        borderLeft: `4px solid ${borderColor}`,
        color: 'white',
        borderRadius: '4px',
        opacity: event.status === 'cancelled' || event.status === 'rejected' ? 0.7 : 1,
        cursor: 'pointer',
        padding: '2px 5px',
        fontSize: '0.875rem',
      },
    };
  };

  // Custom event title with status indicator
  const EventComponent = ({ event }: { event: CalendarMeeting }) => {
    const hostId = event.host.id || event.host._id;
    const isHost = hostId === currentUserId;

    return (
      <div className="flex flex-col">
        <strong className="truncate">{event.title}</strong>
        <span className="text-xs opacity-90">
          {isHost ? 'Hosting' : `with ${event.host.name}`}
        </span>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <style>{`
        .rbc-calendar {
          font-family: inherit;
          min-height: 600px;
        }

        .rbc-header {
          padding: 10px 3px;
          font-weight: 600;
          color: #374151;
          border-bottom: 2px solid #e5e7eb;
        }

        .rbc-today {
          background-color: #f0f9ff;
        }

        .rbc-off-range-bg {
          background-color: #f9fafb;
        }

        .rbc-event {
          padding: 2px 5px;
          border-radius: 4px;
        }

        .rbc-event:focus {
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
        }

        .rbc-toolbar {
          padding: 10px 0;
          margin-bottom: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 10px;
        }

        .rbc-toolbar button {
          color: #374151;
          border: 1px solid #d1d5db;
          background-color: white;
          padding: 6px 12px;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .rbc-toolbar button:hover {
          background-color: #f3f4f6;
          border-color: #9ca3af;
        }

        .rbc-toolbar button.rbc-active {
          background-color: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }

        .rbc-toolbar button.rbc-active:hover {
          background-color: #2563eb;
          border-color: #2563eb;
        }

        .rbc-month-view {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
        }

        .rbc-time-view {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
        }

        .rbc-agenda-view {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
        }

        .rbc-time-slot {
          min-height: 40px;
        }

        .rbc-time-header-content {
          border-left: 1px solid #e5e7eb;
        }

        .rbc-day-slot .rbc-time-slot {
          border-top: 1px solid #f3f4f6;
        }

        .rbc-current-time-indicator {
          background-color: #ef4444;
          height: 2px;
        }

        .rbc-agenda-table {
          border-spacing: 0;
          width: 100%;
        }

        .rbc-agenda-table tbody > tr > td {
          padding: 12px;
          border-bottom: 1px solid #e5e7eb;
        }

        .rbc-agenda-date-cell {
          white-space: nowrap;
          padding-right: 20px;
          font-weight: 500;
        }

        .rbc-agenda-time-cell {
          white-space: nowrap;
          padding-right: 20px;
          color: #6b7280;
        }

        .rbc-agenda-event-cell {
          width: 100%;
        }

        .rbc-show-more {
          background-color: white;
          color: #3b82f6;
          font-weight: 500;
          padding: 2px 5px;
          border-radius: 4px;
          cursor: pointer;
          z-index: 4;
        }

        .rbc-show-more:hover {
          background-color: #f0f9ff;
        }
      `}</style>

      <div className="mb-4 flex justify-end">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: '#f59e0b' }}></div>
            <span>Pending</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: '#10b981' }}></div>
            <span>Accepted</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: '#ef4444' }}></div>
            <span>Rejected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: '#6b7280' }}></div>
            <span>Cancelled</span>
          </div>
        </div>
      </div>

      <BigCalendar
        localizer={localizer}
        events={calendarEvents}
        startAccessor="start"
        endAccessor="end"
        style={{ minHeight: 600 }}
        view={view}
        onView={(newView) => setView(newView)}
        date={date}
        onNavigate={(newDate) => setDate(newDate)}
        onSelectEvent={(event) => onSelectMeeting(event)}
        eventPropGetter={eventStyleGetter}
        components={{
          event: EventComponent,
        }}
        views={['month', 'week', 'day', 'agenda']}
        popup
        showMultiDayTimes
        step={30}
        timeslots={2}
        tooltipAccessor={(event) =>
          `${event.title} - ${event.status.toUpperCase()}\n${format(event.start, 'h:mm a')} - ${format(event.end, 'h:mm a')}`
        }
      />
    </div>
  );
};
