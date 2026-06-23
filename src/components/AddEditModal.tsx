import React, { useState, useEffect } from 'react';
import { useStore } from '../lib/store';
import { ScheduleEvent, DayOfWeek } from '../lib/types';
import { X, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface AddEditModalProps {
  onClose: () => void;
  eventToEdit?: ScheduleEvent;
}

const DAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444'];

export const AddEditModal = ({ onClose, eventToEdit }: AddEditModalProps) => {
  const { addEvent, updateEvent, deleteEvent } = useStore();
  
  const [title, setTitle] = useState(eventToEdit?.title || '');
  const [startTime, setStartTime] = useState(eventToEdit?.startTime || '09:00');
  const [endTime, setEndTime] = useState(eventToEdit?.endTime || '10:00');
  const [color, setColor] = useState(eventToEdit?.color || COLORS[0]);
  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek>(eventToEdit?.dayOfWeek || DAYS[0]);
  const [location, setLocation] = useState(eventToEdit?.location || '');
  const [isRecurring, setIsRecurring] = useState(!eventToEdit?.date);

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
    onClose();
  };

  const handleDelete = () => {
    if (eventToEdit) {
      deleteEvent(eventToEdit.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-bg-surface w-full max-w-md rounded-t-2xl sm:rounded-2xl shadow-xl border border-white/10 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-white/5 flex justify-between items-center bg-bg-surface-elevated/50">
          <h2 className="text-lg font-semibold">{eventToEdit ? 'Edit Event' : 'Add Event'}</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 flex flex-col gap-5 overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Title</label>
            <input 
              type="text" 
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-bg-color border border-white/10 rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-primary-color transition-colors"
              placeholder="e.g. Design Meeting"
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-text-secondary mb-1">Start Time</label>
              <input 
                type="time" 
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="w-full bg-bg-color border border-white/10 rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-primary-color transition-colors [color-scheme:dark]"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-text-secondary mb-1">End Time</label>
              <input 
                type="time" 
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                className="w-full bg-bg-color border border-white/10 rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-primary-color transition-colors [color-scheme:dark]"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-text-primary cursor-pointer">
            <input 
              type="checkbox" 
              checked={isRecurring}
              onChange={e => setIsRecurring(e.target.checked)}
              className="rounded bg-bg-color border-white/10 text-primary-color focus:ring-primary-color w-4 h-4"
            />
            Repeats Weekly
          </label>

          {isRecurring && (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Day</label>
              <select 
                value={dayOfWeek}
                onChange={e => setDayOfWeek(e.target.value as DayOfWeek)}
                className="w-full bg-bg-color border border-white/10 rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-primary-color transition-colors"
              >
                {DAYS.map(day => <option key={day} value={day}>{day}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Color</label>
            <div className="flex gap-2">
              {COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full transition-transform ${color === c ? 'scale-110 ring-2 ring-white/50' : 'hover:scale-105'}`}
                  style={{ backgroundColor: c }}
                  type="button"
                />
              ))}
            </div>
          </div>
          
          <div className="flex gap-3 mt-4">
            {eventToEdit && (
              <button 
                onClick={handleDelete}
                className="flex items-center justify-center p-3 rounded-lg border border-danger-color/50 text-danger-color hover:bg-danger-color/10 transition-colors"
              >
                <Trash2 size={20} />
              </button>
            )}
            <button 
              onClick={handleSave}
              className="flex-1 bg-primary-color hover:bg-primary-color-hover text-white font-medium py-3 rounded-lg transition-colors"
            >
              Save Event
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
