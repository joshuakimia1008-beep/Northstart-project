export type TourStop = { id?: string; city: string; date: string; status: 'Completed' | 'Next event' | 'Confirmed' | 'Proposed' | 'Tour finale'; title?: string; venue?: string; description?: string };
export const tourStops: TourStop[] = [
  { city: 'Boston', date: '2026-09-19', status: 'Completed' },
  { city: 'Auburn', date: '2026-10-24', status: 'Next event' },
  { city: 'Marlborough', date: '2026-11-07', status: 'Confirmed' },
  { city: 'Framingham', date: '2026-11-21', status: 'Proposed' },
  { city: 'Watertown', date: '2027-01-09', status: 'Proposed' },
  { city: 'Waltham', date: '2027-01-23', status: 'Proposed' },
  { city: 'Newton', date: '2027-02-06', status: 'Proposed' },
  { city: 'Cambridge', date: '2027-02-20', status: 'Proposed' },
  { city: 'Dorchester', date: '2027-03-06', status: 'Proposed' },
  { city: 'Quincy', date: '2027-03-20', status: 'Proposed' },
  { city: 'Shrewsbury', date: '2027-04-03', status: 'Proposed' },
  { city: 'Natick', date: '2027-04-17', status: 'Tour finale' },
];
export const eventTime = '11:00 AM–1:00 PM';
export const checkInTime = '10:30 AM';
export function calendarFile(stop: TourStop) {
  const date = stop.date.replaceAll('-', '');
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Northstar Group//Blueprint Tour//EN', 'BEGIN:VEVENT', `UID:${date}-${stop.city.toLowerCase()}@northstar-blueprint`, 'DTSTAMP:20261013T101600Z', `DTSTART;TZID=America/New_York:${date}T110000`, `DTEND;TZID=America/New_York:${date}T130000`, `SUMMARY:Financial Freedom Blueprint Tour - ${stop.city}`, `LOCATION:${stop.city} Massachusetts - venue to be announced`, `DESCRIPTION:Check-in begins at 10:30 AM. ${stop.status === 'Proposed' || stop.status === 'Tour finale' ? 'Date subject to confirmation.' : ''}`, `STATUS:${stop.status === 'Proposed' || stop.status === 'Tour finale' ? 'TENTATIVE' : 'CONFIRMED'}`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
}