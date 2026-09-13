'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import {
  BedDouble,
  Brain,
  CalendarDays,
  Check,
  ChevronRight,
  CircleHelp,
  CloudRain,
  Coffee,
  Dumbbell,
  EyeOff,
  Footprints,
  Gauge,
  HeartHandshake,
  LayoutDashboard,
  Lightbulb,
  LockKeyhole,
  LogOut,
  Mail,
  MapPin,
  MoonStar,
  MoveRight,
  PhoneOff,
  Settings,
  SunMedium,
  TimerReset,
  TrendingUp,
  UserRound,
  WandSparkles,
  Zap,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
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

const restQuests = [
  { id: 'walk', title: 'Step outside', detail: 'Walk away from your study zone for 15 minutes.', reward: '+12 rest points', icon: Footprints },
  { id: 'offline', title: 'No-phone reset', detail: 'Leave your phone behind and do nothing for 20 minutes.', reward: '+16 rest points', icon: PhoneOff },
  { id: 'nap', title: 'Eyes-closed recharge', detail: 'Lie down, breathe slowly and rest for 20 minutes.', reward: '+18 rest points', icon: BedDouble },
];

export default function Home() {
  const [signedIn, setSignedIn] = useState(false);
  const [authNote, setAuthNote] = useState('');
  const [activeTab, setActiveTab] = useState('today');
  const [rebalanced, setRebalanced] = useState(false);
  const [checkIn, setCheckIn] = useState(62);
  const [saved, setSaved] = useState(false);
  const [completedQuests, setCompletedQuests] = useState<string[]>(['walk']);
  const [restMinutes, setRestMinutes] = useState(40);
  const [environmentChecked, setEnvironmentChecked] = useState(false);
  const forecast = rebalanced ? balancedForecast : baseForecast;
  const rechargeResult = restMinutes === 20 ? 58 : restMinutes === 40 ? 75 : 84;
  const restScore = Math.round((completedQuests.length / restQuests.length) * 100);
  const averageEnergy = useMemo(
    () => Math.round(forecast.reduce((sum, item) => sum + item.energy, 0) / forecast.length),
    [forecast],
  );

  /* oxlint-disable react/react-compiler -- URL parameters are applied after hydration for shareable prototype views. */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const view = params.get('view');
    if (view === 'today' || view === 'forecast' || view === 'balance' || view === 'rest') setActiveTab(view);
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

  const toggleQuest = (id: string) => {
    setCompletedQuests((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  if (!signedIn) {
    return (
      <main className="login-shell">
        <section className="login-card" aria-label="EnergyBuddy sign in">
          <div className="login-visual">
            <Image className="login-logo" src="/energybuddy-logo.png" alt="EnergyBuddy smiling battery logo" width={300} height={300} priority />
            <div>
              <span className="kicker">REST-FIRST PLANNING</span>
              <h1>Protect your energy before it runs out.</h1>
              <p>Forecast overload, schedule real recovery and make rest count as progress.</p>
            </div>
            <div className="login-benefit"><TimerReset /><span><b>Tonight&apos;s focus</b><small>30% → 75% after a 40-minute reset</small></span></div>
          </div>

          <form className="login-form" onSubmit={(event) => { event.preventDefault(); setSignedIn(true); }}>
            <div className="login-mobile-brand"><span className="brand-logo-crop" aria-hidden="true"><Image src="/energybuddy-logo.png" alt="" width={81} height={81} /></span><strong><span>Energy</span><span>Buddy</span></strong></div>
            <span className="kicker">WELCOME BACK</span>
            <h2>Sign in to EnergyBuddy</h2>
            <p>Pick up your forecast and today&apos;s recovery plan.</p>

            <label htmlFor="email">Email address</label>
            <div className="auth-input"><Mail /><Input id="email" name="email" type="email" placeholder="alex@university.edu" autoComplete="email" required /></div>
            <label htmlFor="password">Password</label>
            <div className="auth-input"><LockKeyhole /><Input id="password" name="password" type="password" placeholder="Enter your password" autoComplete="current-password" minLength={6} required /></div>

            <div className="auth-options"><label htmlFor="remember"><Checkbox id="remember" /> Remember me</label><button type="button" onClick={() => setAuthNote('Password reset is not connected in this prototype.')}>Forgot password?</button></div>
            <Button className="sign-in-button" type="submit">Sign in <MoveRight /></Button>
            <div className="login-divider"><span>or</span></div>
            <Button className="demo-button" type="button" variant="outline" onClick={() => setSignedIn(true)}>Continue with Google <small>demo</small></Button>
            <p className="prototype-note">Prototype access: use any valid email and a 6+ character password.</p>
            {authNote && <output className="auth-note">{authNote}</output>}
          </form>
        </section>
      </main>
    );
  }

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
            <TabsTrigger value="forecast"><CloudRain /><span className="nav-long">Energy Forecast</span><span className="nav-short">Forecast</span></TabsTrigger>
            <TabsTrigger value="balance"><WandSparkles /><span className="nav-long">What-If Planner</span><span className="nav-short">What-If</span></TabsTrigger>
            <TabsTrigger value="rest"><BedDouble /><span className="nav-long">Proactive Rest</span><span className="nav-short">Rest</span></TabsTrigger>
          </TabsList>

          <nav className="secondary-nav" aria-label="Secondary navigation">
            <button><Gauge /> Weekly Insights</button>
            <button><CircleHelp /> Get Support</button>
          </nav>

          <div className="sidebar-bottom">
            <button><UserRound /> Profile</button>
            <button><Settings /> Settings</button>
            <button onClick={() => { setSignedIn(false); setActiveTab('today'); }}><LogOut /> Log out</button>
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

          <TabsContent value="rest" className="view-panel">
            <div className="view-title rest-title"><span className="kicker">PROACTIVE REST</span><h2>Rest is part of the work.</h2><p>Complete recovery on purpose, see the likely payoff, and earn progress for stopping before burnout.</p></div>

            <section className="rest-metrics" aria-label="Today’s rest progress">
              <article><span className="rest-metric-icon"><BedDouble /></span><div><small>Rest KPI</small><strong>{completedQuests.length}/{restQuests.length} quests</strong><span>{restScore}% complete</span></div></article>
              <article><span className="rest-metric-icon"><TimerReset /></span><div><small>Planned recovery</small><strong>{completedQuests.length * 20 + 15} min</strong><span>Protected today</span></div></article>
              <article><span className="rest-metric-icon"><TrendingUp /></span><div><small>Evening focus</small><strong>{rechargeResult}%</strong><span>After selected reset</span></div></article>
            </section>

            <div className="rest-grid">
              <section className="panel quest-panel">
                <div className="panel-heading"><div><span className="kicker">TODAY&apos;S REST QUESTS</span><h2>Recovery earns the score</h2></div><span className="rest-score">{restScore}%</span></div>
                <Progress value={restScore} aria-label={`Rest quest completion ${restScore}%`} />
                <div className="quest-list">
                  {restQuests.map((quest) => {
                    const Icon = quest.icon;
                    const complete = completedQuests.includes(quest.id);
                    return (
                      <article className={complete ? 'quest-row complete' : 'quest-row'} key={quest.id}>
                        <span className="quest-icon">{complete ? <Check /> : <Icon />}</span>
                        <div><strong>{quest.title}</strong><p>{quest.detail}</p><small>{quest.reward}</small></div>
                        <Button variant={complete ? 'secondary' : 'outline'} aria-pressed={complete} onClick={() => toggleQuest(quest.id)}>{complete ? 'Completed' : 'Complete'}</Button>
                      </article>
                    );
                  })}
                </div>
              </section>

              <section className="panel recharge-panel">
                <div className="panel-heading"><div><span className="kicker">RECHARGE CURVE</span><h2>See what rest gives back</h2></div><TrendingUp /></div>
                <div className="duration-picker" aria-label="Choose rest duration">
                  {[20, 40, 60].map((minutes) => <button key={minutes} data-active={restMinutes === minutes || undefined} onClick={() => setRestMinutes(minutes)}>{minutes} min</button>)}
                </div>
                <div className="curve-summary"><span><small>Focus now</small><strong>30%</strong></span><MoveRight /><span className="curve-result"><small>After resting</small><strong>{rechargeResult}%</strong></span></div>
                <svg className="recharge-curve" viewBox="0 0 510 190" aria-labelledby="recharge-curve-title">
                  <title id="recharge-curve-title">Estimated focus rises from 30% to {rechargeResult}% after {restMinutes} minutes of rest</title>
                  <path className="curve-grid" d="M32 30H488M32 80H488M32 130H488M32 170H488" />
                  <defs><linearGradient id="curveFill" x1="0" y1="1" x2="0" y2="0"><stop stopColor="#1447e6" stopOpacity=".32"/><stop offset="1" stopColor="#fee685" stopOpacity=".08"/></linearGradient></defs>
                  <path className="curve-area" d={`M32 150 C150 145 270 116 478 ${Math.max(32, 180 - rechargeResult * 1.65)} L478 170 L32 170Z`} />
                  <path className="curve-line" d={`M32 150 C150 145 270 116 478 ${Math.max(32, 180 - rechargeResult * 1.65)}`} />
                  <circle cx="32" cy="150" r="6" /><circle className="curve-end" cx="478" cy={Math.max(32, 180 - rechargeResult * 1.65)} r="7" />
                </svg>
                <p className="recharge-copy">If you rest for <b>{restMinutes} minutes now</b>, your estimated coding focus tonight rises from <b>30%</b> to <b>{rechargeResult}%</b>.</p>
                <small className="estimate-note">Estimate based on your check-in and today&apos;s workload—not a medical prediction.</small>
              </section>

              <section className="panel environment-panel">
                <span className="environment-icon"><MapPin /></span>
                <div><span className="kicker">ENVIRONMENT SHIFT</span><h2>{environmentChecked ? 'You left the study zone.' : 'Change place, change pace.'}</h2><p>{environmentChecked ? '842 steps detected during a 12-minute walk. Your rest quest is ready to complete.' : 'Start a simulated check-in to preview how the mobile version confirms that you stepped away.'}</p><small>Prototype simulation · A mobile build can connect to HealthKit or Google Fit and location only after permission.</small></div>
                <Button onClick={() => setEnvironmentChecked((current) => !current)}>{environmentChecked ? <><Check /> Check-in complete</> : <><Footprints /> Start check-in</>}</Button>
              </section>

              <aside className="rest-principle"><EyeOff /><div><span className="kicker">THE RULE</span><h2>No productivity during rest.</h2><p>Scrolling, studying and answering messages do not count. A completed quest means you deliberately disconnected.</p></div></aside>
            </div>
          </TabsContent>

          <footer>EnergyBuddy offers workload guidance, not medical diagnosis. If stress feels unmanageable, contact someone you trust or your university support service.</footer>
        </section>
      </Tabs>
    </main>
  );
}
