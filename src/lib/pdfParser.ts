import * as pdfjsLib from 'pdfjs-dist';
// @ts-ignore
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import { ScheduleEvent, DayOfWeek } from './types';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export interface ExtractedItem {
  text: string;
  x: number;
  y: number;
}

export const extractTextItems = async (file: File): Promise<ExtractedItem[]> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const items: ExtractedItem[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    
    for (const item of textContent.items) {
      if ('str' in item && item.str.trim() !== '') {
        // item.transform is [scaleX, skewY, skewX, scaleY, translateX, translateY]
        const x = item.transform[4];
        const y = item.transform[5]; // Note: in PDF, y=0 is at the bottom.
        items.push({ text: item.str.trim(), x, y });
      }
    }
  }

  return items;
};

// Hardcoded standard timeslots based on the provided timetable structure
const TIME_SLOTS = [
  { id: 1, start: '08:00', end: '08:50', label: 'Slot 1' },
  { id: 2, start: '08:50', end: '09:40', label: 'Slot 2' },
  { id: 3, start: '09:40', end: '10:30', label: 'Slot 3' },
  { id: 4, start: '10:45', end: '11:35', label: 'Slot 4' },
  { id: 5, start: '11:35', end: '12:25', label: 'Slot 5' },
  { id: 6, start: '12:25', end: '13:15', label: 'Slot 6' },
  { id: 7, start: '14:05', end: '14:55', label: 'Slot 7' },
  { id: 8, start: '14:55', end: '15:45', label: 'Slot 8' },
  { id: 9, start: '15:45', end: '16:35', label: 'Slot 9' },
  { id: 10, start: '16:35', end: '17:25', label: 'Slot 10' },
  { id: 11, start: '17:25', end: '18:15', label: 'Slot 11' },
];

const DAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const generateSchedule = (items: ExtractedItem[], courseCodes: string[]): ScheduleEvent[] => {
  const events: ScheduleEvent[] = [];
  
  // 1. Find Day Y-coordinates
  const dayCoords: { day: DayOfWeek; y: number }[] = [];
  for (const item of items) {
    if (DAYS.includes(item.text as DayOfWeek)) {
      dayCoords.push({ day: item.text as DayOfWeek, y: item.y });
    }
  }
  
  // Sort days from top to bottom (highest Y to lowest Y in PDF)
  dayCoords.sort((a, b) => b.y - a.y);

  // 2. Find Timeslot X-coordinates
  // We'll look for "Slot 1", "Slot 2", etc., or "8.00 am" to anchor X positions
  const slotCoords: { slotId: number; x: number }[] = [];
  for (const item of items) {
    const slotMatch = item.text.match(/Slot\s*(\d+)/i);
    if (slotMatch) {
      const id = parseInt(slotMatch[1], 10);
      slotCoords.push({ slotId: id, x: item.x });
    }
  }
  
  // Sort slots from left to right
  slotCoords.sort((a, b) => a.x - b.x);
  
  // Deduplicate slots (sometimes they appear multiple times)
  const uniqueSlots = new Map<number, number>();
  for (const sc of slotCoords) {
    if (!uniqueSlots.has(sc.slotId)) {
      uniqueSlots.set(sc.slotId, sc.x);
    }
  }

  // 3. Find target courses
  let eventIdCounter = 1;
  const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

  for (const code of courseCodes) {
    const codeUpper = code.toUpperCase();
    const color = colors[eventIdCounter % colors.length];
    
    // Find all items matching this code
    const matchingItems = items.filter(i => i.text.toUpperCase().includes(codeUpper));
    
    for (const match of matchingItems) {
      // Find which day it belongs to
      // It belongs to the day whose Y is closest above it (meaning day.y >= match.y in normal coords, 
      // but in PDF Y=0 is bottom, so Day is visually above, meaning Day Y > Match Y. 
      // We'll find the Day with minimum positive distance (day.y - match.y).
      let bestDay: DayOfWeek | null = null;
      let minDistanceY = Infinity;
      
      for (const day of dayCoords) {
        // PDF Y goes up. A day label is usually at roughly the same Y as the row contents,
        // or slightly above/below. We'll just find the closest absolute distance.
        const dist = Math.abs(day.y - match.y);
        if (dist < minDistanceY && dist < 100) { // arbitrary threshold to prevent matching across pages
          minDistanceY = dist;
          bestDay = day.day;
        }
      }

      // Find which slot it belongs to
      let bestSlotId: number | null = null;
      let minDistanceX = Infinity;
      
      for (const [slotId, slotX] of Array.from(uniqueSlots.entries())) {
        const dist = Math.abs(slotX - match.x);
        if (dist < minDistanceX && dist < 150) { // threshold
          minDistanceX = dist;
          bestSlotId = slotId;
        }
      }

      if (bestDay && bestSlotId) {
        const slot = TIME_SLOTS.find(s => s.id === bestSlotId);
        if (slot) {
          events.push({
            id: `imported-${eventIdCounter++}`,
            title: codeUpper,
            startTime: slot.start,
            endTime: slot.end,
            color: color,
            dayOfWeek: bestDay,
            isElective: true,
            courseCode: codeUpper,
          });
        }
      }
    }
  }

  return events;
};
