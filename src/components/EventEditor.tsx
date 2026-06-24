import React, { useState, useEffect } from 'react';
import { useStore } from '../lib/store';
import { ScheduleEvent, DayOfWeek } from '../lib/types';
import { X, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface EventEditorProps {
  eventToEdit?: ScheduleEvent;
  onClearSelection: () => void;
}

const DAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const COLORS = ['#d97736', '#a855f7', '#ec4899', '#f59e0b', '#10b981', '#ef4444'];

export const EventEditor = ({ eventToEdit, onClearSelection }: EventEditorProps) => {
  const { addEvent, updateEvent, deleteEvent } = useStore();
  
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [color, setColor] = useState(COLORS[0]);
  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek>(DAYS[0]);
  const [location, setLocation] = useState('');
  const [isRecurring, setIsRecurring] = useState(true);

  // Sync state when eventToEdit changes
  useEffect(() => {
    if (eventToEdit) {
      setTitle(eventToEdit.title || '');
      setStartTime(eventToEdit.startTime || '09:00');
      setEndTime(eventToEdit.endTime || '10:00');
      setColor(eventToEdit.color || COLORS[0]);
      setDayOfWeek(eventToEdit.dayOfWeek || DAYS[0]);
      setLocation(eventToEdit.location || '');
      setIsRecurring(!eventToEdit.date);
    } else {
      setTitle('');
      setStartTime('09:00');
      setEndTime('10:00');
      setColor(COLORS[0]);
      setDayOfWeek(DAYS[0]);
      setLocation('');
      setIsRecurring(true);
    }
  }, [eventToEdit]);

  const handleSave = () => {
    if (!title.trim()) return;

    const eventData: Partial<ScheduleEvent> = {
      title,
      startTime,
      endTime,
      color,
      location,
      ...(isRecurring 
        ? { dayOfWeek, date: undefined } 
        : { date: format(new Date(), 'yyyy-MM-dd'), dayOfWeek: undefined }),
    };

    if (eventToEdit) {
      updateEvent(eventToEdit.id, eventData);
    } else {
      addEvent({
        id: `manual-${Date.now()}`,
        ...eventData,
      } as ScheduleEvent);
    }
    onClearSelection();
  };

  const handleDelete = () => {
    if (eventToEdit) {
      deleteEvent(eventToEdit.id);
      onClearSelection();
    }
  };

  return (
    <div className="bento-box bento-editor-area" style={{ padding: '1.5rem', overflowY: 'auto' }}>
      <div className="modal-header" style={{ padding: '0 0 1rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)', backgroundColor: 'transparent' }}>
        <h2 className="app-title" style={{ fontSize: '1.125rem' }}>{eventToEdit ? 'Edit Event' : 'Add New Event'}</h2>
        {eventToEdit && (
          <button onClick={onClearSelection} className="icon-btn" aria-label="Cancel edit">
            <X size={20} />
          </button>
        )}
      </div>
      
      <div className="modal-body" style={{ padding: '1.5rem 0 0 0' }}>
        <div className="form-group">
          <label className="form-label">Title</label>
          <input 
            type="text" 
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="form-input"
            placeholder="e.g. Design Meeting"
          />
        </div>

        <div className="row">
          <div className="form-group col">
            <label className="form-label">Start Time</label>
            <input 
              type="time" 
              value={startTime}
              onChange={e => setStartTime(e.target.value)}
              className="form-input"
            />
          </div>
          <div className="form-group col">
            <label className="form-label">End Time</label>
            <input 
              type="time" 
              value={endTime}
              onChange={e => setEndTime(e.target.value)}
              className="form-input"
            />
          </div>
        </div>

        <label className="checkbox-label">
          <input 
            type="checkbox" 
            checked={isRecurring}
            onChange={e => setIsRecurring(e.target.checked)}
            style={{ accentColor: 'var(--primary-color)' }}
          />
          Repeats Weekly
        </label>

        {isRecurring && (
          <div className="form-group">
            <label className="form-label">Day</label>
            <select 
              value={dayOfWeek}
              onChange={e => setDayOfWeek(e.target.value as DayOfWeek)}
              className="form-input"
            >
              {DAYS.map(day => <option key={day} value={day}>{day}</option>)}
            </select>
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Color</label>
          <div className="color-picker">
            {COLORS.map(c => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`color-swatch ${color === c ? 'active' : ''}`}
                style={{ backgroundColor: c }}
                type="button"
              />
            ))}
          </div>
        </div>
        
        <div className="modal-actions" style={{ marginTop: 'auto', paddingTop: '1.5rem' }}>
          {eventToEdit && (
            <button 
              onClick={handleDelete}
              className="btn-danger-outline"
              style={{ width: '48px' }}
            >
              <Trash2 size={20} />
            </button>
          )}
          <button 
            onClick={handleSave}
            className="btn-primary"
          >
            {eventToEdit ? 'Save Changes' : 'Add Event'}
          </button>
        </div>
      </div>
    </div>
  );
};
