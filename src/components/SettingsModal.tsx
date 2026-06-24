import React from 'react';
import { X, UploadCloud, Trash2 } from 'lucide-react';
import { useStore } from '../lib/store';

interface SettingsModalProps {
  onClose: () => void;
  onOpenUpload: () => void;
}

export const SettingsModal = ({ onClose, onOpenUpload }: SettingsModalProps) => {
  const { setEvents } = useStore();

  const handleClearSchedule = () => {
    if (window.confirm('Are you sure you want to clear your entire schedule?')) {
      setEvents([]);
      onClose();
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="app-title" style={{ fontSize: '1.125rem' }}>Settings</h2>
          <button onClick={onClose} className="icon-btn">
            <X size={20} />
          </button>
        </div>
        
        <div className="modal-body">
          <div className="form-group">
            <h3 className="form-label" style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>Data Management</h3>
            <p className="form-hint mb-4">Manage your schedule data and imports.</p>
            
            <button 
              onClick={() => {
                onClose();
                onOpenUpload();
              }}
              className="upload-dropzone"
              style={{ padding: '1rem', flexDirection: 'row', gap: '1rem', justifyContent: 'flex-start' }}
            >
              <UploadCloud size={24} className="upload-icon" />
              <div style={{ textAlign: 'left' }}>
                <p className="upload-text">Import PDF Timetable</p>
                <p className="upload-subtext">Upload your university timetable</p>
              </div>
            </button>

            <button 
              onClick={handleClearSchedule}
              className="btn-danger-outline mt-4"
              style={{ width: '100%', justifyContent: 'flex-start', gap: '0.75rem', padding: '1rem' }}
            >
              <Trash2 size={20} />
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontWeight: 500 }}>Clear Schedule</p>
                <p style={{ fontSize: '0.75rem', opacity: 0.8 }}>Delete all events and tasks</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
