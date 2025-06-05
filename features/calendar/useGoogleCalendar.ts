import { useState, useEffect } from 'react';
import dayjs from 'dayjs';

export type GoogleEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
};

export const useGoogleCalendarEvents = (date: string, enabled: boolean) => {
  const [events, setEvents] = useState<GoogleEvent[]>([]);

  useEffect(() => {
    if (!enabled) { setEvents([]); return; }
    const url = process.env.EXPO_PUBLIC_GOOGLE_CALENDAR_ICS_URL;
    if (!url) { setEvents([]); return; }
    const fetchEvents = async () => {
      try {
        const res = await fetch(url);
        const text = await res.text();
        const parsed = parseICal(text);
        const filtered = parsed.filter(ev => dayjs(ev.start).format('YYYY-MM-DD') === date);
        setEvents(filtered);
      } catch {
        setEvents([]);
      }
    };
    fetchEvents();
  }, [date, enabled]);

  return events;
};

const parseICal = (ics: string): GoogleEvent[] => {
  const events: GoogleEvent[] = [];
  const lines = ics.split(/\r?\n/);
  let current: Partial<GoogleEvent> | null = null;
  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') {
      current = {};
    } else if (line === 'END:VEVENT') {
      if (current && current.id && current.start && current.end && current.title) {
        events.push(current as GoogleEvent);
      }
      current = null;
    } else if (current) {
      if (line.startsWith('UID')) {
        current.id = line.substring(line.indexOf(':') + 1);
      } else if (line.startsWith('SUMMARY')) {
        current.title = line.substring(line.indexOf(':') + 1);
      } else if (line.startsWith('DTSTART')) {
        current.start = icsDateToISO(line.substring(line.indexOf(':') + 1));
      } else if (line.startsWith('DTEND')) {
        current.end = icsDateToISO(line.substring(line.indexOf(':') + 1));
      }
    }
  }
  return events;
};

const icsDateToISO = (str: string): string => {
  if (str.length === 8) {
    return dayjs(str, 'YYYYMMDD').toISOString();
  }
  return dayjs(str.replace(/Z$/, ''), 'YYYYMMDDTHHmmss').toISOString();
};
