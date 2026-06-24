export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

export interface ScheduleEvent {
  id: string;
  title: string;
  startTime: string; // HH:mm (24-hour format)
  endTime: string; // HH:mm
  color: string;
  dayOfWeek?: DayOfWeek; // For recurring schedule
  date?: string; // YYYY-MM-DD for specific tasks
  isClass?: boolean;
  courseCode?: string;
  location?: string;
}

export interface ElectivePreference {
  courseCode: string;
  isActive: boolean;
}
