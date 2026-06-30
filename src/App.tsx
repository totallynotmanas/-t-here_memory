import React, { useState } from 'react';
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
          <h1 className="app-title">Schedule</h1>
          <p className="app-date">{format(selectedDate, 'EEEE, MMMM do')}</p>
        </div>
        <div className="header-actions">
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

      <button 
        className="fab-button"
        onClick={() => {
          setEventToEdit(undefined);
          setShowEditorModal(true);
        }}
        aria-label="Add new event"
      >
        <Plus size={24} />
      </button>

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



