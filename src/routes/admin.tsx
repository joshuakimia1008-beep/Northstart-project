import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState, type FormEvent } from 'react';
import { ArrowLeft, Trash2, Upload, LogOut } from 'lucide-react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useSiteData, eventStatuses } from '@/lib/site-data';
import type { TourStop } from '@/lib/tour';

export const Route = createFileRoute('/admin')({
  ssr: false,
  head: () => ({ meta: [
    { title: 'Admin Dashboard | Financial Freedom Blueprint Tour' },
    { name: 'description', content: 'Manage tour events, the site logo and the footer video.' },
    { property: 'og:title', content: 'Admin Dashboard | Blueprint Tour' },
    { property: 'og:description', content: 'Manage tour events, logo and footer video.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' },
    { name: 'robots', content: 'noindex' },
  ] }),
  component: AdminPage,
});

const input = 'w-full rounded-md border border-input bg-background px-3 py-2 text-sm';

function AdminPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (!session) { setIsAdmin(false); return; }
    supabase.rpc('has_role', { _user_id: session.user.id, _role: 'admin' }).then(({ data }) => setIsAdmin(!!data));
  }, [session]);

  if (!ready) return null;
  return <div className="min-h-screen bg-muted/30">
    <header className="border-b border-border bg-background"><div className="page-width flex items-center justify-between py-4">
      <Link to="/" className="flex items-center gap-2 text-sm"><ArrowLeft size={16} />Back to site</Link>
      <h1 className="font-display text-xl">Admin dashboard</h1>
      {session ? <Button variant="ghost" size="sm" onClick={() => supabase.auth.signOut()}><LogOut />Sign out</Button> : <span />}
    </div></header>
    <main className="page-width py-10">
      {!session ? <SignIn /> : !isAdmin ? <p className="text-muted-foreground">Signed in as {session.user.email}. Your admin request is waiting for approval by an existing admin.</p> : <><Dashboard /><Admins me={session.user.id} /></>}
    </main>
  </div>;
}

function SignIn() {
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  async function submit(e: FormEvent) {
    e.preventDefault(); setMsg('');
    if (mode === 'in') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMsg(error.message === 'Email not confirmed' ? 'Please confirm your email first — open the link we sent to your inbox.' : error.message);
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/admin` } });
      if (error) setMsg(error.message); else if (!data.session) setMsg('Check your email to confirm your account, then sign in.');
    }
  }
  return <form onSubmit={submit} className="mx-auto max-w-sm space-y-4 rounded-lg border border-border bg-background p-6">
    <h2 className="font-display text-2xl">{mode === 'in' ? 'Admin sign in' : 'Create admin account'}</h2>
    <p className="text-xs text-muted-foreground">The first two accounts become admins. Later sign-ups need approval from an admin.</p>
    <input className={input} type="email" required placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
    <input className={input} type="password" required minLength={6} placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
    {msg && <p className="text-sm text-destructive">{msg}</p>}
    <Button variant="tour" className="w-full" type="submit">{mode === 'in' ? 'Sign in' : 'Create account'}</Button>
    <button type="button" className="text-sm text-primary" onClick={() => setMode(mode === 'in' ? 'up' : 'in')}>{mode === 'in' ? 'Need an account? Sign up' : 'Have an account? Sign in'}</button>
  </form>;
}

function Dashboard() {
  const { stops, settings, reload } = useSiteData();
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({ city: '', title: 'Financial Freedom Blueprint Tour', event_date: '', status: 'Proposed', venue: 'Venue to be announced', description: '' });

  async function upload(kind: 'logo' | 'video', file?: File) {
    if (!file) return;
    setMsg('Uploading…');
    const path = `${kind}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    const { error } = await supabase.storage.from('media').upload(path, file, { contentType: file.type });
    if (error) { setMsg(error.message); return; }
    const { error: e2 } = await supabase.from('site_settings').update(kind === 'logo' ? { logo_url: path } : { footer_video_url: path }).eq('id', 1);
    setMsg(e2 ? e2.message : `${kind === 'logo' ? 'Logo' : 'Footer video'} updated.`);
    void reload();
  }
  async function clear(kind: 'logo' | 'video') {
    await supabase.from('site_settings').update(kind === 'logo' ? { logo_url: null } : { footer_video_url: null }).eq('id', 1);
    void reload();
  }
  async function addEvent(e: FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from('events').insert(form);
    if (error) { setMsg(error.message); return; }
    setMsg('Event posted.'); setForm({ ...form, city: '', event_date: '', description: '' }); void reload();
  }
  async function setStatus(stop: TourStop, status: string) {
    if (status === 'Next event') await supabase.from('events').update({ status: 'Confirmed' }).eq('status', 'Next event');
    await supabase.from('events').update({ status }).eq('id', stop.id!);
    void reload();
  }
  async function remove(stop: TourStop) {
    if (!confirm(`Delete ${stop.city}?`)) return;
    await supabase.from('events').delete().eq('id', stop.id!); void reload();
  }

  return <div className="space-y-8">
    {msg && <p className="rounded-md bg-background p-3 text-sm border border-border">{msg}</p>}
    <section className="grid gap-6 md:grid-cols-2">
      <div className="rounded-lg border border-border bg-background p-6 space-y-3">
        <h2 className="font-display text-xl">Logo</h2>
        <div className="flex h-24 items-center justify-center rounded-md bg-muted">{settings.logoUrl ? <img src={settings.logoUrl} alt="Current logo" className="h-20 object-contain" /> : <span className="text-sm text-muted-foreground">No logo yet</span>}</div>
        <label className="inline-flex"><input type="file" accept="image/*" className="hidden" onChange={e => upload('logo', e.target.files?.[0])} /><span className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"><Upload size={16} />Upload logo</span></label>
        {settings.logoPath && <Button variant="ghost" size="sm" onClick={() => clear('logo')}>Remove</Button>}
      </div>
      <div className="rounded-lg border border-border bg-background p-6 space-y-3">
        <h2 className="font-display text-xl">Footer background video</h2>
        <div className="flex h-24 items-center justify-center overflow-hidden rounded-md bg-muted">{settings.videoUrl ? <video src={settings.videoUrl} muted autoPlay loop playsInline className="h-full w-full object-cover" /> : <span className="text-sm text-muted-foreground">No video yet</span>}</div>
        <label className="inline-flex"><input type="file" accept="video/mp4,video/webm,video/quicktime" className="hidden" onChange={e => upload('video', e.target.files?.[0])} /><span className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"><Upload size={16} />Upload video (max 50 MB)</span></label>
        {settings.videoPath && <Button variant="ghost" size="sm" onClick={() => clear('video')}>Remove</Button>}
      </div>
    </section>

    <section className="rounded-lg border border-border bg-background p-6">
      <h2 className="font-display text-xl mb-4">Post a new event</h2>
      <form onSubmit={addEvent} className="grid gap-3 md:grid-cols-2">
        <input className={input} required placeholder="City" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
        <input className={input} required type="date" value={form.event_date} onChange={e => setForm({ ...form, event_date: e.target.value })} />
        <input className={input} required placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
        <select className={input} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>{eventStatuses.map(s => <option key={s}>{s}</option>)}</select>
        <input className={`${input} md:col-span-2`} placeholder="Venue" value={form.venue} onChange={e => setForm({ ...form, venue: e.target.value })} />
        <textarea className={`${input} md:col-span-2`} placeholder="Description (optional)" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
        <Button variant="tour" type="submit" className="md:col-span-2">Post event</Button>
      </form>
    </section>

    <section className="rounded-lg border border-border bg-background p-6">
      <h2 className="font-display text-xl mb-4">Events</h2>
      <div className="divide-y divide-border">{stops.map(stop => <div key={stop.id ?? stop.city} className="flex flex-wrap items-center gap-3 py-3">
        <div className="flex-1 min-w-40"><div className="font-medium">{stop.city}</div><div className="text-xs text-muted-foreground">{stop.date} · {stop.venue}</div></div>
        <select className={`${input} w-40`} value={stop.status} onChange={e => setStatus(stop, e.target.value)}>{eventStatuses.map(s => <option key={s}>{s}</option>)}</select>
        <Button variant="ghost" size="icon" aria-label={`Delete ${stop.city}`} onClick={() => remove(stop)}><Trash2 /></Button>
      </div>)}</div>
    </section>
  </div>;
}

type AdminUser = { id: string; email: string; created_at: string; confirmed: boolean; is_admin: boolean };
function Admins({ me }: { me: string }) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [msg, setMsg] = useState('');
  async function load() { const { data, error } = await supabase.rpc('admin_list_users'); if (error) setMsg(error.message); else setUsers(data as AdminUser[]); }
  useEffect(() => { void load(); }, []);
  async function set(u: AdminUser, make: boolean) {
    if (!make && !confirm(`Remove admin access for ${u.email}?`)) return;
    const { error } = await supabase.rpc('admin_set_admin', { _target: u.id, _make_admin: make });
    setMsg(error ? error.message : make ? `${u.email} is now an admin.` : `${u.email} is no longer an admin.`); void load();
  }
  return <section className="mt-8 rounded-lg border border-border bg-background p-6">
    <h2 className="font-display text-xl mb-1">Admins & requests</h2>
    <p className="text-sm text-muted-foreground mb-4">People who sign up appear here. Only approve people you know.</p>
    {msg && <p className="text-sm mb-3">{msg}</p>}
    <div className="divide-y divide-border">{users.map(u => <div key={u.id} className="flex flex-wrap items-center gap-3 py-3">
      <div className="flex-1 min-w-40"><div className="font-medium">{u.email}{u.id === me && ' (you)'}</div><div className="text-xs text-muted-foreground">{u.is_admin ? 'Admin' : 'Waiting for approval'}{!u.confirmed && ' · email not confirmed'}</div></div>
      {u.is_admin ? (u.id !== me && <Button variant="outline" size="sm" onClick={() => set(u, false)}>Remove admin</Button>) : <Button variant="tour" size="sm" disabled={!u.confirmed} onClick={() => set(u, true)}>Accept as admin</Button>}
    </div>)}</div>
  </section>;
}
