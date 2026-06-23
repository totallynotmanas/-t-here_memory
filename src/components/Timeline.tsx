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

const ScheduleBlock = ({ event }: { event: ScheduleEvent }) => {
  const top = getPixelsFromMidnight(event.startTime) - (TIMELINE_START_HOUR * 60 * MINUTE_HEIGHT);
  const duration = differenceInMinutes(
    parse(event.endTime, 'HH:mm', new Date()),
    parse(event.startTime, 'HH:mm', new Date())
  );
  const height = duration * MINUTE_HEIGHT;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      style={{ top: `${top}px`, height: `${height}px` }}
      className="absolute left-16 right-4 glass-panel rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group cursor-pointer"
    >
      <div 
        className="absolute left-0 top-0 bottom-0 w-1" 
        style={{ backgroundColor: event.color }} 
      />
      <div className="p-3 h-full flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <h3 className="font-semibold text-[15px] truncate pr-2">{event.title}</h3>
          <button className="text-text-tertiary hover:text-text-primary opacity-0 group-hover:opacity-100 transition-opacity">
            <MoreVertical size={16} />
          </button>
        </div>
        
        <div className="flex items-center gap-3 text-xs text-text-secondary mt-1">
          <span className="flex items-center gap-1">
            <Clock size={12} />
            {event.startTime} - {event.endTime}
          </span>
          {event.location && (
            <span className="flex items-center gap-1 truncate">
              <MapPin size={12} />
              {event.location}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export const Timeline = () => {
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
    <div className="timeline-container h-full relative mt-4">
      <div className="timeline-line" />
      
      {hours.map(hour => (
        <div 
          key={hour} 
          className="relative flex items-center mb-8"
          style={{ height: `${60 * MINUTE_HEIGHT}px`, marginBottom: 0 }}
        >
          <span className="text-xs font-medium text-text-tertiary w-12 text-right pr-4 shrink-0 translate-y-[-50%] absolute top-0">
            {format(new Date().setHours(hour, 0, 0, 0), 'h aa')}
          </span>
          <div className="absolute left-12 right-0 top-0 border-t border-white/5" />
        </div>
      ))}

      {/* Current Time Indicator */}
      {currentTimePixels > 0 && currentTimePixels < (TIMELINE_END_HOUR - TIMELINE_START_HOUR) * 60 * MINUTE_HEIGHT && (
        <div 
          className="absolute left-10 right-0 flex items-center z-10 pointer-events-none"
          style={{ top: `${currentTimePixels}px` }}
        >
          <div className="w-2 h-2 rounded-full bg-primary-color shadow-glow" />
          <div className="h-[2px] flex-1 bg-primary-color opacity-50 shadow-glow" />
        </div>
      )}

      {/* Events */}
      <div className="absolute top-0 bottom-0 left-0 right-0 pointer-events-none">
        <div className="relative h-full w-full pointer-events-auto">
          {todaysEvents.map(event => (
            <ScheduleBlock key={event.id} event={event} />
          ))}
        </div>
      </div>
    </div>
  );
};
