import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { ArrowRight, ArrowUpRight, CalendarDays, MapPin, Clock3, ShieldCheck, TrendingUp, Landmark, HeartHandshake, Check, ChevronDown, Menu, Wallet, PiggyBank, Sprout, HandCoins, Users, BriefcaseBusiness, ImagePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import heroImage from '@/assets/boston-tour.jpg';
import { eventTime, checkInTime, calendarFile, type TourStop } from '@/lib/tour';
import { useSiteData } from '@/lib/site-data';

export const Route = createFileRoute('/')({
  head: () => ({ meta: [
    { title: 'Financial Freedom Blueprint Tour | 12 Massachusetts Communities' },
    { name: 'description', content: 'Join Northstar Group’s Financial Freedom Blueprint Tour across 12 Massachusetts communities. Explore financial education, retirement planning, and community opportunities.' },
    { property: 'og:title', content: 'The Financial Freedom Blueprint Tour | Northstar Group' },
    { property: 'og:description', content: '12 cities. One mission. Building financially empowered communities across Massachusetts, September 2026–April 2027.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: Index,
});

const blueprint = [
  { name: 'Earn', icon: Wallet, copy: 'Create a foundation for your financial future.' },
  { name: 'Protect', icon: ShieldCheck, copy: 'Safeguard your income and the people you love.' },
  { name: 'Save', icon: PiggyBank, copy: 'Build intentional habits for tomorrow.' },
  { name: 'Grow', icon: Sprout, copy: 'Explore strategies for long-term wealth.' },
  { name: 'Distribute', icon: HandCoins, copy: 'Prepare for life beyond your working years.' },
  { name: 'Transfer', icon: HeartHandshake, copy: 'Plan the legacy you want to leave.' },
];
const pathways = [
  { name: 'Your financial next chapter', icon: Users, copy: 'Explore a financial strategy session focused on your needs, your family, and your future.', action: 'Financial strategy session' },
  { name: 'A career with purpose', icon: BriefcaseBusiness, copy: 'Discover financial services career pathways, licensing, training, and professional development.', action: 'Career opportunity' },
  { name: 'Stronger, together', icon: HeartHandshake, copy: 'Bring financial education to your community through local relationships and partnerships.', action: 'Community partnership' },
];

function Index() {
  const [filter, setFilter] = useState('Upcoming');
  const [showAll, setShowAll] = useState(false);
  const [selected, setSelected] = useState<TourStop | null>(null);
  const [pathway, setPathway] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { stops: tourStops, settings } = useSiteData();
  const logo = settings.logoUrl;
  const stops = tourStops.filter(stop => filter === 'All stops' || (filter === 'Completed' ? stop.status === 'Completed' : stop.status !== 'Completed'));
  const visibleStops = showAll ? stops : stops.slice(0, 3);

  function downloadCalendar(stop: TourStop) {
    const url = URL.createObjectURL(new Blob([calendarFile(stop)], { type: 'text/calendar;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `blueprint-tour-${stop.city.toLowerCase()}.ics`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const brand = <div><div className="brand-name">Northstar Group<span className="text-primary">.</span></div><div className="brand-subtitle">Financial freedom starts here</div></div>;

  return <>
    <header className="bg-background border-b border-border">
      <div className="site-header page-width">
        <div className="brand-lockup">
          <div className="logo-space p-0 flex items-center justify-center">{logo ? <img className="uploaded-logo" src={logo} alt="Northstar Group logo" /> : <ImagePlus size={21} />}</div>
          {brand}
        </div>
        <nav className="desktop-nav" aria-label="Main navigation"><a href="#home" className="text-primary">Home</a><a href="#tour">The tour</a><a href="#blueprint">Our mission</a><a href="#connect">Get involved</a></nav>
        <div className="flex items-center gap-2"><Button variant="tour" asChild className="hidden sm:inline-flex"><a href="#tour">Find your city <ArrowUpRight /></a></Button><div className="mobile-nav"><Button variant="ghost" size="icon" aria-label="Open menu" onClick={() => setMobileOpen(!mobileOpen)}><Menu /></Button></div></div>
      </div>
      {mobileOpen && <nav aria-label="Mobile navigation" className="page-width flex flex-col gap-4 pb-6 text-sm">{[['Home', '#home'], ['The tour', '#tour'], ['Our mission', '#blueprint'], ['Get involved', '#connect']].map(([label, href]) => <a key={href} href={href} onClick={() => setMobileOpen(false)}>{label}</a>)}</nav>}
    </header>

    <main>
      <section id="home" className="hero-section">
        <img className="hero-image" src={heroImage} width={1920} height={1024} alt="Boston skyline across the Charles River" fetchPriority="high" />
        <div className="hero-content page-width">
          <div className="hero-eyebrow">Massachusetts · September 2026 – April 2027</div>
          <h1 className="hero-title">The Financial<br />Freedom<br /><em>Blueprint Tour.</em></h1>
          <p className="hero-description">12 cities. One mission.<br />Building financially empowered communities across Massachusetts, one conversation at a time.</p>
          <div className="hero-buttons"><Button variant="hero" size="lg" asChild><a href="#tour">Explore the tour <ArrowRight /></a></Button><Button variant="heroOutline" size="lg" asChild><a href="#blueprint">Discover the blueprint</a></Button></div>
          <div className="hero-facts"><span><MapPin size={14} />12 Massachusetts communities</span><span><CalendarDays size={14} />2026–2027</span><span><Users size={14} />A community-first initiative</span></div>
          <div className="hero-side-note">A stronger financial future.<br /><strong className="text-hero-foreground font-medium">For you. For your family. For your community.</strong></div>
        </div>
      </section>

      <section className="mission-strip"><div className="mission-inner page-width"><p className="mission-lead">Your future. Your blueprint.</p><div className="mission-pillars"><span><ShieldCheck />Protect your income</span><span><TrendingUp />Build wealth</span><span><Landmark />Prepare for retirement</span><span><HeartHandshake />Leave a legacy</span></div></div></section>

      <section id="tour" className="section-space page-width">
        <div className="section-heading"><div><p className="eyebrow">The journey across Massachusetts</p><h2 className="section-title">Next stop: your community.</h2><p className="section-description">Find a tour stop near you and take the next step toward your financial future.</p></div><div className="tour-tabs" role="group" aria-label="Filter tour stops">{['Upcoming', 'All stops', 'Completed'].map(item => <Button size="sm" variant={filter === item ? 'filterActive' : 'filter'} key={item} aria-pressed={filter === item} onClick={() => { setFilter(item); setShowAll(false); }}>{item}</Button>)}</div></div>
        <div className="event-grid">{visibleStops.map(stop => {
          const index = tourStops.indexOf(stop);
          const date = new Date(`${stop.date}T12:00:00`);
          const next = stop.status === 'Next event';
          return <article className={`event-card ${next ? 'featured' : ''}`} key={stop.id ?? stop.city}>
            <div className={`event-art ${index % 3 === 1 ? 'violet' : index % 3 === 2 ? 'blue' : ''}`}><div><div className="city-name">{stop.city}<span className="text-hero-muted">.</span></div><div className="stop-label">Massachusetts · Stop {String(index + 1).padStart(2, '0')} of {tourStops.length}</div></div><div className="art-date"><strong>{date.getDate().toString().padStart(2, '0')}</strong><span>{date.toLocaleDateString('en-US', { month: 'short' })} {date.getFullYear()}</span></div></div>
            <div className="event-body"><span className={`status ${next ? 'next' : stop.status === 'Completed' ? 'completed' : ''}`}>{next && <span className="size-1.5 rounded-full bg-primary-foreground" />}{stop.status === 'Completed' && <Check size={11} />}{stop.status}</span><h3 className="event-title">{stop.title ?? (stop.city === 'Natick' ? 'Financial Freedom Blueprint Summit' : 'Financial Freedom Blueprint Tour')}</h3><div className="event-meta"><CalendarDays />{date.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}</div><div className="event-meta"><Clock3 />{eventTime}</div><div className="event-meta"><MapPin />{stop.city}, MA · {stop.venue ?? 'Venue to be announced'}</div><div className="event-bottom"><span>{stop.status === 'Completed' ? 'The journey began here' : 'Financial education & community'}</span><Button variant="link" size="sm" className="px-0" onClick={() => setSelected(stop)}>Event details <ArrowRight /></Button></div></div>
          </article>;
        })}</div>
        {stops.length > 3 && <div className="tour-more"><Button variant="outline" onClick={() => setShowAll(!showAll)}>{showAll ? 'Show fewer stops' : `View all ${stops.length} ${filter === 'Upcoming' ? 'upcoming stops' : 'tour stops'}`}<ChevronDown className={showAll ? 'rotate-180' : ''} /></Button></div>}
        <p className="holiday-note">December: Financial Freedom Follow-Through Month. The tour returns in January.<br />Proposed dates and the finale are subject to confirmation.</p>
      </section>

      <section id="blueprint" className="about-section section-space"><div className="page-width about-layout"><div><p className="eyebrow">More than a seminar</p><h2 className="section-title">A blueprint for every<br />chapter of your life.</h2><p className="section-description">Financial confidence begins with understanding. Our tour brings practical financial education and meaningful conversations into the heart of your community.</p><p className="section-description">From protecting what matters today to preparing for tomorrow, explore a framework built around six essential steps.</p><Button variant="link" className="px-0 mt-4" asChild><a href="#connect">Take your next step <ArrowRight /></a></Button></div><div className="blueprint-grid">{blueprint.map(({ name, icon: Icon, copy }) => <div className="blueprint-step" key={name}><Icon /><h3>{name}</h3><p>{copy}</p></div>)}</div></div></section>

      <section id="connect" className="section-space page-width"><p className="eyebrow">One mission. Three ways forward.</p><h2 className="section-title">Where will your journey begin?</h2><p className="section-description">Come for the education. Leave with a next step that matters to you.</p><div className="pathway-grid">{pathways.map(({ name, icon: Icon, copy, action }) => <div className="pathway" key={name}><Icon size={25} /><h3>{name}</h3><p className="section-description">{copy}</p><Button variant="link" className="px-0 mt-3" onClick={() => setPathway(action)}>{action} <ArrowUpRight /></Button></div>)}</div></section>
    </main>

    <footer className="footer relative overflow-hidden">{settings.videoUrl && <><video className="absolute inset-0 h-full w-full object-cover" src={settings.videoUrl} autoPlay muted loop playsInline aria-hidden="true" /><div className="absolute inset-0 bg-hero/75" /></>}<div className="page-width relative"><div className="footer-top">{brand}<p className="font-display text-xl">12 cities. One mission.</p><Button variant="heroOutline" asChild><a href="#tour">Join the journey <ArrowRight /></a></Button></div><div className="footer-bottom"><span>© 2026 Northstar Group. Financial Freedom Blueprint Tour. <a href="/admin" className="underline">Admin</a></span><p className="max-w-xl">For educational purposes only. Financial, insurance, tax, and estate-planning decisions should be based on an individual assessment and advice from qualified professionals.</p></div></div></footer>

    <Dialog open={!!selected} onOpenChange={open => { if (!open) setSelected(null); }}><DialogContent className="max-w-lg max-h-[90dvh] overflow-y-auto rounded-lg"><DialogHeader><p className="eyebrow mb-2">Northstar Group · Massachusetts</p><DialogTitle className="font-display text-3xl leading-tight">{selected?.city} · {selected?.title ?? 'Financial Freedom Blueprint Tour'}</DialogTitle><DialogDescription>Financial education, community, and a meaningful next step.</DialogDescription></DialogHeader>{selected && <><div className="detail-list"><div className="detail-item"><CalendarDays /><span>{new Date(`${selected.date}T12:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}<br /><span className="status mt-2">{selected.status}</span></span></div><div className="detail-item"><Clock3 /><span>{eventTime} Eastern Time<br />Registration & networking from {checkInTime}.</span></div><div className="detail-item"><MapPin /><span>{selected.city}, Massachusetts<br />{selected.venue ?? 'Venue to be announced'}.</span></div></div><h3 className="font-display text-xl">At this event</h3>{selected.description && <p className="text-sm leading-7">{selected.description}</p>}<p className="text-sm text-muted-foreground leading-7">Explore income protection, wealth-building concepts, retirement preparedness, and legacy planning. Meet your community, ask questions, and discover financial services career and partnership opportunities.</p><div className="detail-notice">{selected.status === 'Completed' ? 'Boston opened the tour on September 19, 2026. Browse upcoming stops to continue the journey.' : `${selected.status === 'Proposed' || selected.status === 'Tour finale' ? 'This date is subject to confirmation. ' : ''}Registration is not open on this website yet. Venue and registration details will be added when available.`}</div>{selected.status !== 'Completed' && <Button variant="tour" onClick={() => downloadCalendar(selected)}><CalendarDays />Save the date</Button>}</>}</DialogContent></Dialog>

    <Dialog open={!!pathway} onOpenChange={open => { if (!open) setPathway(null); }}><DialogContent className="rounded-lg"><DialogHeader><DialogTitle className="font-display text-2xl">{pathway}</DialogTitle><DialogDescription className="leading-7">Meet the Northstar Group team at an upcoming tour stop to discuss {pathway === 'Career opportunity' ? 'licensing, training, and career pathways' : pathway === 'Community partnership' ? 'bringing financial education to your local community' : 'a financial strategy session tailored to your individual needs'}.</DialogDescription></DialogHeader><p className="detail-notice">Online appointment and enquiry options are not available yet.</p><Button variant="tour" asChild onClick={() => setPathway(null)}><a href="#tour">Find an upcoming stop <ArrowRight /></a></Button></DialogContent></Dialog>

  </>;
}
