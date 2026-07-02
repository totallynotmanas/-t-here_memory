import fs from 'fs';

const file = 'src/lib/pdfParser.ts';
let content = fs.readFileSync(file, 'utf-8');

const generateScheduleStart = content.indexOf('export const generateSchedule');
if (generateScheduleStart === -1) throw new Error("Could not find generateSchedule");

const newFunction = `export const generateSchedule = (items: ExtractedItem[], courseCodes: string[]): ScheduleEvent[] => {
  const events: ScheduleEvent[] = [];
  const DAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // 1. Find Day Y-coordinates (main grid only)
  const dayCoords: { day: DayOfWeek; y: number }[] = [];
  for (const item of items) {
    if (item.page !== 1) continue; // Days are on page 1
    const text = item.text.trim();
    if (DAYS.includes(text as DayOfWeek)) {
      dayCoords.push({ day: text as DayOfWeek, y: item.y });
    }
  }

  // 2. Find Timeslot X-coordinates robustly by parsing header times
  const columnHeaders: { x: number, slot: typeof TIME_SLOTS[0] }[] = [];
  for (const item of items) {
    if (item.page !== 1 || item.y < 800) continue; 
    
    // Look for e.g. "8.50" or "10.45"
    const match = item.text.match(/(\\d{1,2})[\\.:](\\d{2})/);
    if (match) {
      let hours = parseInt(match[1]);
      const mins = match[2];
      // Timetable uses 8,9,10,11,12 for morning, 1,2,3,4,5,6 for afternoon
      if (hours <= 7) hours += 12;
      
      const timeString = \`\${hours.toString().padStart(2, '0')}:\${mins}\`;
      const slot = TIME_SLOTS.find(s => s.start === timeString);
      if (slot) {
        columnHeaders.push({ x: item.x, slot });
      }
    }
  }

  // Remove duplicates and sort
  columnHeaders.sort((a, b) => a.x - b.x);
  const uniqueColumns: typeof columnHeaders = [];
  for (const col of columnHeaders) {
    if (uniqueColumns.length === 0 || col.x - uniqueColumns[uniqueColumns.length - 1].x > 20) {
      uniqueColumns.push(col);
    }
  }

  // 3. Map User Course Codes to Elective Aliases (e.g. 23CSE345 -> PE-IV)
  const userMappings = new Map<string, string>();
  for (const code of courseCodes) {
    const alias = findElectiveMapping(items, code);
    if (alias) {
      userMappings.set(alias.replace(/\\s+/g, '').toUpperCase(), code);
    }
  }

  // 4. Cluster all text items into the grid cells
  const grid = new Map<string, { slot: typeof TIME_SLOTS[0], items: ExtractedItem[] }>();
  
  for (const item of items) {
    if (item.page !== 1) continue;

    let bestDay = null;
    let minDistanceY = 50; 
    for (const d of dayCoords) {
      const dist = Math.abs(d.y - item.y);
      if (dist < minDistanceY) {
        minDistanceY = dist;
        bestDay = d.day;
      }
    }

    let bestCol = null;
    let minDistanceX = 60; 
    for (const col of uniqueColumns) {
      const dist = Math.abs(col.x - item.x);
      if (dist < minDistanceX) {
        minDistanceX = dist;
        bestCol = col;
      }
    }

    if (bestDay && bestCol) {
      // Use the slot's start time as the unique ID for the column to handle duplicates
      const key = \`\${bestDay}-\${bestCol.slot.start}\`;
      if (!grid.has(key)) grid.set(key, { slot: bestCol.slot, items: [] });
      grid.get(key)!.items.push(item);
    }
  }

  // 5. Evaluate each cell and create events
  let eventIdCounter = 1;
  const colors = ['#d97736', '#a855f7', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];

  for (const [key, cell] of grid.entries()) {
    // Sort text vertically (reading order top-to-bottom)
    cell.items.sort((a, b) => b.y - a.y);
    const fullTextFlat = cell.items.map(i => i.text.trim()).join(' ').toUpperCase();
    
    // Ignore pure time strings or break labels
    if (/BREAK/i.test(fullTextFlat) || /AM\\s*-|PM\\s*-|TO/i.test(fullTextFlat)) continue;
    if (DAYS.includes(cell.items[0].text.trim() as DayOfWeek)) continue;
    if (fullTextFlat.trim() === '') continue;

    let title = cell.items[0].text.trim(); // Default to first line
    let includeEvent = true;

    // Check if it's an elective slot
    const electiveMatch = fullTextFlat.match(/(PE|OE)\\s*-\\s*([IXV]+|\\d+)|FREE\\s*ELECTIVE/i);
    
    if (electiveMatch) {
      let foundAliasMatch = false;
      let cellAlias = '';
      
      if (electiveMatch[0].replace(/\\s+/g, '').includes('FREEELECTIVE')) {
        cellAlias = 'FREEELECTIVE';
      } else {
        cellAlias = \`\${(electiveMatch[1]||'').toUpperCase()}-\${(electiveMatch[2]||'').toUpperCase()}\`;
      }

      // Check if user mapped this specific elective
      if (userMappings.has(cellAlias)) {
        foundAliasMatch = true;
        title = userMappings.get(cellAlias)!; 
      } else {
        // Fallback: Check if user directly provided a code that appears in the cell text
        for (const code of courseCodes) {
          if (fullTextFlat.includes(code.toUpperCase())) {
            foundAliasMatch = true;
            title = code;
            break;
          }
        }
      }

      // If user didn't specify a mapping for this elective slot, ignore it
      if (!foundAliasMatch) {
        includeEvent = false;
      }
    }

    if (includeEvent) {
      const day = key.split('-')[0] as DayOfWeek;
      events.push({
        id: \`imported-\${eventIdCounter++}\`,
        title: title,
        dayOfWeek: day,
        startTime: cell.slot.start,
        endTime: cell.slot.end,
        color: colors[eventIdCounter % colors.length],
        isClass: true,
        courseCode: title
      });
    }
  }

  return events;
};
`;

const before = content.substring(0, generateScheduleStart);
// findElectiveMapping must be outside generateSchedule now. 
// It was inside `generateSchedule`, but in the previous step I made a mistake by rewriting generateSchedule's top part and the end part. Wait, findElectiveMapping is still inside `extractTextItems`? No, it was a standalone const or inside `generateSchedule`.
// Let's just redefine findElectiveMapping above generateSchedule.

const fullContent = `import { DayOfWeek, ScheduleEvent } from './types';

export const TIME_SLOTS = [
  { start: '08:00', end: '08:50' },
  { start: '08:50', end: '09:40' },
  { start: '09:40', end: '10:30' },
  { start: '10:45', end: '11:35' },
  { start: '11:35', end: '12:25' },
  { start: '12:25', end: '13:15' },
  { start: '14:05', end: '14:55' },
  { start: '14:55', end: '15:45' },
  { start: '15:45', end: '16:35' },
  { start: '16:35', end: '17:25' },
  { start: '17:25', end: '18:15' },
];

export interface ExtractedItem {
  text: string;
  x: number;
  y: number;
  page: number;
}

export const extractTextItems = async (file: File): Promise<ExtractedItem[]> => {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.mjs',
    import.meta.url
  ).toString();

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  const items: ExtractedItem[] = [];
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    
    for (const item of textContent.items) {
      if ('str' in item && item.str.trim() !== '') {
        const x = item.transform[4];
        const y = item.transform[5];
        items.push({ text: item.str.trim(), x, y, page: i });
      }
    }
  }
  
  return items;
};

export const findElectiveMapping = (items: ExtractedItem[], codeUpper: string): string | null => {
  const sortedItems = [...items].sort((a, b) => {
    if (a.page !== b.page) return a.page - b.page;
    if (Math.abs(b.y - a.y) > 5) {
      return b.y - a.y;
    }
    return a.x - b.x;
  });

  let lastCodeIndex = -1;
  for (let i = 0; i < sortedItems.length; i++) {
    if (sortedItems[i].text.toUpperCase().includes(codeUpper)) {
      lastCodeIndex = i;
    }
  }

  if (lastCodeIndex === -1) return null;

  for (let i = lastCodeIndex - 1; i >= 0; i--) {
    const matchGroup = sortedItems[i].text.match(/(PE|OE)\\s*-\\s*([IXV]+|\\d+)|Professional Elective\\s*([IXV]+)/i);
    if (matchGroup) {
      if (matchGroup[3]) {
        return \`PE-\${matchGroup[3].toUpperCase()}\`;
      } else {
        return \`\${matchGroup[1].toUpperCase()}-\${matchGroup[2].toUpperCase()}\`;
      }
    }
  }
  
  return null;
};

${newFunction}
`;

fs.writeFileSync(file, fullContent, 'utf-8');
