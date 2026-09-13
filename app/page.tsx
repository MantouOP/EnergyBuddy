'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import {
  Brain,
  CalendarDays,
  Check,
  ChevronRight,
  CircleHelp,
  CloudRain,
  Coffee,
  Dumbbell,
  Gauge,
  HeartHandshake,
  LayoutDashboard,
  Lightbulb,
  LogOut,
  MoonStar,
  MoveRight,
  Settings,
  SunMedium,
  UserRound,
  WandSparkles,
  Zap,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
  { time: '9:00', title: 'Data Structures lecture', detail: '1 hr · campus', cost: 12, icon: Brain },
  { time: '12:30', title: 'Lunch away from screens', detail: '30 min · recovery', cost: -8, icon: Coffee },
  { time: '2:00', title: 'Algorithms assignment', detail: '2.5 hrs · deep work', cost: 28, icon: Lightbulb },
  { time: '6:30', title: 'Society committee meeting', detail: '1 hr · group work', cost: 18, icon: HeartHandshake },
];

const batteries = [
  { label: 'Mental energy', value: 42, note: 'Protect focus', icon: Brain, tone: 'violet' },
  { label: 'Physical energy', value: 58, note: 'Holding steady', icon: Dumbbell, tone: 'pink' },
  { label: 'Social energy', value: 76, note: 'Good reserve', icon: HeartHandshake, tone: 'mint' },
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

  /* oxlint-disable react/react-compiler -- URL parameters are applied after hydration for shareable prototype views. */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const view = params.get('view');
    if (view === 'today' || view === 'forecast' || view === 'balance') setActiveTab(view);
    if (params.get('balanced') === 'true') setRebalanced(true);
  }, []);
  /* oxlint-enable react/react-compiler */

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
          description: 'Apply EnergyBuddy’s Thursday changes and update the visible energy forecast.',
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
    <main className="app-frame">
      <Tabs value={activeTab} onValueChange={setActiveTab} orientation="vertical" className="dashboard-app">
        <aside className="sidebar">
          <div className="brand">
            <span className="brand-logo-crop" aria-hidden="true"><Image src="/energybuddy-logo.png" alt="" width={81} height={81} priority /></span>
            <div><strong><span>Energy</span><span>Buddy</span></strong><span>Burnout Coach</span></div>
          </div>

          <TabsList className="side-nav" aria-label="Main navigation">
            <TabsTrigger value="today"><LayoutDashboard /> Dashboard</TabsTrigger>
            <TabsTrigger value="forecast"><CloudRain /> Energy Forecast</TabsTrigger>
            <TabsTrigger value="balance"><WandSparkles /> What-If Planner</TabsTrigger>
          </TabsList>

          <nav className="secondary-nav" aria-label="Secondary navigation">
            <button><Gauge /> Weekly Insights</button>
            <button><CircleHelp /> Get Support</button>
          </nav>

          <div className="sidebar-bottom">
            <button><UserRound /> Profile</button>
            <button><Settings /> Settings</button>
            <button><LogOut /> Log out</button>
          </div>
        </aside>

        <section className="workspace">
          <header className="workspace-header">
            <div>
              <h1>Hello, Alex!</h1>
              <p>Ready to protect your energy today?</p>
            </div>
            <div className="status-cluster">
              <div className="date-status"><strong>3:09 PM</strong><span><CalendarDays /> Monday, Sep 13</span></div>
              <div className="weather-status"><CloudRain /><span><strong>Cloudy</strong>58% now</span></div>
              <button className="avatar" aria-label="Open profile">AM</button>
            </div>
          </header>

          <TabsContent value="today" className="view-panel">
            <section className="metric-grid" aria-label="Energy summary">
              {batteries.map((item) => {
                const Icon = item.icon;
                return (
                  <article className={`metric-card ${item.tone}`} key={item.label}>
                    <span className="metric-icon"><Icon /></span>
                    <div><span>{item.label}</span><strong>{item.value}%</strong><small>{item.note}</small></div>
                  </article>
                );
              })}
              <article className="metric-card yellow">
                <span className="metric-icon"><Zap /></span>
                <div><span>Weekly reserve</span><strong>{averageEnergy}%</strong><small>{rebalanced ? 'Plan improved' : 'Storm detected'}</small></div>
              </article>
            </section>

            <div className="today-grid">
              <section className="panel forecast-chart-panel">
                <div className="panel-heading">
                  <div><span className="kicker">NEXT 7 DAYS</span><h2>Your energy forecast</h2></div>
                  <Button variant="ghost" onClick={() => setActiveTab('forecast')}>Full forecast <ChevronRight /></Button>
                </div>
                <div className="energy-chart" aria-label="Seven day projected energy chart">
                  {forecast.map((item) => (
                    <div className="chart-column" key={item.day}>
                      <div className="chart-track"><span className={item.weather.toLowerCase()} style={{ height: `${item.energy}%` }}><b>{item.energy}%</b></span></div>
                      <small>{item.day}</small>
                    </div>
                  ))}
                </div>
                <div className="chart-legend"><span><i className="clear-dot" /> Safe reserve</span><span><i className="storm-dot" /> Attention needed</span></div>
              </section>

              <section className="panel load-panel">
                <div className="panel-heading"><div><span className="kicker">TODAY</span><h2>Your energy plan</h2></div><span className="load-chip">84% capacity</span></div>
                <div className="task-list">
                  {tasks.map((task) => {
                    const Icon = task.icon;
                    return (
                      <article className="task-row" key={task.title}>
                        <time>{task.time}</time><span className="task-icon"><Icon /></span>
                        <div><strong>{task.title}</strong><small>{task.detail}</small></div>
                        <span className={task.cost < 0 ? 'cost recover' : 'cost'}>{task.cost < 0 ? '+' : '−'}{Math.abs(task.cost)}%</span>
                      </article>
                    );
                  })}
                </div>
              </section>

              <section className="panel storm-panel">
                <span className="storm-icon"><Zap /></span>
                <div><span className="kicker">THURSDAY · STORM WATCH</span><h2>Your plan drops to 7% reserve.</h2><p>Deep work and a late shift collide without recovery. Three small changes can make it manageable.</p></div>
                <Button onClick={() => setActiveTab('balance')}>Rebalance now <MoveRight /></Button>
              </section>

              <section className="panel checkin-panel">
                <div className="panel-heading"><div><span className="kicker">15-SECOND CHECK-IN</span><h2>How charged do you feel?</h2></div><strong className="checkin-number">{checkIn}%</strong></div>
                <Slider value={[checkIn]} onValueChange={(value) => { setCheckIn(typeof value === 'number' ? value : value[0]); setSaved(false); }} aria-label="Current energy level" />
                <div className="slider-labels"><span>Running low</span><span>Fully charged</span></div>
                <Button variant={saved ? 'secondary' : 'default'} onClick={() => setSaved(true)}>{saved ? <><Check /> Saved</> : 'Save check-in'}</Button>
              </section>
            </div>
          </TabsContent>

          <TabsContent value="forecast" className="view-panel">
            <div className="view-title"><span className="kicker">7-DAY OUTLOOK</span><h2>Your week, before it happens.</h2><p>Check-ins, task intensity and recovery gaps become one explainable forecast.</p></div>
            <section className="forecast-grid">
              {forecast.map((item) => {
                const Icon = item.icon;
                return (
                  <article className={`forecast-day ${item.weather.toLowerCase()} ${item.day === 'Thu' ? 'selected' : ''}`} key={item.day}>
                    <div><span>{item.day}</span><strong>{item.date}</strong></div><Icon /><span>{item.weather}</span><b>{item.energy}%</b>
                    <Progress value={item.energy} aria-label={`${item.day} energy reserve ${item.energy}%`} />
                  </article>
                );
              })}
            </section>
            <section className="panel forecast-explainer">
              <span className="storm-icon"><Zap /></span>
              <div className="explain-copy"><span className="kicker">WHY THURSDAY IS STORMY</span><h2>Demand exceeds projected energy by 24%.</h2><p>Two deep-work blocks sit beside a late shift, with no meal or reset time between them.</p></div>
              <div className="forecast-math"><div><span>Starting</span><b>61%</b></div><MoveRight /><div><span>Demand</span><b>85%</b></div><MoveRight /><div className="danger"><span>Ending</span><b>{rebalanced ? '31%' : '7%'}</b></div></div>
            </section>
            <div className="forecast-actions"><div className="legend"><span><i className="clear-dot" /> Clear 65–100%</span><span><i className="cloudy-dot" /> Cloudy 30–64%</span><span><i className="heavy-dot" /> Heavy 15–29%</span><span><i className="storm-dot" /> Storm below 15%</span></div><Button onClick={() => setActiveTab('balance')}>Open What-If Planner</Button></div>
          </TabsContent>

          <TabsContent value="balance" className="view-panel">
            <div className="view-title"><span className="kicker">WHAT-IF PLANNER · THURSDAY</span><h2>Make room before you run out.</h2><p>Preview small changes, keep the essentials, then update your forecast.</p></div>
            <section className="before-after">
              <article className="plan-card current-plan">
                <div className="plan-heading"><span>Current plan</span><strong>7% left</strong></div>
                <div className="plan-weather danger-weather"><Zap /><span><b>Storm</b> · overload likely</span></div>
                <div className="plan-items"><div><span>9:00</span><p><b>Database lab</b><small>−18% mental</small></p></div><div><span>12:00</span><p><b>Algorithms assignment</b><small>−32% mental</small></p></div><div><span>4:00</span><p><b>Revision session</b><small>−20% mental</small></p></div><div><span>6:00</span><p><b>Part-time shift</b><small>−28% physical</small></p></div></div>
              </article>
              <div className="swap-arrow"><MoveRight /></div>
              <article className={`plan-card balanced-plan ${rebalanced ? 'accepted' : ''}`}>
                <div className="plan-heading"><span>Balanced plan</span><strong>31% left</strong></div>
                <div className="plan-weather safe-weather"><CloudRain /><span><b>Cloudy</b> · manageable</span></div>
                <div className="plan-items"><div><span>9:00</span><p><b>Database lab</b><small>Kept · essential</small></p></div><div><span>12:00</span><p><b>Assignment · part 1</b><small>Split into 75 min</small></p></div><div className="recovery-item"><span>1:30</span><p><b>Lunch + reset</b><small>+12% recovery</small></p></div><div><span>6:00</span><p><b>Part-time shift</b><small>Kept · essential</small></p></div><div><span>Fri</span><p><b>Revision session</b><small>Moved to a clear day</small></p></div></div>
              </article>
            </section>
            <section className="apply-panel"><div><span className="apply-icon"><MoonStar /></span><p><b>+24% safer reserve</b><small>No essential commitments removed</small></p></div><Button onClick={() => setRebalanced(true)} disabled={rebalanced}>{rebalanced ? <><Check /> Plan applied</> : 'Apply balanced plan'}</Button></section>
            {rebalanced && <output className="success-note"><Check /> Thursday changed from Storm to Cloudy. Your forecast is updated.</output>}
          </TabsContent>

          <footer>EnergyBuddy offers workload guidance, not medical diagnosis. If stress feels unmanageable, contact someone you trust or your university support service.</footer>
        </section>
      </Tabs>
    </main>
  );
}
