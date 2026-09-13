'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  BatteryCharging,
  Brain,
  CalendarDays,
  Check,
  ChevronRight,
  CloudRain,
  Coffee,
  Dumbbell,
  HeartHandshake,
  Lightbulb,
  MoonStar,
  MoveRight,
  Sparkles,
  SunMedium,
  Users,
  Zap,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type EnergyKind = 'Mental' | 'Physical' | 'Social';

const baseForecast = [
  { day: 'Mon', date: '13', weather: 'Clear', icon: SunMedium, energy: 72 },
  { day: 'Tue', date: '14', weather: 'Cloudy', icon: CloudRain, energy: 54 },
  { day: 'Wed', date: '15', weather: 'Heavy', icon: CloudRain, energy: 24 },
  { day: 'Thu', date: '16', weather: 'Storm', icon: Zap, energy: 7 },
  { day: 'Fri', date: '17', weather: 'Cloudy', icon: CloudRain, energy: 43 },
  { day: 'Sat', date: '18', weather: 'Clear', icon: SunMedium, energy: 78 },
  { day: 'Sun', date: '19', weather: 'Clear', icon: SunMedium, energy: 83 },
];

const balancedForecast = baseForecast.map((item) =>
  item.day === 'Thu'
    ? { ...item, weather: 'Cloudy', icon: CloudRain, energy: 31 }
    : item.day === 'Wed'
      ? { ...item, weather: 'Cloudy', energy: 49 }
      : item,
);

const tasks = [
  {
    time: '9:00',
    title: 'Data Structures lecture',
    detail: '1 hr · campus',
    kind: 'Mental' as EnergyKind,
    cost: 12,
    icon: Brain,
  },
  {
    time: '12:30',
    title: 'Lunch away from screens',
    detail: '30 min · recovery',
    kind: 'Physical' as EnergyKind,
    cost: -8,
    icon: Coffee,
  },
  {
    time: '2:00',
    title: 'Algorithms assignment',
    detail: '2.5 hrs · deep work',
    kind: 'Mental' as EnergyKind,
    cost: 28,
    icon: Lightbulb,
  },
  {
    time: '6:30',
    title: 'Society committee meeting',
    detail: '1 hr · group work',
    kind: 'Social' as EnergyKind,
    cost: 18,
    icon: Users,
  },
];

const energy = [
  { label: 'Mental', value: 42, icon: Brain, color: '#7557ff', tint: '#eeeaff' },
  { label: 'Physical', value: 58, icon: Dumbbell, color: '#f28b43', tint: '#fff0e5' },
  { label: 'Social', value: 76, icon: HeartHandshake, color: '#25a788', tint: '#e5f7f1' },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState('today');
  const [rebalanced, setRebalanced] = useState(false);
  const [checkIn, setCheckIn] = useState(62);
  const [saved, setSaved] = useState(false);
  const forecast = rebalanced ? balancedForecast : baseForecast;

  const averageEnergy = useMemo(
    () => Math.round(forecast.reduce((sum, item) => sum + item.energy, 0) / forecast.length),
    [forecast],
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const view = params.get('view');
    if (view === 'today' || view === 'forecast' || view === 'balance') {
      setActiveTab(view);
    }
    if (params.get('balanced') === 'true') {
      setRebalanced(true);
    }
  }, []);

  useEffect(() => {
    type ModelContext = {
      registerTool: (
        tool: {
          name: string;
          title: string;
          description: string;
          inputSchema: Record<string, unknown>;
          annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
          execute: (input: unknown) => unknown;
        },
        options?: { signal?: AbortSignal },
      ) => void | Promise<void>;
    };
    const modelContext = (document as Document & { modelContext?: ModelContext }).modelContext;
    if (!modelContext?.registerTool) return;
    const lifecycle = new AbortController();

    void Promise.resolve(
      modelContext.registerTool(
        {
          name: 'apply_balanced_plan',
          title: 'Apply balanced Thursday plan',
          description:
            'Apply EneryBuddy’s proposed Thursday schedule changes and update the visible energy forecast.',
          inputSchema: { type: 'object', properties: {}, additionalProperties: false },
          annotations: { readOnlyHint: false, untrustedContentHint: false },
          execute(input) {
            if (input === null || typeof input !== 'object' || Array.isArray(input) || Object.keys(input as object).length > 0) {
              throw new Error('Input must be an empty object.');
            }
            setRebalanced(true);
            setActiveTab('balance');
            return { status: 'applied', thursdayReserve: 31, forecast: 'Cloudy' };
          },
        },
        { signal: lifecycle.signal },
      ),
    ).catch(() => undefined);

    return () => lifecycle.abort();
  }, []);

  return (
    <main className="app-page">
      <div className="ambient ambient-one" aria-hidden="true" />
      <div className="ambient ambient-two" aria-hidden="true" />

      <section className="app-shell" aria-label="EneryBuddy student dashboard">
        <header className="topbar">
          <div className="brand" aria-label="EneryBuddy home">
            <span className="brand-mark"><BatteryCharging /></span>
            <span>EneryBuddy</span>
          </div>
          <div className="today-chip">
            <CalendarDays /> Monday, 13 September
          </div>
          <button className="avatar" aria-label="Open profile">AM</button>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="main-tabs">
          <TabsList className="nav-tabs" aria-label="Main navigation">
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="forecast">Forecast</TabsTrigger>
            <TabsTrigger value="balance">What-if</TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="tab-panel">
            <div className="dashboard-grid">
              <section className="weather-hero">
                <div className="hero-copy">
                  <span className="eyebrow"><span className="pulse-dot" /> TODAY’S ENERGY WEATHER</span>
                  <h1>Cloudy, with a<br /><em>storm ahead.</em></h1>
                  <p>You’re managing today, but Thursday’s commitments could drain your battery to <strong>7%</strong>.</p>
                  <Button className="primary-action" onClick={() => setActiveTab('balance')}>
                    Rebalance Thursday <ChevronRight />
                  </Button>
                </div>
                <div className="weather-orbit" aria-label="Current energy is 58 percent">
                  <span className="orbit orbit-one" />
                  <span className="orbit orbit-two" />
                  <CloudRain className="weather-icon" strokeWidth={1.25} />
                  <span className="weather-value">58%</span>
                  <span className="weather-caption">energy now</span>
                </div>
              </section>

              <section className="battery-section" aria-labelledby="battery-title">
                <div className="section-heading">
                  <div>
                    <span className="eyebrow">YOUR THREE BATTERIES</span>
                    <h2 id="battery-title">Not all tired feels the same.</h2>
                  </div>
                  <span className="updated">Updated just now</span>
                </div>
                <div className="battery-grid">
                  {energy.map((item) => {
                    const Icon = item.icon;
                    return (
                      <article className="battery-card" key={item.label}>
                        <div className="battery-ring" style={{ '--energy': item.value, '--ring': item.color, '--tint': item.tint } as React.CSSProperties}>
                          <div className="battery-center"><Icon /><strong>{item.value}%</strong></div>
                        </div>
                        <div className="battery-copy">
                          <h3>{item.label}</h3>
                          <p>{item.value < 50 ? 'Needs protection' : item.value < 70 ? 'Holding steady' : 'Good reserve'}</p>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>

              <section className="schedule-card">
                <div className="section-heading compact">
                  <div>
                    <span className="eyebrow">TODAY · 4 COMMITMENTS</span>
                    <h2>Your energy plan</h2>
                  </div>
                  <span className="capacity-pill">84% capacity</span>
                </div>
                <div className="task-list">
                  {tasks.map((task) => {
                    const Icon = task.icon;
                    return (
                      <article className="task-row" key={task.title}>
                        <time>{task.time}</time>
                        <span className="task-icon"><Icon /></span>
                        <div className="task-copy"><strong>{task.title}</strong><span>{task.detail}</span></div>
                        <span className={task.cost < 0 ? 'energy-cost restore' : 'energy-cost'}>{task.cost < 0 ? '+' : '−'}{Math.abs(task.cost)}%</span>
                      </article>
                    );
                  })}
                </div>
              </section>

              <aside className="checkin-card">
                <div className="checkin-icon"><Sparkles /></div>
                <span className="eyebrow">15-SECOND CHECK-IN</span>
                <h2>How charged do you feel?</h2>
                <div className="checkin-value">{checkIn}%</div>
                <Slider value={[checkIn]} onValueChange={(value) => { setCheckIn(value[0]); setSaved(false); }} aria-label="Current energy level" />
                <div className="slider-labels"><span>Running low</span><span>Fully charged</span></div>
                <Button variant={saved ? 'secondary' : 'default'} className="save-checkin" onClick={() => setSaved(true)}>
                  {saved ? <><Check /> Check-in saved</> : 'Save check-in'}
                </Button>
              </aside>
            </div>
          </TabsContent>

          <TabsContent value="forecast" className="tab-panel">
            <section className="forecast-page">
              <div className="forecast-intro">
                <div>
                  <span className="eyebrow">7-DAY OUTLOOK</span>
                  <h1>Your week, before it happens.</h1>
                  <p>We combine your check-ins, task intensity and recovery gaps into one explainable energy forecast.</p>
                </div>
                <div className="week-average"><span>Weekly reserve</span><strong>{averageEnergy}%</strong><small>{rebalanced ? '+6% after changes' : 'Storm risk detected'}</small></div>
              </div>

              <div className="forecast-strip">
                {forecast.map((item) => {
                  const Icon = item.icon;
                  return (
                    <article className={`forecast-day ${item.weather.toLowerCase()} ${item.day === 'Thu' ? 'selected' : ''}`} key={item.day}>
                      <div className="day-label"><span>{item.day}</span><strong>{item.date}</strong></div>
                      <Icon />
                      <span className="weather-name">{item.weather}</span>
                      <strong className="day-energy">{item.energy}%</strong>
                      <Progress value={item.energy} aria-label={`${item.day} energy reserve ${item.energy}%`} />
                    </article>
                  );
                })}
              </div>

              <div className="storm-explain">
                <div className="storm-symbol"><Zap /></div>
                <div className="storm-copy">
                  <span className="eyebrow">WHY THURSDAY IS STORMY</span>
                  <h2>Demand exceeds your projected energy by 24%.</h2>
                  <p>Two deep-work blocks sit beside a late shift, with no meal or reset time between them.</p>
                </div>
                <div className="forecast-metrics">
                  <div><span>Starting battery</span><strong>61%</strong></div>
                  <MoveRight />
                  <div><span>Energy demand</span><strong>85%</strong></div>
                  <MoveRight />
                  <div className="danger-metric"><span>Ending reserve</span><strong>{rebalanced ? '31%' : '7%'}</strong></div>
                </div>
              </div>

              <div className="legend" aria-label="Forecast legend">
                <span><i className="clear-dot" /> Clear · 65–100%</span>
                <span><i className="cloudy-dot" /> Cloudy · 30–64%</span>
                <span><i className="heavy-dot" /> Heavy · 15–29%</span>
                <span><i className="storm-dot" /> Storm · below 15%</span>
              </div>
            </section>
          </TabsContent>

          <TabsContent value="balance" className="tab-panel">
            <section className="balance-page">
              <div className="balance-intro">
                <span className="eyebrow">WHAT-IF PLANNER · THURSDAY</span>
                <h1>Make room before you run out.</h1>
                <p>EneryBuddy found three small changes that protect your essentials and rebuild a safe energy reserve.</p>
              </div>

              <div className="before-after">
                <article className="plan-column before">
                  <div className="plan-heading"><span>Current plan</span><strong>7% left</strong></div>
                  <div className="mini-weather"><Zap /><span><strong>Storm</strong> · overload likely</span></div>
                  <div className="plan-items">
                    <div><span>9:00</span><p><strong>Database lab</strong><small>−18% mental</small></p></div>
                    <div><span>12:00</span><p><strong>Algorithms assignment</strong><small>−32% mental</small></p></div>
                    <div><span>4:00</span><p><strong>Revision session</strong><small>−20% mental</small></p></div>
                    <div><span>6:00</span><p><strong>Part-time shift</strong><small>−28% physical</small></p></div>
                  </div>
                </article>

                <div className="swap-arrow"><MoveRight /></div>

                <article className={`plan-column after ${rebalanced ? 'accepted' : ''}`}>
                  <div className="plan-heading"><span>Balanced plan</span><strong>31% left</strong></div>
                  <div className="mini-weather safer"><CloudRain /><span><strong>Cloudy</strong> · manageable</span></div>
                  <div className="plan-items">
                    <div><span>9:00</span><p><strong>Database lab</strong><small>Kept · essential</small></p></div>
                    <div><span>12:00</span><p><strong>Assignment · part 1</strong><small>Split into 75 min</small></p></div>
                    <div className="recovery-item"><span>1:30</span><p><strong>Lunch + reset</strong><small>+12% recovery</small></p></div>
                    <div><span>6:00</span><p><strong>Part-time shift</strong><small>Kept · essential</small></p></div>
                    <div className="moved-item"><span>Fri</span><p><strong>Revision session</strong><small>Moved to a clear day</small></p></div>
                  </div>
                </article>
              </div>

              <div className="impact-bar">
                <div><span className="impact-icon"><MoonStar /></span><p><strong>+24% safer reserve</strong><small>No essential commitments removed</small></p></div>
                <Button className="accept-button" onClick={() => setRebalanced(true)} disabled={rebalanced}>
                  {rebalanced ? <><Check /> Plan applied</> : 'Apply balanced plan'}
                </Button>
              </div>

              {rebalanced && (
                <div className="success-note" role="status">
                  <Check /> Thursday changed from Storm to Cloudy. Your forecast has been updated.
                </div>
              )}
            </section>
          </TabsContent>
        </Tabs>
      </section>

      <p className="safety-note">EneryBuddy offers workload guidance, not medical diagnosis. If stress feels unmanageable, contact someone you trust or your university support service.</p>
    </main>
  );
}
