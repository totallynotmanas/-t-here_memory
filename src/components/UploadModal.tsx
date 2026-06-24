import React, { useState } from 'react';
import { useStore } from '../lib/store';
import { extractTextItems, generateSchedule } from '../lib/pdfParser';
import { X, UploadCloud, AlertCircle } from 'lucide-react';

export const UploadModal = ({ onClose }: { onClose: () => void }) => {
  const { setEvents } = useStore();
  const [courseCodes, setCourseCodes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!courseCodes.trim()) {
      setError('Please enter at least one course code before uploading.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const codesList = courseCodes.split(',').map(c => c.trim()).filter(Boolean);
      const items = await extractTextItems(file);
      const newEvents = generateSchedule(items, codesList);
      
      if (newEvents.length === 0) {
        setError('No matching courses found in the PDF. Please check your course codes.');
      } else {
        setEvents(newEvents); // This replaces existing events for simplicity right now
        onClose();
      }
    } catch (err) {
      console.error(err);
      setError('Failed to parse PDF. Ensure it is a valid text-based PDF.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="app-title" style={{ fontSize: '1.125rem' }}>Import Timetable</h2>
          <button onClick={onClose} className="icon-btn">
            <X size={20} />
          </button>
        </div>
        
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">
              Your Course Codes (comma separated)
            </label>
            <input 
              type="text" 
              placeholder="e.g. 23CSE356, 23CSE455"
              value={courseCodes}
              onChange={e => setCourseCodes(e.target.value)}
              className="form-input"
            />
            <p className="form-hint">
              Only these electives/courses will be extracted and added to your schedule.
            </p>
          </div>

          {error && (
            <div className="error-banner">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div className={`upload-dropzone ${loading ? 'loading' : ''}`}>
            <input 
              type="file" 
              accept=".pdf" 
              onChange={handleFileUpload}
              className="upload-input"
              disabled={loading}
            />
            <UploadCloud size={32} className="upload-icon" />
            <div>
              <p className="upload-text">{loading ? 'Parsing PDF...' : 'Click or drag PDF here'}</p>
              <p className="upload-subtext">Extracts your specified course codes automatically</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
