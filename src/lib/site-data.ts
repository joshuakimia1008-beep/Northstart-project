import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { tourStops, type TourStop } from '@/lib/tour';

export const eventStatuses: TourStop['status'][] = ['Proposed', 'Confirmed', 'Next event', 'Completed', 'Tour finale'];

export type SiteSettings = { logoPath: string | null; videoPath: string | null; logoUrl: string | null; videoUrl: string | null };

async function signed(path: string | null) {
  if (!path) return null;
  const { data } = await supabase.storage.from('media').createSignedUrl(path, 60 * 60 * 24 * 7);
  return data?.signedUrl ?? null;
}

export function useSiteData() {
  const [stops, setStops] = useState<TourStop[]>(tourStops);
  const [settings, setSettings] = useState<SiteSettings>({ logoPath: null, videoPath: null, logoUrl: null, videoUrl: null });
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const [{ data: events }, { data: s }] = await Promise.all([
      supabase.from('events').select('*').order('event_date'),
      supabase.from('site_settings').select('*').eq('id', 1).maybeSingle(),
    ]);
    if (events) setStops(events.map(e => ({ id: e.id, city: e.city, title: e.title, date: e.event_date, status: e.status as TourStop['status'], venue: e.venue, description: e.description })));
    const logoPath = s?.logo_url ?? null;
    const videoPath = s?.footer_video_url ?? null;
    const [logoUrl, videoUrl] = await Promise.all([signed(logoPath), signed(videoPath)]);
    setSettings({ logoPath, videoPath, logoUrl, videoUrl });
    setLoading(false);
  }, []);

  useEffect(() => { void reload(); }, [reload]);
  return { stops, settings, loading, reload };
}
