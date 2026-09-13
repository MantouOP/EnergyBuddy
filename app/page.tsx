'use client';

import { type ChangeEvent, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { signIn, signOut, useSession } from 'next-auth/react';
import {
  BedDouble,
  Brain,
  CalendarDays,
  CalendarPlus,
  Check,
  ChevronRight,
  CircleHelp,
  Clock3,
  CloudRain,
  Coffee,
  Dumbbell,
  EyeOff,
  Footprints,
  HeartHandshake,
  LayoutDashboard,
  Lightbulb,
  LogOut,
  LocateFixed,
  MapPin,
  MapPinned,
  MicOff,
  MoonStar,
  MoveRight,
  PhoneOff,
  Pencil,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Shield,
  SunMedium,
  TimerReset,
  TrendingUp,
  Trash2,
  UserRound,
  UsersRound,
  WandSparkles,
  Zap,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { LocationPin } from '@/components/energy-map';

const EnergyMap = dynamic(
  () => import('@/components/energy-map').then((module) => module.EnergyMap),
  { ssr: false, loading: () => <div className="map-loading">Loading map…</div> },
);

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

const initialTasks = [
  { id: 'lecture', time: '9:00', title: 'Data Structures lecture', detail: '1 hr · campus', cost: 12, icon: Brain },
  { id: 'lunch', time: '12:30', title: 'Lunch away from screens', detail: '30 min · recovery', cost: -8, icon: Coffee },
  { id: 'assignment', time: '2:00', title: 'Algorithms assignment', detail: '2.5 hrs · deep work', cost: 28, icon: Lightbulb },
  { id: 'meeting', time: '6:30', title: 'Society committee meeting', detail: '1 hr · group work', cost: 18, icon: HeartHandshake },
];

type EnergyTask = (typeof initialTasks)[number];
type TaskDraft = Pick<EnergyTask, 'time' | 'title' | 'detail' | 'cost'>;
type EnergyAssessment = {
  capacity: number;
  confidence: 'low' | 'medium' | 'high';
  summary: string;
  factors: string[];
  taskEstimates: { id: string; cost: number; reason: string }[];
  model: string;
};

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

type SocialMeeting = {
  id: string;
  time: string;
  title: string;
  format: string;
  minutes: number;
};

type GhostBlock = {
  id: string;
  label: string;
  time: string;
};

const socialMeetings: SocialMeeting[] = [
  { id: 'capstone', time: '10:00 AM', title: 'Capstone group sync', format: '4 people · online', minutes: 45 },
  { id: 'committee', time: '2:00 PM', title: 'Society committee', format: '8 people · campus', minutes: 30 },
  { id: 'presentation', time: '5:30 PM', title: 'Project presentation', format: 'presenting · seminar room', minutes: 60 },
];

const ghostBlockPresets = [
  { label: 'Post-meeting decompression', time: '3:30–4:30 PM' },
  { label: 'No-contact focus window', time: '7:00–9:00 PM' },
  { label: 'Morning quiet start', time: '8:00–9:00 AM' },
];

const initialGhostBlocks: GhostBlock[] = [
  { id: 'ghost-0', ...ghostBlockPresets[0] },
];

const initialLocationPins: LocationPin[] = [
  { id: 'campus', label: 'Campus', lat: 3.1209, lng: 101.6538 },
  { id: 'study-zone', label: 'Quiet study zone', lat: 3.1224, lng: 101.6553 },
];

type StoredEnergyTask = Omit<EnergyTask, 'icon'>;

const storageKeys = {
  plan: 'energybuddy.plan',
  checkIn: 'energybuddy.check-in',
  quests: 'energybuddy.quests',
  restMinutes: 'energybuddy.rest-minutes',
  rebalanced: 'energybuddy.rebalanced',
  ghostBlocks: 'energybuddy.ghost-blocks',
  locationPins: 'energybuddy.location-pins',
  profileImage: 'energybuddy.profile-image',
} as const;

function readStoredValue<T>(storage: 'local' | 'session', key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const value = (storage === 'local' ? window.localStorage : window.sessionStorage).getItem(key);
    return value ? JSON.parse(value) as T : fallback;
  } catch {
    return fallback;
  }
}

function loadEnergyTasks(): EnergyTask[] {
  const stored = readStoredValue<StoredEnergyTask[]>('local', storageKeys.plan, []);
  if (!Array.isArray(stored) || stored.length === 0) return initialTasks;

  return stored
    .filter((task) => task && typeof task.id === 'string' && typeof task.title === 'string' && typeof task.cost === 'number')
    .map((task) => ({
      ...task,
      icon: initialTasks.find((initial) => initial.id === task.id)?.icon ?? Brain,
    }));
}

function prepareProfileImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new window.Image();

    image.onload = () => {
      const size = 256;
      const scale = Math.max(size / image.naturalWidth, size / image.naturalHeight);
      const width = image.naturalWidth * scale;
      const height = image.naturalHeight * scale;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const context = canvas.getContext('2d');

      if (!context) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('This browser could not prepare the image.'));
        return;
      }

      context.drawImage(image, (size - width) / 2, (size - height) / 2, width, height);
      URL.revokeObjectURL(objectUrl);
      resolve(canvas.toDataURL('image/webp', 0.84));
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('That image could not be opened.'));
    };
    image.src = objectUrl;
  });
}

export default function Home() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState('today');
  const [rebalanced, setRebalanced] = useState(() => readStoredValue('local', storageKeys.rebalanced, false));
  const [checkIn, setCheckIn] = useState(() => readStoredValue('local', storageKeys.checkIn, 62));
  const [saved, setSaved] = useState(false);
  const [completedQuests, setCompletedQuests] = useState<string[]>(() => readStoredValue('local', storageKeys.quests, ['walk']));
  const [restMinutes, setRestMinutes] = useState(() => readStoredValue('local', storageKeys.restMinutes, 40));
  const [environmentChecked, setEnvironmentChecked] = useState(false);
  const [energyTasks, setEnergyTasks] = useState<EnergyTask[]>(loadEnergyTasks);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [taskDraft, setTaskDraft] = useState<TaskDraft>({ time: '', title: '', detail: '', cost: 10 });
  const [locationPins, setLocationPins] = useState<LocationPin[]>(() => readStoredValue('session', storageKeys.locationPins, initialLocationPins));
  const [pinLabel, setPinLabel] = useState('');
  const [locationNote, setLocationNote] = useState('Name a place, then click the map to drop a pin.');
  const [aiAssessment, setAiAssessment] = useState<EnergyAssessment | null>(null);
  const [assessmentError, setAssessmentError] = useState('');
  const [isAssessing, setIsAssessing] = useState(false);
  const [meetingAgendas, setMeetingAgendas] = useState<Record<string, string[]>>({});
  const [activeMeetingId, setActiveMeetingId] = useState<string | null>(null);
  const [meetingSeconds, setMeetingSeconds] = useState(30 * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [ghostBlocks, setGhostBlocks] = useState<GhostBlock[]>(() => readStoredValue('local', storageKeys.ghostBlocks, initialGhostBlocks));
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const [supportVisible, setSupportVisible] = useState(false);
  const [profileVisible, setProfileVisible] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(() => readStoredValue('local', storageKeys.profileImage, null));
  const [profileMessage, setProfileMessage] = useState('Choose a JPG, PNG or WebP image up to 5 MB.');
  const forecast = rebalanced ? balancedForecast : baseForecast;
  const rechargeResult = restMinutes === 20 ? 58 : restMinutes === 40 ? 75 : 84;
  const restScore = Math.round((completedQuests.length / restQuests.length) * 100);
  const averageEnergy = useMemo(
    () => Math.round(forecast.reduce((sum, item) => sum + item.energy, 0) / forecast.length),
    [forecast],
  );
  const planCapacity = aiAssessment?.capacity ?? Math.max(
    0,
    Math.min(100, checkIn + 72 - energyTasks.reduce((sum, task) => sum + task.cost, 0)),
  );
  const socialMinutes = socialMeetings.reduce((sum, meeting) => sum + meeting.minutes, 0);
  const socialBattery = Math.max(0, Math.min(100, 100 - Math.round(socialMinutes * 0.45) + ghostBlocks.length * 10));
  const activeMeeting = socialMeetings.find((meeting) => meeting.id === activeMeetingId);
  const timerDisplay = `${String(Math.floor(meetingSeconds / 60)).padStart(2, '0')}:${String(meetingSeconds % 60).padStart(2, '0')}`;
  const currentTimeLabel = currentDate?.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) ?? '--:--';
  const currentDateLabel = currentDate?.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' }) ?? 'Today';
  const currentEnergyWeather = checkIn >= 65 ? 'Clear' : checkIn >= 30 ? 'Cloudy' : checkIn >= 15 ? 'Heavy' : 'Storm';
  const CurrentEnergyIcon = checkIn >= 65 ? SunMedium : checkIn >= 30 ? CloudRain : Zap;

  /* oxlint-disable react/react-compiler -- URL parameters are applied after hydration for shareable prototype views. */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const view = params.get('view');
    if (view === 'today' || view === 'forecast' || view === 'places' || view === 'balance' || view === 'social' || view === 'rest') setActiveTab(view);
    if (params.get('balanced') === 'true') setRebalanced(true);
  }, []);
  /* oxlint-enable react/react-compiler */

  useEffect(() => {
    const updateClock = () => setCurrentDate(new Date());
    const immediate = window.setTimeout(updateClock, 0);
    const interval = window.setInterval(updateClock, 60_000);
    return () => {
      window.clearTimeout(immediate);
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    try {
      const storedTasks: StoredEnergyTask[] = energyTasks.map(({ id, time, title, detail, cost }) => ({ id, time, title, detail, cost }));
      window.localStorage.setItem(storageKeys.plan, JSON.stringify(storedTasks));
      window.localStorage.setItem(storageKeys.checkIn, JSON.stringify(checkIn));
      window.localStorage.setItem(storageKeys.quests, JSON.stringify(completedQuests));
      window.localStorage.setItem(storageKeys.restMinutes, JSON.stringify(restMinutes));
      window.localStorage.setItem(storageKeys.rebalanced, JSON.stringify(rebalanced));
      window.localStorage.setItem(storageKeys.ghostBlocks, JSON.stringify(ghostBlocks));
    } catch {
      // The prototype remains usable when browser storage is unavailable.
    }
  }, [checkIn, completedQuests, energyTasks, ghostBlocks, rebalanced, restMinutes]);

  useEffect(() => {
    try {
      window.sessionStorage.setItem(storageKeys.locationPins, JSON.stringify(locationPins));
    } catch {
      // Location pins remain in memory when session storage is unavailable.
    }
  }, [locationPins]);

  useEffect(() => {
    try {
      if (profileImage) window.localStorage.setItem(storageKeys.profileImage, JSON.stringify(profileImage));
      else window.localStorage.removeItem(storageKeys.profileImage);
    } catch {
      // The photo remains visible for this visit when browser storage is unavailable.
    }
  }, [profileImage]);

  useEffect(() => {
    if (!timerRunning || meetingSeconds <= 0) return;
    const timer = window.setTimeout(() => setMeetingSeconds((current) => Math.max(0, current - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [meetingSeconds, timerRunning]);

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

  const startEditingTask = (task: EnergyTask) => {
    setTaskDraft({ time: task.time, title: task.title, detail: task.detail, cost: task.cost });
    setEditingTaskId(task.id);
  };

  const addTask = () => {
    const id = `task-${Date.now()}`;
    const task: EnergyTask = { id, time: '3:00', title: 'New commitment', detail: '30 min · flexible', cost: 10, icon: Brain };
    setEnergyTasks((current) => [...current, task]);
    setAiAssessment(null);
    startEditingTask(task);
  };

  const saveTask = () => {
    if (!editingTaskId || !taskDraft.title.trim() || !taskDraft.time.trim()) return;
    setEnergyTasks((current) => current.map((task) => task.id === editingTaskId ? { ...task, ...taskDraft, title: taskDraft.title.trim(), detail: taskDraft.detail.trim() } : task));
    setAiAssessment(null);
    setAssessmentError('');
    setEditingTaskId(null);
  };

  const removeTask = (id: string) => {
    setEnergyTasks((current) => current.filter((task) => task.id !== id));
    setAiAssessment(null);
    setAssessmentError('');
    setEditingTaskId(null);
  };

  const runEnergyAssessment = async () => {
    setIsAssessing(true);
    setAssessmentError('');

    try {
      const response = await fetch('/api/energy-assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkIn,
          completedRestMinutes: completedQuests.length * 20 + 15,
          tasks: energyTasks.map((task) => ({
            id: task.id,
            time: task.time,
            title: task.title,
            detail: task.detail,
            currentCost: task.cost,
          })),
        }),
      });
      const result = await response.json() as {
        assessment?: Omit<EnergyAssessment, 'model'>;
        error?: string;
        model?: string;
      };

      if (!response.ok || !result.assessment || !result.model) {
        throw new Error(result.error ?? 'The assessment could not be completed.');
      }

      const assessment = { ...result.assessment, model: result.model };
      setAiAssessment(assessment);
      setEnergyTasks((current) => current.map((task) => {
        const estimate = assessment.taskEstimates.find((item) => item.id === task.id);
        return estimate ? { ...task, cost: estimate.cost } : task;
      }));
    } catch (error) {
      setAssessmentError(error instanceof Error ? error.message : 'The assessment could not be completed.');
    } finally {
      setIsAssessing(false);
    }
  };

  const addLocationPin = (lat: number, lng: number) => {
    const label = pinLabel.trim() || `Pinned place ${locationPins.length + 1}`;
    setLocationPins((current) => [...current, { id: `pin-${Date.now()}`, label, lat, lng }]);
    setPinLabel('');
    setLocationNote(`${label} was added to your map.`);
  };

  const removeLocationPin = (id: string) => {
    setLocationPins((current) => current.filter((pin) => pin.id !== id));
    setLocationNote('Pin removed.');
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setLocationNote('This browser does not support location. You can still click the map to add a pin.');
      return;
    }

    setLocationNote('Waiting for browser location permission…');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const label = pinLabel.trim() || 'My current location';
        setLocationPins((current) => [
          ...current,
          { id: `current-${Date.now()}`, label, lat: coords.latitude, lng: coords.longitude },
        ]);
        setPinLabel('');
        setLocationNote(`${label} was added. Open its pin to see the coordinates.`);
      },
      () => setLocationNote('Location was unavailable or permission was declined. You can still click the map to add a pin.'),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    );
  };

  const generateMeetingAgenda = (meeting: SocialMeeting) => {
    setMeetingAgendas((current) => ({
      ...current,
      [meeting.id]: [
        `2 min — agree on the outcome for ${meeting.title}`,
        '18 min — resolve the three highest-priority decisions',
        '10 min — assign owners, deadlines and the next update',
      ],
    }));
  };

  const startMeetingTimer = (meetingId: string) => {
    if (activeMeetingId !== meetingId || meetingSeconds === 0) {
      setActiveMeetingId(meetingId);
      setMeetingSeconds(30 * 60);
      setTimerRunning(true);
      return;
    }
    setTimerRunning((current) => !current);
  };

  const resetMeetingTimer = () => {
    setMeetingSeconds(30 * 60);
    setTimerRunning(false);
  };

  const addGhostBlock = () => {
    const preset = ghostBlockPresets[ghostBlocks.length % ghostBlockPresets.length];
    setGhostBlocks((current) => [...current, { id: `ghost-${Date.now()}`, ...preset }]);
  };

  const removeGhostBlock = (id: string) => {
    setGhostBlocks((current) => current.filter((block) => block.id !== id));
  };

  const changeProfileImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setProfileMessage('Please choose a JPG, PNG or WebP image.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setProfileMessage('That image is larger than 5 MB. Please choose a smaller file.');
      return;
    }

    setProfileMessage('Preparing your photo…');
    try {
      setProfileImage(await prepareProfileImage(file));
      setProfileMessage('Profile photo updated and saved in this browser.');
    } catch (error) {
      setProfileMessage(error instanceof Error ? error.message : 'That image could not be used.');
    }
  };

  const removeProfileImage = () => {
    setProfileImage(null);
    setProfileMessage('Profile photo removed. Your initials are shown again.');
  };

  if (status !== 'authenticated') {
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

          <div className="login-form">
            <div className="login-mobile-brand"><span className="brand-logo-crop" aria-hidden="true"><Image src="/energybuddy-logo.png" alt="" width={81} height={81} /></span><strong><span>Energy</span><span>Buddy</span></strong></div>
            <span className="kicker">WELCOME BACK</span>
            <h2>Sign in to EnergyBuddy</h2>
            <p>Pick up your forecast and today&apos;s recovery plan.</p>

            <Button
              className="google-button"
              type="button"
              disabled={status === 'loading'}
              onClick={() => void signIn('google', { redirectTo: '/' })}
            >
              <span className="google-mark" aria-hidden="true">G</span>
              {status === 'loading' ? 'Checking session…' : 'Continue with Google'}
            </Button>
            <p className="prototype-note">Secure sign-in powered by Google. EnergyBuddy never receives your Google password.</p>
          </div>
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
            <TabsTrigger value="places"><MapPinned /><span className="nav-long">Energy Places</span><span className="nav-short">Places</span></TabsTrigger>
            <TabsTrigger value="balance"><WandSparkles /><span className="nav-long">What-If Planner</span><span className="nav-short">What-If</span></TabsTrigger>
            <TabsTrigger value="social"><UsersRound /><span className="nav-long">Social Battery</span><span className="nav-short">Social</span></TabsTrigger>
            <TabsTrigger value="rest"><BedDouble /><span className="nav-long">Proactive Rest</span><span className="nav-short">Rest</span></TabsTrigger>
          </TabsList>

          <nav className="secondary-nav" aria-label="Secondary navigation">
            <button onClick={() => setSupportVisible((current) => !current)}><CircleHelp /> Get Support</button>
          </nav>

          <div className="sidebar-bottom">
            <button onClick={() => setProfileVisible((current) => !current)}><UserRound /> Profile</button>
            <button onClick={() => void signOut({ redirectTo: '/' })}><LogOut /> Log out</button>
          </div>
        </aside>

        <section className="workspace">
          <header className="workspace-header">
            <div>
              <h1>Hello, {session.user?.name?.split(' ')[0] ?? 'friend'}!</h1>
              <p>Ready to protect your energy today?</p>
            </div>
            <div className="status-cluster">
              <div className="date-status"><strong>{currentTimeLabel}</strong><span><CalendarDays /> {currentDateLabel}</span></div>
              <div className="weather-status"><CurrentEnergyIcon /><span><strong>{currentEnergyWeather}</strong>{checkIn}% check-in</span></div>
              <button className="avatar" aria-label={`Open ${session.user?.name ?? session.user?.email ?? 'your'} profile`} onClick={() => setProfileVisible((current) => !current)}>
                {profileImage ? <Image src={profileImage} alt="" width={48} height={48} unoptimized /> : (session.user?.name ?? session.user?.email ?? 'EB').split(/\s+|@/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()}
              </button>
            </div>
          </header>

          {profileVisible && <aside className="utility-banner profile-banner" aria-label="Profile settings"><span className="profile-photo">{profileImage ? <Image src={profileImage} alt="Your profile" width={48} height={48} unoptimized /> : <UserRound />}</span><div><strong>{session.user?.name ?? 'EnergyBuddy user'}</strong><small>{session.user?.email ?? 'Signed in with Google'}</small><em aria-live="polite">{profileMessage}</em></div><div className="profile-photo-actions"><label><span>Change photo</span><input className="profile-upload-input" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => void changeProfileImage(event)} /></label>{profileImage && <button type="button" onClick={removeProfileImage}>Remove</button>}<button type="button" onClick={() => setProfileVisible(false)}>Close</button></div></aside>}
          {supportVisible && <aside className="utility-banner support-banner"><span><HeartHandshake /></span><div><strong>You do not have to handle overwhelming stress alone.</strong><small>You can message the EnergyBuddy team:</small><div className="support-contacts"><a href="mailto:enuelhzt1524@gmail.com?subject=EnergyBuddy%20Support">enuelhzt1524@gmail.com</a><a href="mailto:dihomchan1@gmail.com?subject=EnergyBuddy%20Support">dihomchan1@gmail.com</a></div><small>Contact someone you trust or your university support service. If you may be in immediate danger, contact local emergency services.</small></div><button type="button" onClick={() => setSupportVisible(false)}>Close</button></aside>}

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
                <div className="panel-heading"><div><span className="kicker">TODAY</span><h2>Your energy plan</h2></div><div className="task-heading-actions"><span className={aiAssessment ? 'load-chip ai-capacity-chip' : 'load-chip'}>{planCapacity}% {aiAssessment ? 'AI estimate' : 'capacity'}</span><button className="ai-assess-button" type="button" onClick={() => void runEnergyAssessment()} disabled={isAssessing || energyTasks.length === 0}><WandSparkles /> {isAssessing ? 'Analysing…' : 'AI assess'}</button><button className="add-task-button" type="button" onClick={addTask}><Plus /> Add</button></div></div>
                <div className="task-list">
                  {energyTasks.map((task) => {
                    const Icon = task.icon;
                    if (editingTaskId === task.id) {
                      return (
                        <form className="task-editor" key={task.id} onSubmit={(event) => { event.preventDefault(); saveTask(); }}>
                          <label><span>Time</span><input type="text" inputMode="numeric" value={taskDraft.time} onChange={(event) => setTaskDraft((current) => ({ ...current, time: event.target.value }))} placeholder="9:00" required /></label>
                          <label className="task-title-field"><span>Commitment</span><input value={taskDraft.title} onChange={(event) => setTaskDraft((current) => ({ ...current, title: event.target.value }))} placeholder="Task name" required /></label>
                          <label className="task-detail-field"><span>Details</span><input value={taskDraft.detail} onChange={(event) => setTaskDraft((current) => ({ ...current, detail: event.target.value }))} placeholder="1 hr · campus" /></label>
                          <label><span>Energy %</span><input type="number" min="-100" max="100" value={taskDraft.cost} onChange={(event) => setTaskDraft((current) => ({ ...current, cost: Number(event.target.value) }))} aria-describedby={`energy-help-${task.id}`} /></label>
                          <small id={`energy-help-${task.id}`} className="energy-help">Positive drains energy; negative restores it.</small>
                          <div className="task-editor-actions"><button className="delete-task-button" type="button" onClick={() => removeTask(task.id)}><Trash2 /> Remove</button><button type="button" onClick={() => setEditingTaskId(null)}>Cancel</button><button className="save-task-button" type="submit"><Check /> Save</button></div>
                        </form>
                      );
                    }
                    return (
                      <article className="task-row" key={task.id}>
                        <time>{task.time}</time><span className="task-icon"><Icon /></span>
                        <div><strong>{task.title}</strong><small>{task.detail}</small></div>
                        <span className={task.cost < 0 ? 'cost recover' : 'cost'}>{task.cost < 0 ? '+' : '−'}{Math.abs(task.cost)}%</span>
                        <button className="edit-task-button" type="button" aria-label={`Edit ${task.title}`} onClick={() => startEditingTask(task)}><Pencil /></button>
                      </article>
                    );
                  })}
                  {energyTasks.length === 0 && <div className="empty-task-state"><p>Your plan is empty.</p><button type="button" onClick={addTask}><Plus /> Add your first commitment</button></div>}
                </div>
                {assessmentError && <output className="ai-assessment-error" aria-live="polite">{assessmentError}</output>}
                {aiAssessment && (
                  <section className="ai-assessment-result" aria-live="polite">
                    <div><span className="ai-result-icon"><WandSparkles /></span><p><strong>AI energy assessment</strong><span>{aiAssessment.summary}</span></p><small>{aiAssessment.confidence} confidence</small></div>
                    <ul>{aiAssessment.factors.map((factor) => <li key={factor}>{factor}</li>)}</ul>
                    <small className="ai-model-note">Estimated with {aiAssessment.model}. Guidance only—not a medical or objective energy measurement.</small>
                  </section>
                )}
              </section>

              <section className="panel storm-panel">
                <span className="storm-icon"><Zap /></span>
                <div><span className="kicker">THURSDAY · STORM WATCH</span><h2>Your plan drops to 7% reserve.</h2><p>Deep work and a late shift collide without recovery. Three small changes can make it manageable.</p></div>
                <Button onClick={() => setActiveTab('balance')}>Rebalance now <MoveRight /></Button>
              </section>

              <section className="panel checkin-panel">
                <div className="panel-heading"><div><span className="kicker">15-SECOND CHECK-IN</span><h2>How charged do you feel?</h2></div><strong className="checkin-number">{checkIn}%</strong></div>
                <Slider value={[checkIn]} onValueChange={(value) => { setCheckIn(typeof value === 'number' ? value : value[0]); setSaved(false); setAiAssessment(null); setAssessmentError(''); }} aria-label="Current energy level" />
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

          <TabsContent value="places" className="view-panel">
            <div className="view-title places-title"><span className="kicker">LOCATION &amp; RECOVERY</span><h2>Pin the places that shape your energy.</h2><p>Mark study zones, recovery spots, commutes or quiet places so your environment becomes part of the plan.</p></div>
            <section className="places-grid">
              <div className="panel map-panel">
                <div className="panel-heading map-heading">
                  <div><span className="kicker">YOUR ENERGY MAP</span><h2>Click anywhere to place a pin</h2></div>
                  <button className="locate-button" type="button" onClick={useMyLocation}><LocateFixed /> Use my location</button>
                </div>
                <div className="map-label-row">
                  <label htmlFor="pin-label">Pin label</label>
                  <input id="pin-label" value={pinLabel} onChange={(event) => setPinLabel(event.target.value)} placeholder="e.g. Library, park, gym" />
                  <span>Then click anywhere on the map.</span>
                </div>
                <EnergyMap pins={locationPins} onAddPin={addLocationPin} onRemovePin={removeLocationPin} />
                <output className="location-note" aria-live="polite">{locationNote}</output>
              </div>

              <aside className="panel pin-list-panel">
                <div><span className="kicker">SAVED THIS SESSION</span><h2>Your pinned places</h2></div>
                <div className="pin-list">
                  {locationPins.map((pin) => (
                    <article className="pin-list-item" key={pin.id}>
                      <span className="saved-pin-icon"><MapPin /></span>
                      <div><strong>{pin.label}</strong><small>{pin.lat.toFixed(4)}, {pin.lng.toFixed(4)}</small></div>
                      <button type="button" aria-label={`Remove ${pin.label}`} onClick={() => removeLocationPin(pin.id)}><Trash2 /></button>
                    </article>
                  ))}
                  {locationPins.length === 0 && <p className="empty-pin-state">No pins yet. Add a label, then click the map.</p>}
                </div>
                <div className="map-privacy-note"><EyeOff /><p><strong>Private by default</strong><span>Pins stay in this browser session and are not saved to your profile or a database.</span></p></div>
              </aside>
            </section>
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

          <TabsContent value="social" className="view-panel">
            <div className="view-title social-title"><span className="kicker">SOCIAL BATTERY</span><h2>Protect the energy that meetings consume.</h2><p>See the hidden cost of group work, keep discussions short, and reserve non-negotiable time with no calls, messages or meetings.</p></div>

            <section className="social-summary-grid" aria-label="Social energy summary">
              <article className="panel social-meter-panel">
                <div className="social-meter-heading"><span className="social-meter-icon"><UsersRound /></span><div><small>Social battery after today</small><strong>{socialBattery}%</strong></div><span className={socialBattery < 50 ? 'social-status low' : 'social-status'}>{socialBattery < 50 ? 'Running low' : 'Protected'}</span></div>
                <Progress value={socialBattery} aria-label={`Projected social battery ${socialBattery}%`} />
                <div className="social-meter-stats"><span><b>{socialMinutes} min</b> talking or presenting</span><span><b>{socialMeetings.length}</b> group commitments</span><span><b>{ghostBlocks.length}</b> protected blocks</span></div>
                {socialBattery < 50 && <p className="social-warning"><Zap /> Today&apos;s group load may exceed your comfortable social reserve. Protect a quiet block after the final meeting.</p>}
              </article>

              <article className={`panel meeting-timer-panel ${meetingSeconds <= 300 ? 'timer-warning' : ''}`}>
                <div className="panel-heading"><div><span className="kicker">HARD-STOP TIMER</span><h2>{activeMeeting?.title ?? 'Choose a meeting'}</h2></div><Clock3 /></div>
                <strong className="meeting-countdown">{timerDisplay}</strong>
                <p>{meetingSeconds === 0 ? 'Time is up — the group battery needs a reset.' : meetingSeconds <= 300 ? 'Wrap up decisions and assign the remaining actions.' : 'A clear 30-minute boundary keeps discussion focused.'}</p>
                <div className="timer-actions"><Button disabled={!activeMeeting} onClick={() => activeMeeting && startMeetingTimer(activeMeeting.id)}>{timerRunning && meetingSeconds > 0 ? <><Pause /> Pause</> : <><Play /> {meetingSeconds === 0 ? 'Start again' : 'Start timer'}</>}</Button><button type="button" onClick={resetMeetingTimer} disabled={!activeMeeting}><RotateCcw /> Reset</button></div>
              </article>
            </section>

            <section className="social-workspace-grid">
              <div className="panel meeting-aggregator-panel">
                <div className="panel-heading"><div><span className="kicker">MEETING AGGREGATOR</span><h2>Today&apos;s social load</h2></div><span className="meeting-total">{socialMinutes} minutes</span></div>
                <div className="social-meeting-list">
                  {socialMeetings.map((meeting) => {
                    const agenda = meetingAgendas[meeting.id];
                    const selected = activeMeetingId === meeting.id;
                    return (
                      <article className={selected ? 'social-meeting selected' : 'social-meeting'} key={meeting.id}>
                        <time>{meeting.time}</time>
                        <span className="social-meeting-icon"><UsersRound /></span>
                        <div className="social-meeting-copy"><strong>{meeting.title}</strong><small>{meeting.format}</small></div>
                        <span className="meeting-duration">{meeting.minutes} min</span>
                        <div className="meeting-actions"><button type="button" onClick={() => generateMeetingAgenda(meeting)}><WandSparkles /> {agenda ? 'Agenda ready' : 'Make agenda'}</button><button type="button" onClick={() => startMeetingTimer(meeting.id)}><Clock3 /> {selected ? 'Open timer' : 'Time meeting'}</button></div>
                        {agenda && <ol className="meeting-agenda">{agenda.map((item) => <li key={item}>{item}</li>)}</ol>}
                      </article>
                    );
                  })}
                </div>
              </div>

              <aside className="panel ghost-mode-panel">
                <div className="ghost-mode-heading"><span className="ghost-mode-icon"><MicOff /></span><div><span className="kicker">GHOST MODE</span><h2>No-social protection</h2></div></div>
                <p>These blocks are treated as unavailable, so meetings cannot consume your recovery or focus time.</p>
                <div className="ghost-block-list">
                  {ghostBlocks.map((block) => (
                    <article key={block.id}><span><Shield /></span><div><strong>{block.label}</strong><small>{block.time}</small></div><button type="button" aria-label={`Remove ${block.label}`} onClick={() => removeGhostBlock(block.id)}><Trash2 /></button></article>
                  ))}
                  {ghostBlocks.length === 0 && <div className="ghost-empty"><MicOff /><span>No quiet time protected yet.</span></div>}
                </div>
                <button className="add-ghost-button" type="button" onClick={addGhostBlock} disabled={ghostBlocks.length >= 3}><CalendarPlus /> {ghostBlocks.length >= 3 ? 'Day fully protected' : 'Protect another block'}</button>
                <small className="calendar-prototype-note">Prototype schedule only · Google Calendar sync requires separate calendar permission.</small>
              </aside>
            </section>
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
