import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ScheduleEvent, ElectivePreference } from './types';

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
  const [events, setEventsState] = useState<ScheduleEvent[]>(() => {
    const saved = localStorage.getItem('schedule_events');
    return saved ? JSON.parse(saved) : [];
  });

  const [electives, setElectivesState] = useState<ElectivePreference[]>(() => {
    const saved = localStorage.getItem('schedule_electives');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('schedule_events', JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem('schedule_electives', JSON.stringify(electives));
  }, [electives]);

  const addEvent = (event: ScheduleEvent) => {
    setEventsState(prev => [...prev, event]);
  };

  const updateEvent = (id: string, updated: Partial<ScheduleEvent>) => {
    setEventsState(prev => prev.map(e => e.id === id ? { ...e, ...updated } : e));
  };

  const deleteEvent = (id: string) => {
    setEventsState(prev => prev.filter(e => e.id !== id));
  };

  const setEvents = (newEvents: ScheduleEvent[]) => {
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
