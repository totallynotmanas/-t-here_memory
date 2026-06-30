import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ScheduleEvent, ElectivePreference } from './types';
import { supabase } from './supabase';

interface StoreContextType {
  events: ScheduleEvent[];
  electives: ElectivePreference[];
  addEvent: (event: ScheduleEvent) => void;
  updateEvent: (id: string, updated: Partial<ScheduleEvent>) => void;
  deleteEvent: (id: string) => void;
  setEvents: (events: ScheduleEvent[]) => void;
  toggleElective: (courseCode: string) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider = ({ children }: { children: ReactNode }) => {
  const [events, setEventsState] = useState<ScheduleEvent[]>([]);
  const [electives, setElectivesState] = useState<ElectivePreference[]>(() => {
    const saved = localStorage.getItem('schedule_electives');
    return saved ? JSON.parse(saved) : [];
  });

  // Fetch events from Supabase on mount
  useEffect(() => {
    const fetchEvents = async () => {
      const { data, error } = await supabase.from('events').select('*');
      if (error) {
        console.error('Error fetching events:', error);
      } else if (data) {
        setEventsState(data as ScheduleEvent[]);
      }
    };
    fetchEvents();
  }, []);

  useEffect(() => {
    localStorage.setItem('schedule_electives', JSON.stringify(electives));
  }, [electives]);

  const addEvent = async (event: ScheduleEvent) => {
    // Optimistic UI update
    setEventsState(prev => [...prev, event]);
    
    // Database update
    const { error } = await supabase.from('events').insert(event);
    if (error) console.error('Error adding event:', error);
  };

  const updateEvent = async (id: string, updated: Partial<ScheduleEvent>) => {
    // Optimistic UI update
    setEventsState(prev => prev.map(e => e.id === id ? { ...e, ...updated } : e));
    
    // Database update
    const { error } = await supabase.from('events').update(updated).eq('id', id);
    if (error) console.error('Error updating event:', error);
  };

  const deleteEvent = async (id: string) => {
    // Optimistic UI update
    setEventsState(prev => prev.filter(e => e.id !== id));
    
    // Database update
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) console.error('Error deleting event:', error);
  };

  const setEvents = async (newEvents: ScheduleEvent[]) => {
    // Overwrite all events (e.g. from PDF import)
    // Clear existing
    await supabase.from('events').delete().neq('id', 'dummy'); 
    
    // Insert new
    if (newEvents.length > 0) {
      await supabase.from('events').insert(newEvents);
    }
    
    setEventsState(newEvents);
  };

  const toggleElective = (courseCode: string) => {
    setElectivesState(prev => {
      const exists = prev.find(e => e.courseCode === courseCode);
      if (exists) {
        return prev.map(e => e.courseCode === courseCode ? { ...e, isActive: !e.isActive } : e);
      }
      return [...prev, { courseCode, isActive: true }];
    });
  };

  return (
    <StoreContext.Provider value={{
      events, electives, addEvent, updateEvent, deleteEvent, setEvents, toggleElective
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within StoreProvider');
  return context;
};
