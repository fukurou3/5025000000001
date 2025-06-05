import { useState, useEffect } from 'react';

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
    // TODO: Implement real Google Calendar API integration
    setEvents([]);
  }, [date, enabled]);

  return events;
};
