import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { format, isSameDay, parse, differenceInMinutes, startOfDay } from 'date-fns';
import { useStore } from '../lib/store';
import { ScheduleEvent } from '../lib/types';
import { Clock, MapPin, MoreVertical } from 'lucide-react';

const TIMELINE_START_HOUR = 8; // 8 AM
const TIMELINE_END_HOUR = 19; // 7 PM
const MINUTE_HEIGHT = 2; // 2px per minute

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

export const Timeline = ({ onEventClick }: { onEventClick: (e: ScheduleEvent) => void }) => {
  const { events } = useStore();
  const [currentTimePixels, setCurrentTimePixels] = useState(0);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const pixels = (now.getHours() * 60 + now.getMinutes()) * MINUTE_HEIGHT - (TIMELINE_START_HOUR * 60 * MINUTE_HEIGHT);
      setCurrentTimePixels(pixels);
    };
    
    updateTime();
    const interval = setInterval(updateTime, 60000); // every minute
    return () => clearInterval(interval);
  }, []);

  // Filter events for today
  const today = new Date();
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayName = days[today.getDay()];

  const todaysEvents = events.filter(e => {
    if (e.date) return isSameDay(parse(e.date, 'yyyy-MM-dd', new Date()), today);
    if (e.dayOfWeek) return e.dayOfWeek === todayName;
    return false;
  });

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
      {currentTimePixels > 0 && currentTimePixels < (TIMELINE_END_HOUR - TIMELINE_START_HOUR) * 60 * MINUTE_HEIGHT && (
        <div className="current-time-indicator" style={{ top: `${currentTimePixels}px` }}>
          <div className="current-time-dot" />
          <div className="current-time-line" />
        </div>
      )}

      {/* Events */}
      <div className="events-layer">
        <div className="events-container">
          {todaysEvents.map(event => (
            <ScheduleBlock key={event.id} event={event} onClick={onEventClick} />
          ))}
        </div>
      </div>
    </div>
  );
};

