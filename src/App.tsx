import React, { useState, useEffect } from 'react';
import { StoreProvider } from './lib/store';
import { Timeline } from './components/Timeline';
import { UploadModal } from './components/UploadModal';
import { EventEditor } from './components/EventEditor';
import { MajorEvents } from './components/MajorEvents';
import { SettingsModal } from './components/SettingsModal';
import { CalendarPanel } from './components/CalendarPanel';
import { ScheduleEvent } from './lib/types';
import { Settings, Plus } from 'lucide-react';
import { format } from 'date-fns';

function AppContent() {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showEditorModal, setShowEditorModal] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<ScheduleEvent | undefined>();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);

  const handleEditEvent = (event: ScheduleEvent) => {
    setEventToEdit(event);
    setShowEditorModal(true);
  };

  const handleCloseModal = () => {
    setEventToEdit(undefined);
    setShowEditorModal(false);
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div>
          <h1 className="app-title" style={{ fontSize: '1.25rem', fontWeight: 600 }}>
            {format(selectedDate, 'EEEE, MMMM do')}
          </h1>
          <div style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem', fontWeight: 400, marginTop: '0.25rem' }}>
            {format(currentTime, 'hh:mm a')}
          </div>
        </div>
        <div className="header-actions">
          <button 
            className="icon-btn"
            onClick={() => {
              setEventToEdit(undefined);
              setShowEditorModal(true);
            }}
            aria-label="Add new event"
          >
            <Plus size={20} />
          </button>
          <button 
            onClick={() => setShowSettingsModal(true)}
            className="icon-btn"
            aria-label="Settings"
          >
            <Settings size={20} />
          </button>
        </div>
      </header>

      {/* Main Bento Grid */}
      <main className="bento-container">
        <div className="bento-box bento-timeline-area">
          <Timeline onEventClick={handleEditEvent} selectedDate={selectedDate} />
        </div>
        
        <CalendarPanel 
          selectedDate={selectedDate} 
          onSelectDate={setSelectedDate} 
        />
        
        <MajorEvents onEventClick={handleEditEvent} />
      </main>

      {/* Modals */}
      {showUploadModal && <UploadModal onClose={() => setShowUploadModal(false)} />}
      {showSettingsModal && (
        <SettingsModal 
          onClose={() => setShowSettingsModal(false)} 
          onOpenUpload={() => setShowUploadModal(true)} 
        />
      )}
      {showEditorModal && (
        <EventEditor 
          eventToEdit={eventToEdit} 
          onClearSelection={handleCloseModal} 
        />
      )}
    </div>
  );
}

function App() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
}

export default App;



