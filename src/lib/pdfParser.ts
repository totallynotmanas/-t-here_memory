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
    const text = item.text.trim();
    if (DAYS.includes(text as DayOfWeek)) {
      dayCoords.push({ day: text as DayOfWeek, y: item.y });
    }
  }
  
  // 2. Find Timeslot X-coordinates
  // We look for time patterns like "8.00", "09.40", "11.35" to find column headers
  const slotXValues: number[] = [];
  const timeRegex = /\d{1,2}[\.:]\d{2}\s*(am|pm)?/i;
  for (const item of items) {
    if (timeRegex.test(item.text)) {
      slotXValues.push(item.x);
    }
  }

  // Cluster X values that are close to each other
  slotXValues.sort((a, b) => a - b);
  const clusteredX: number[] = [];
  for (const x of slotXValues) {
    if (clusteredX.length === 0 || x - clusteredX[clusteredX.length - 1] > 20) {
      clusteredX.push(x);
    }
  }

  // Map clustered X coordinates to our predefined TIME_SLOTS
  // Usually there are ~11-12 slots. We map them by index.
  const slotsMap = new Map<number, typeof TIME_SLOTS[0]>();
  clusteredX.forEach((x, index) => {
    if (index < TIME_SLOTS.length) {
      slotsMap.set(x, TIME_SLOTS[index]);
    }
  });

  const findElectiveMapping = (codeUpper: string): string | null => {
    const electiveRegex = /(PE|OE)-([IXV]+|\d+)/i;
    const codeMatches = items.filter(i => i.text.toUpperCase().includes(codeUpper));
    
    for (const match of codeMatches) {
      const sameLineItems = items.filter(i => Math.abs(i.y - match.y) < 5);
      for (const item of sameLineItems) {
        const regexMatch = item.text.match(electiveRegex);
        if (regexMatch) {
          return regexMatch[0].toUpperCase();
        }
      }
    }
    return null;
  };

  let eventIdCounter = 1;
  const colors = ['#d97736', '#a855f7', '#ec4899', '#f59e0b', '#10b981']; // matching our new palette

  for (const code of courseCodes) {
    const codeUpper = code.toUpperCase();
    const color = colors[eventIdCounter % colors.length];
    
    // Check if this course maps to an elective alias like PE-IV
    const electiveAlias = findElectiveMapping(codeUpper);
    
    // Find all items matching this code OR its elective alias
    const matchingItems = items.filter(i => {
      const textUpper = i.text.toUpperCase();
      if (textUpper.includes(codeUpper)) return true;
      if (electiveAlias && textUpper.includes(electiveAlias)) return true;
      return false;
    });
    
    for (const match of matchingItems) {
      // Find closest Day (minimum Y distance)
      let bestDay: DayOfWeek | null = null;
      let minDistanceY = Infinity;
      
      for (const day of dayCoords) {
        const dist = Math.abs(day.y - match.y);
        if (dist < minDistanceY) {
          minDistanceY = dist;
          bestDay = day.day;
        }
      }

      // If the match is too far vertically from the main calendar days, 
      // it's likely a sub-table reference. Ignore it.
      if (minDistanceY > 150) {
        continue;
      }

      // Find closest Slot (minimum X distance)
      let bestSlot = null;
      let minDistanceX = Infinity;
      
      for (const [x, slot] of Array.from(slotsMap.entries())) {
        const dist = Math.abs(x - match.x);
        // We only match if it's reasonably close to the column (e.g. within 150 points)
        if (dist < minDistanceX && dist < 150) { 
          minDistanceX = dist;
          bestSlot = slot;
        }
      }

      if (bestDay && bestSlot) {
        events.push({
          id: `imported-${eventIdCounter++}`,
          title: codeUpper,
          startTime: bestSlot.start,
          endTime: bestSlot.end,
          color: color,
          dayOfWeek: bestDay,
          isClass: true,
          courseCode: codeUpper,
        });
      }
    }
  }

  return events;
};
