import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { format, parse, differenceInMinutes } from 'date-fns';
import { useStore } from '../lib/store';
import { ScheduleEvent } from '../lib/types';
import { Clock, MapPin, MoreVertical, Check } from 'lucide-react';

const TIMELINE_START_HOUR = 7;
const TIMELINE_END_HOUR = 22;
const MINUTE_HEIGHT = 3; // pixels per minute

interface TimelineProps {
  onEventClick: (event: ScheduleEvent) => void;
  selectedDate: Date;
}

const getPixelsFromMidnight = (timeStr: string) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return (hours * 60 + minutes) * MINUTE_HEIGHT;
};

const ScheduleBlock = ({ event, onClick, topMargin }: { event: ScheduleEvent, onClick: (e: ScheduleEvent) => void, topMargin: number }) => {
  const { updateEvent } = useStore();
  const duration = differenceInMinutes(
    parse(event.endTime, 'HH:mm', new Date()),
    parse(event.startTime, 'HH:mm', new Date())
  );
  const height = Math.max(duration * MINUTE_HEIGHT, 40); // Ensure minimum pill height

  const handleToggleDone = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateEvent(event.id, { isDone: !event.isDone });
  };

  return (
    <motion.div
      onClick={() => onClick(event)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      style={{ height: `${height}px`, marginTop: `${topMargin}px` }}
      className={`timeline-block-wrapper ${event.isDone ? 'event-done' : ''}`}
    >
      {/* Left: Start Time */}
      <div className="timeline-time-left">
        {format(parse(event.startTime, 'HH:mm', new Date()), 'hh:mm a')}
      </div>
      
      {/* Middle: Pill */}
      <div className="timeline-pill-container">
        <div 
          className="timeline-pill"
          style={{ backgroundColor: event.color }}
        >
          <Clock size={16} color="#ffffff" strokeWidth={2.5} />
        </div>
      </div>

      {/* Right: Details */}
      <div className="timeline-content-right">
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>
            {format(parse(event.startTime, 'HH:mm', new Date()), 'hh:mm a')} - {format(parse(event.endTime, 'HH:mm', new Date()), 'hh:mm a')} ({duration}m)
          </div>
          <h3 style={{ 
            fontSize: '1.125rem', 
            fontWeight: 600, 
            color: 'var(--text-primary)', 
            margin: 0,
            textDecoration: event.isDone ? 'line-through' : 'none',
            opacity: event.isDone ? 0.6 : 1
          }}>
            {event.title}
          </h3>
          {event.location && (
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
              <MapPin size={12} />
              {event.location}
            </div>
          )}
        </div>
        
        {/* Toggle Circle */}
        <div 
          onClick={handleToggleDone}
          style={{ 
            width: '24px', 
            height: '24px', 
            borderRadius: '50%', 
            border: event.isDone ? 'none' : `2px solid ${event.color}`,
            backgroundColor: event.isDone ? event.color : 'transparent',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          {event.isDone && <Check size={14} color="#fff" strokeWidth={3} />}
        </div>
      </div>
    </motion.div>
  );
};

export const Timeline = ({ onEventClick, selectedDate }: TimelineProps) => {
  const { events } = useStore();

  const selectedDayName = format(selectedDate, 'EEEE');
  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  
  const selectedEvents = events.filter(e => 
    e.dayOfWeek === selectedDayName || e.date === selectedDateStr
  );

  const sortedEvents = [...selectedEvents].sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div className="timeline-container">
      <div className="events-container" style={{ position: 'relative', display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
        <div className="timeline-line" />
        
        {sortedEvents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-tertiary)', zIndex: 1 }}>
            No events scheduled for this day.
          </div>
        ) : (
          (() => {
            const elements = [];
            sortedEvents.forEach((event, index) => {
              let topMargin = 16;
              if (index > 0) {
                const prevEvent = sortedEvents[index - 1];
                const gapMinutes = differenceInMinutes(
                  parse(event.startTime, 'HH:mm', new Date()),
                  parse(prevEvent.endTime, 'HH:mm', new Date())
                );
                if (gapMinutes > 0) {
                  elements.push(
                    <div key={`gap-${index}`} style={{ display: 'flex', alignItems: 'center', padding: '0.75rem 0', marginLeft: '96px', position: 'relative', zIndex: 1 }}>
                      <div style={{ padding: '0.25rem 0.75rem', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '999px', fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 500, border: '1px solid rgba(255,255,255,0.05)' }}>
                        Free ({gapMinutes}m)
                      </div>
                    </div>
                  );
                  topMargin = 0; // Reset margin since the Free block provides spacing
                } else {
                  topMargin = 16; // Minimum gap for overlapping events
                }
              } else {
                topMargin = 0; // First element has no top margin
              }

              elements.push(
                <ScheduleBlock 
                  key={event.id} 
                  event={event} 
                  onClick={onEventClick} 
                  topMargin={topMargin}
                />
              );
            });
            return elements;
          })()
        )}
      </div>
    </div>
  );
};

