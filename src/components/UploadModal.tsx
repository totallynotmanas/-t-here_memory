import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../lib/store';
import { extractTextItems, generateSchedule } from '../lib/pdfParser';
import { X, UploadCloud, AlertCircle } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';

export const UploadModal = ({ onClose }: { onClose: () => void }) => {
  const { setEvents } = useStore();
  const [courseCodes, setCourseCodes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pdfRendered, setPdfRendered] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!selectedFile || !canvasRef.current) return;

    const renderPdf = async () => {
      try {
        const arrayBuffer = await selectedFile.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const page = await pdf.getPage(1);
        
        // Scale for better readability
        const viewport = page.getViewport({ scale: 1.5 });
        
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const context = canvas.getContext('2d');
        if (!context) return;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext: any = {
          canvasContext: context,
          viewport: viewport,
          canvas: canvas
        };
        await page.render(renderContext).promise;
        setPdfRendered(true);
      } catch (err) {
        console.error("Failed to render PDF preview", err);
        setError("Failed to render PDF preview, but you can still try parsing it.");
      }
    };
    
    renderPdf();
  }, [selectedFile]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError('');
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;
    
    if (!courseCodes.trim()) {
      setError('Please enter at least one course code before uploading.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const codesList = courseCodes.split(',').map(c => c.trim()).filter(Boolean);
      const items = await extractTextItems(selectedFile);
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
      <div className="modal-content" style={{ maxWidth: '64rem' }}>
        <div className="modal-header">
          <h2 className="app-title" style={{ fontSize: '1.125rem' }}>Import Timetable</h2>
          <button onClick={onClose} className="icon-btn">
            <X size={20} />
          </button>
        </div>
        
        <div className="modal-body" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
          {error && (
            <div className="error-banner">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {!selectedFile ? (
            <div className="upload-dropzone">
              <input 
                type="file" 
                accept=".pdf" 
                onChange={handleFileSelect}
                className="upload-input"
              />
              <UploadCloud size={32} className="upload-icon" />
              <div>
                <p className="upload-text">Select your Timetable PDF</p>
                <p className="upload-subtext">Click or drag the file here</p>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ 
                border: '1px solid rgba(255,255,255,0.1)', 
                borderRadius: 'var(--radius-md)', 
                overflow: 'hidden',
                backgroundColor: '#fff' // PDF needs white background usually
              }}>
                <div style={{ 
                  maxHeight: '400px', 
                  overflow: 'auto', 
                  display: 'flex', 
                  justifyContent: 'center',
                  padding: '1rem',
                  backgroundColor: '#f1f5f9'
                }}>
                  <canvas ref={canvasRef} style={{ maxWidth: '100%', height: 'auto', display: pdfRendered ? 'block' : 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  {!pdfRendered && <div style={{ padding: '2rem', color: '#64748b' }}>Loading preview...</div>}
                </div>
              </div>

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
                  Read from your timetable above and list the codes you want to extract.
                </p>
              </div>

              <div className="modal-actions">
                <button onClick={() => { setSelectedFile(null); setPdfRendered(false); }} className="btn-danger-outline" disabled={loading}>
                  Back
                </button>
                <button onClick={handleImport} className="btn-primary" disabled={loading}>
                  {loading ? 'Parsing PDF...' : 'Parse & Import'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
