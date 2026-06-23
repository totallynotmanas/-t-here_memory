import React, { useState } from 'react';
import { StoreProvider } from './lib/store';
import { Timeline } from './components/Timeline';
import { UploadModal } from './components/UploadModal';
import { Plus, Settings, Upload } from 'lucide-react';
import { format } from 'date-fns';

function AppContent() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  return (
    <div className="min-h-screen bg-bg-color text-text-primary pb-24">
      {/* Header */}
      <header className="sticky top-0 z-20 glass-panel px-4 py-4 flex justify-between items-center border-b-0 border-white/5 shadow-md">
        <div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-color to-accent-color">
            Schedule
          </h1>
          <p className="text-sm text-text-secondary font-medium">
            {format(new Date(), 'EEEE, MMMM do')}
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowUploadModal(true)}
            className="p-2 rounded-full hover:bg-bg-surface-elevated transition-colors text-text-secondary hover:text-text-primary"
            aria-label="Upload Timetable"
          >
            <Upload size={20} />
          </button>
          <button 
            className="p-2 rounded-full hover:bg-bg-surface-elevated transition-colors text-text-secondary hover:text-text-primary"
            aria-label="Settings"
          >
            <Settings size={20} />
          </button>
        </div>
      </header>

      {/* Main Timeline */}
      <main className="max-w-md mx-auto w-full relative">
        <Timeline />
      </main>

      {/* Floating Action Button */}
      <button 
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary-color text-white shadow-glow flex items-center justify-center hover:scale-105 active:scale-95 transition-transform z-30"
        aria-label="Add task"
      >
        <Plus size={24} />
      </button>

      {/* Modals */}
      {showUploadModal && <UploadModal onClose={() => setShowUploadModal(false)} />}
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

