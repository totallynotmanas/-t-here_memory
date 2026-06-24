import React, { useState } from 'react';
import { StoreProvider } from './lib/store';
import { Timeline } from './components/Timeline';
import { UploadModal } from './components/UploadModal';
import { EventEditor } from './components/EventEditor';
import { MajorEvents } from './components/MajorEvents';
import { SettingsModal } from './components/SettingsModal';
import { ScheduleEvent } from './lib/types';
import { Plus, Settings } from 'lucide-react';
import { format } from 'date-fns';

function AppContent() {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<ScheduleEvent | undefined>();

  const handleEditEvent = (event: ScheduleEvent) => {
    setEventToEdit(event);
  };

  const handleCloseModal = () => {
    setEventToEdit(undefined);
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div>
          <h1 className="app-title">Schedule</h1>
          <p className="app-date">{format(new Date(), 'EEEE, MMMM do')}</p>
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
          <Timeline onEventClick={handleEditEvent} />
        </div>
        
        <MajorEvents onEventClick={handleEditEvent} />
        
        <EventEditor 
          eventToEdit={eventToEdit} 
          onClearSelection={handleCloseModal} 
        />
      </main>

      {/* Modals */}
      {showUploadModal && <UploadModal onClose={() => setShowUploadModal(false)} />}
      {showSettingsModal && (
        <SettingsModal 
          onClose={() => setShowSettingsModal(false)} 
          onOpenUpload={() => setShowUploadModal(true)} 
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



