import { describe, expect, it } from 'vitest';
import { tourStops, eventTime, checkInTime, calendarFile } from '../lib/tour';

describe('Supplied tour calendar', () => {
  it('has the twelve supplied communities in tour order', () => {
    expect(tourStops.map(stop => stop.city)).toEqual(['Boston','Auburn','Marlborough','Framingham','Watertown','Waltham','Newton','Cambridge','Dorchester','Quincy','Shrewsbury','Natick']);
  });
  it('preserves each supplied date', () => {
    expect(tourStops.map(stop => stop.date)).toEqual(['2026-09-19','2026-10-24','2026-11-07','2026-11-21','2027-01-09','2027-01-23','2027-02-06','2027-02-20','2027-03-06','2027-03-20','2027-04-03','2027-04-17']);
  });
  it('keeps Boston completed and Auburn next', () => {
    expect(tourStops[0]?.status).toBe('Completed');
    expect(tourStops[1]?.status).toBe('Next event');
    expect(tourStops[2]?.status).toBe('Confirmed');
    expect(tourStops.slice(3,11).every(stop => stop.status === 'Proposed')).toBe(true);
  });
  it('retains the standard event and check-in times', () => {
    expect(eventTime).toBe('11:00 AM–1:00 PM');
    expect(checkInTime).toBe('10:30 AM');
  });
  it('exports Eastern time and marks proposed dates tentative', () => {
    const auburn = tourStops.find(stop => stop.city === 'Auburn');
    const framingham = tourStops.find(stop => stop.city === 'Framingham');
    if (!auburn || !framingham) throw new Error('Required tour stops missing');
    expect(calendarFile(auburn)).toContain('DTSTART;TZID=America/New_York:20261024T110000');
    expect(calendarFile(auburn)).toContain('DTEND;TZID=America/New_York:20261024T130000');
    expect(calendarFile(framingham)).toContain('STATUS:TENTATIVE');
  });
});