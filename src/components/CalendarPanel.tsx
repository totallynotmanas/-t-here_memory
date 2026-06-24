import React from 'react';
import { useStore } from '../lib/store';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarPanelProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

export const CalendarPanel = ({ selectedDate, onSelectDate }: CalendarPanelProps) => {
  const { events } = useStore();
  const [currentMonth, setCurrentMonth] = React.useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const dateFormat = "MMMM yyyy";
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  // Determine if a day has any major events
  const hasMajorEvent = (day: Date) => {
    const dayName = format(day, 'EEEE');
    const dayStr = format(day, 'yyyy-MM-dd');
    return events.some(e => !e.isClass && (e.dayOfWeek === dayName || e.date === dayStr));
  };

  return (
    <div className="bento-box bento-calendar-area" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 className="app-title" style={{ fontSize: '1.125rem' }}>
          {format(currentMonth, dateFormat)}
        </h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={prevMonth} className="icon-btn" style={{ padding: '0.25rem' }}>
            <ChevronLeft size={20} />
          </button>
          <button onClick={nextMonth} className="icon-btn" style={{ padding: '0.25rem' }}>
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.25rem', textAlign: 'center', marginBottom: '0.5rem' }}>
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <div key={i} style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-tertiary)' }}>
            {d}
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.25rem', flex: 1 }}>
        {days.map((day, idx) => {
          const isSelected = isSameDay(day, selectedDate);
          const isCurrentMonth = isSameMonth(day, monthStart);
          const isToday = isSameDay(day, new Date());
          const hasEvent = hasMajorEvent(day);

          return (
            <div
              key={idx}
              onClick={() => onSelectDate(day)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.5rem',
                cursor: 'pointer',
                borderRadius: 'var(--radius-md)',
                color: !isCurrentMonth ? 'var(--text-tertiary)' : isSelected ? '#fff' : 'var(--text-primary)',
                backgroundColor: isSelected ? 'var(--primary-color)' : isToday ? 'rgba(255,255,255,0.05)' : 'transparent',
                border: isToday && !isSelected ? '1px solid rgba(255,255,255,0.2)' : '1px solid transparent',
                transition: 'all 0.2s',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                if (!isSelected) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
              }}
              onMouseLeave={(e) => {
                if (!isSelected) e.currentTarget.style.backgroundColor = isToday ? 'rgba(255,255,255,0.05)' : 'transparent';
              }}
            >
              <span style={{ fontSize: '0.875rem', fontWeight: isSelected || isToday ? 600 : 400 }}>
                {format(day, 'd')}
              </span>
              
              {/* Dot Indicator */}
              {hasEvent && (
                <div 
                  style={{
                    position: 'absolute',
                    bottom: '4px',
                    width: '4px',
                    height: '4px',
                    borderRadius: '50%',
                    backgroundColor: isSelected ? '#fff' : 'var(--accent-color)'
                  }} 
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
