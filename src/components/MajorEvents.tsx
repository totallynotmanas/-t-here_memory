import React from 'react';
import { useStore } from '../lib/store';
import { ScheduleEvent } from '../lib/types';
import { MapPin, Clock, CalendarDays } from 'lucide-react';
import { format } from 'date-fns';

interface MajorEventsProps {
  onEventClick: (event: ScheduleEvent) => void;
}

export const MajorEvents = ({ onEventClick }: MajorEventsProps) => {
  const { events } = useStore();

  // Filter out classes, keeping only manual major events
  const majorEvents = events.filter(e => !e.isClass);

  // Sort by time (simple sort by start time for now)
  majorEvents.sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div className="bento-box bento-major-events-area" style={{ padding: '1.5rem', overflowY: 'auto' }}>
      <div style={{ paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '1rem' }}>
        <h2 className="app-title" style={{ fontSize: '1.125rem', color: 'var(--accent-color)' }}>Major Events</h2>
        <p className="form-hint" style={{ marginTop: '0.25rem' }}>Your custom tasks and reminders</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {majorEvents.length === 0 ? (
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem', textAlign: 'center', padding: '2rem 0' }}>
            No major events added yet.
          </p>
        ) : (
          majorEvents.map(event => (
            <div 
              key={event.id}
              onClick={() => onEventClick(event)}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: 'var(--radius-md)',
                padding: '0.75rem',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                borderLeft: `4px solid ${event.color}`
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'}
            >
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                {event.title}
              </h3>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Clock size={12} />
                  {event.startTime} - {event.endTime}
                </span>
                
                {event.dayOfWeek && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <CalendarDays size={12} />
                    {event.dayOfWeek}s
                  </span>
                )}

                {event.date && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <CalendarDays size={12} />
                    {format(new Date(event.date), 'MMM do')}
                  </span>
                )}
                
                {event.location && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <MapPin size={12} />
                    {event.location}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
