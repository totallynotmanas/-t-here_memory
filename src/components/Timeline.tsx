import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { format, parse, differenceInMinutes } from 'date-fns';
import { useStore } from '../lib/store';
import { ScheduleEvent } from '../lib/types';
import { Clock, MapPin, MoreVertical } from 'lucide-react';

const TIMELINE_START_HOUR = 8;
const TIMELINE_END_HOUR = 20;
const MINUTE_HEIGHT = 1.5; // pixels per minute

interface TimelineProps {
  onEventClick: (event: ScheduleEvent) => void;
  selectedDate: Date;
}

const getPixelsFromMidnight = (timeStr: string) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return (hours * 60 + minutes) * MINUTE_HEIGHT;
};

const ScheduleBlock = ({ event, onClick }: { event: ScheduleEvent, onClick: (e: ScheduleEvent) => void }) => {
  const top = getPixelsFromMidnight(event.startTime) - (TIMELINE_START_HOUR * 60 * MINUTE_HEIGHT);
  const duration = differenceInMinutes(
    parse(event.endTime, 'HH:mm', new Date()),
    parse(event.startTime, 'HH:mm', new Date())
  );
  const height = duration * MINUTE_HEIGHT;

  return (
    <motion.div
      onClick={() => onClick(event)}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      style={{ top: `${top}px`, height: `${height}px` }}
      className="schedule-block"
    >
      <div 
        className="schedule-block-color-bar" 
        style={{ backgroundColor: event.color }} 
      />
      <div className="schedule-block-content">
        <div className="schedule-block-header">
          <h3 className="schedule-block-title">{event.title}</h3>
          <button className="schedule-block-more">
            <MoreVertical size={16} />
          </button>
        </div>
        
        <div className="schedule-block-details">
          <span className="schedule-block-detail-item">
            <Clock size={12} />
            {event.startTime} - {event.endTime}
          </span>
          {event.location && (
            <span className="schedule-block-detail-item">
              <MapPin size={12} />
              {event.location}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export const Timeline = ({ onEventClick, selectedDate }: TimelineProps) => {
  const { events } = useStore();
  const [currentTimePixels, setCurrentTimePixels] = useState(0);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const pixels = ((now.getHours() * 60) + now.getMinutes()) * MINUTE_HEIGHT;
      setCurrentTimePixels(pixels - (TIMELINE_START_HOUR * 60 * MINUTE_HEIGHT));
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const selectedDayName = format(selectedDate, 'EEEE');
  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  const isToday = format(new Date(), 'yyyy-MM-dd') === selectedDateStr;
  
  const selectedEvents = events.filter(e => 
    e.dayOfWeek === selectedDayName || e.date === selectedDateStr
  );

  const hours = Array.from({ length: TIMELINE_END_HOUR - TIMELINE_START_HOUR + 1 }, (_, i) => i + TIMELINE_START_HOUR);

  return (
    <div className="timeline-container">
      <div className="timeline-line" />
      
      {hours.map(hour => (
        <div key={hour} className="time-row" style={{ height: `${60 * MINUTE_HEIGHT}px` }}>
          <span className="time-label">
            {format(new Date().setHours(hour, 0, 0, 0), 'h aa')}
          </span>
          <div className="time-divider" />
        </div>
      ))}

      {/* Current Time Indicator */}
      {isToday && currentTimePixels > 0 && currentTimePixels < (TIMELINE_END_HOUR - TIMELINE_START_HOUR) * 60 * MINUTE_HEIGHT && (
        <div className="current-time-indicator" style={{ top: `${currentTimePixels}px` }}>
          <div className="current-time-dot" />
          <div className="current-time-line" />
        </div>
      )}

      {/* Events */}
      <div className="events-layer">
        <div className="events-container">
          {selectedEvents.map(event => (
            <ScheduleBlock key={event.id} event={event} onClick={onEventClick} />
          ))}
        </div>
      </div>
    </div>
  );
};

