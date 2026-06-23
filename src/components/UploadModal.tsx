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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-bg-surface w-full max-w-md rounded-2xl shadow-xl border border-white/10 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-white/5 flex justify-between items-center bg-bg-surface-elevated/50">
          <h2 className="text-lg font-semibold">Import Timetable</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Your Course Codes (comma separated)
            </label>
            <input 
              type="text" 
              placeholder="e.g. 23CSE356, 23CSE455"
              value={courseCodes}
              onChange={e => setCourseCodes(e.target.value)}
              className="w-full bg-bg-color border border-white/10 rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-primary-color transition-colors"
            />
            <p className="text-xs text-text-tertiary mt-2">
              Only these electives/courses will be extracted and added to your schedule.
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-danger-color bg-danger-color/10 p-3 rounded-lg text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div className="relative mt-2">
            <input 
              type="file" 
              accept=".pdf" 
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={loading}
            />
            <div className={`border-2 border-dashed border-white/20 rounded-xl p-8 flex flex-col items-center justify-center text-center gap-3 transition-colors ${loading ? 'opacity-50' : 'hover:border-primary-color hover:bg-primary-color/5'}`}>
              <UploadCloud size={32} className="text-primary-color" />
              <div>
                <p className="font-medium">{loading ? 'Parsing PDF...' : 'Click or drag PDF here'}</p>
                <p className="text-sm text-text-tertiary mt-1">Extracts your specified course codes automatically</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
