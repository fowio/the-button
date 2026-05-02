import { useState, useEffect, useRef, useCallback } from 'react';
import { sounds } from './sounds';
import { Instagram, Linkedin } from 'lucide-react';
import { projectId, publicAnonKey } from '/utils/supabase/info';

const API = `https://${projectId}.supabase.co/functions/v1/make-server-038d188e`;
const HEADERS = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${publicAnonKey}` };

// ─── Events ───────────────────────────────────────────────────────────────────

const EVENTS = {
  nothing:     { name: null,                              rarity: null,       weight: 700 },
  tiny:        { name: 'The Incredible Shrinking Button', rarity: '1 in 24', weight: 70  },
  runaway:     { name: 'Escape Artist',                   rarity: '1 in 24', weight: 70  },
  flip:        { name: 'World Flip',                      rarity: '1 in 29', weight: 60  },
  raining:     { name: "It's Raining Cats & Dogs",        rarity: '1 in 34', weight: 50  },
  invert:      { name: 'Color Invert',                    rarity: '1 in 34', weight: 50  },
  pizza:       { name: 'Pizza Cursor',                    rarity: '1 in 34', weight: 50  },
  sure:        { name: 'Are You Sure?',                   rarity: '1 in 34', weight: 50  },
  rainbow:     { name: 'Rainbow Trail',                   rarity: '1 in 34', weight: 50  },
  bruh:        { name: 'Bruh.',                           rarity: '1 in 34', weight: 50  },
  grow:        { name: "It's Growing!!",                  rarity: '1 in 43', weight: 40  },
  xperror:     { name: 'System Error',                    rarity: '1 in 43', weight: 40  },
  loading:     { name: 'Loading…',                        rarity: '1 in 43', weight: 40  },
  darken:      { name: 'Lights Out',                      rarity: '1 in 43', weight: 40  },
  invisible:   { name: 'Now You See Me…',                 rarity: '1 in 43', weight: 40  },
  existential: { name: 'Existential Crisis',              rarity: '1 in 43', weight: 40  },
  airhorn:     { name: '📯',                              rarity: '1 in 43', weight: 40  },
  tilt:        { name: 'Gravity Malfunction',             rarity: '1 in 43', weight: 40  },
  countdown:   { name: 'The Countdown',                   rarity: '1 in 43', weight: 40  },
  certificate: { name: 'Certificate of Achievement',      rarity: '1 in 57', weight: 30  },
  popups:      { name: 'Pop-up Pandemonium',              rarity: '1 in 57', weight: 30  },
  clones:      { name: 'Clone Army',                      rarity: '1 in 57', weight: 30  },
  slider:      { name: 'Pull Yourself Together',          rarity: '1 in 57', weight: 30  },
  rickroll:    { name: 'Never Gonna Give You Up',         rarity: '1 in 86', weight: 20  },
} as const;

type EventKey = keyof typeof EVENTS;

const EVENT_ORDER: EventKey[] = [
  'tiny','runaway','flip',
  'raining','invert','pizza','sure','rainbow','bruh',
  'grow','xperror','loading','darken','invisible','existential','airhorn','tilt','countdown',
  'certificate','popups','clones','slider',
  'rickroll',
];

function pickEvent(): EventKey {
  const entries = Object.entries(EVENTS) as [EventKey, typeof EVENTS[EventKey]][];
  const total = entries.reduce((s, [, e]) => s + e.weight, 0);
  let rand = Math.random() * total;
  for (const [key, e] of entries) { rand -= e.weight; if (rand <= 0) return key; }
  return 'nothing';
}

function tierColor(weight: number) {
  if (weight >= 60) return '#9ca3af';
  if (weight >= 50) return '#4ade80';
  if (weight >= 40) return '#60a5fa';
  if (weight >= 30) return '#a78bfa';
  return '#fbbf24';
}

// ─── Achievements ─────────────────────────────────────────────────────────────

type AchievementRarity = 'common'|'uncommon'|'rare'|'epic'|'legendary';
interface Achievement { name: string; desc: string; icon: string; rarity: AchievementRarity; }

const ACHIEVEMENTS: Record<string, Achievement> = {
  first_press:    { name: 'First Step',       desc: 'Press the button for the very first time',         icon: '👆', rarity: 'common'    },
  press_10:       { name: 'Clicker',          desc: 'Press the button 10 times',                        icon: '🖱️',  rarity: 'common'    },
  press_50:       { name: 'Dedicated',        desc: 'Press the button 50 times',                        icon: '💪', rarity: 'uncommon'  },
  press_67:       { name: 'The 67',           desc: 'Press the button exactly 67 times',                icon: '🎤', rarity: 'rare'      },
  press_100:      { name: 'Century',          desc: 'Press the button 100 times',                       icon: '💯', rarity: 'rare'      },
  press_500:      { name: 'No Life',          desc: 'Press the button 500 times',                       icon: '💀', rarity: 'epic'      },
  discover_first: { name: 'Curious',          desc: 'Discover your first event',                        icon: '🔍', rarity: 'common'    },
  discover_half:  { name: 'Halfway There',    desc: 'Discover at least 12 events',                      icon: '⚡', rarity: 'uncommon'  },
  discover_all:   { name: 'Completionist',    desc: 'Discover all 23 events',                           icon: '🏆', rarity: 'epic'      },
  ultimate:       { name: 'Never Gonna Stop', desc: 'Trigger the ultimate event',                       icon: '🎵', rarity: 'legendary' },
  nothing_5:      { name: 'Uneventful',       desc: 'Get nothing 5 times in a row',                     icon: '😐', rarity: 'common'    },
  nothing_10:     { name: 'Void Walker',      desc: 'Get nothing 10 times in a row',                    icon: '🕳️',  rarity: 'rare'      },
  double_rare:    { name: 'Doubly Lucky',     desc: 'Trigger 2 rare or epic events in a row',           icon: '🍀', rarity: 'rare'      },
  hot_streak:     { name: 'Hot Streak',       desc: 'Trigger 5 non-nothing events in a row',            icon: '🔥', rarity: 'uncommon'  },
  toggle_all:     { name: 'Toggle Master',    desc: 'Have all 3 passive toggles active at once',        icon: '🎮', rarity: 'rare'      },
  sure_max:       { name: 'Truly Certain',    desc: 'Reach depth 5 in "Are You Sure?"',                 icon: '🤔', rarity: 'uncommon'  },
  slider_done:    { name: 'Pulled Together',  desc: 'Complete the Pull Yourself Together challenge',    icon: '🎯', rarity: 'uncommon'  },
  speedrun:       { name: 'Speed Runner',     desc: 'Discover all 23 events in under 30 minutes',       icon: '⏱️',  rarity: 'legendary' },
  survived_dark:  { name: 'In the Dark',      desc: 'Survive the Lights Out event',                     icon: '🌑', rarity: 'common'    },
};

const ACH_ORDER = ['first_press','press_10','press_50','press_67','press_100','press_500','nothing_5','nothing_10','hot_streak','discover_first','discover_half','discover_all','double_rare','toggle_all','sure_max','slider_done','survived_dark','ultimate','speedrun'];

function achColor(r: AchievementRarity) {
  if (r === 'common')   return '#9ca3af';
  if (r === 'uncommon') return '#4ade80';
  if (r === 'rare')     return '#60a5fa';
  if (r === 'epic')     return '#a78bfa';
  return '#fbbf24';
}

function formatTime(ms: number) {
  const totalSecs = Math.floor(ms / 1000);
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  const mm = String(m).padStart(2, '0'), ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

// ─── Static data ──────────────────────────────────────────────────────────────

type PopupItem = { id: number; x: number; y: number; title: string };
const POPUP_TITLES = ["You've Won a Prize! 🎉","URGENT: Action Required","Congratulations! Claim Now","Your Computer Needs Help","Special Offer Just For You!","Important Security Alert","You Are The Lucky Winner!","Free Download Available","Limited Time Offer!!!","Click to Collect Reward 🏆"];
const makePopups = (n: number): PopupItem[] => Array.from({length:n},(_,i)=>({id:Date.now()+i+Math.random(),x:5+Math.random()*55,y:8+Math.random()*50,title:POPUP_TITLES[Math.floor(Math.random()*POPUP_TITLES.length)]}));

const CERT_TITLES = ['Distinguished Button Presser, First Class','Master of the Sacred Click','Eternal Champion of the Red Disc','Grand Presser of the Ancient Button','The One Who Dared to Press'];
const SURE_QS = [
  {q:'Are you sure you want to press the button?',sub:''},
  {q:'Are you REALLY sure?',sub:'Think carefully.'},
  {q:'This is your last chance.',sub:'Are you absolutely certain?'},
  {q:"I'm not kidding.",sub:'Once you proceed, there is no going back.'},
  {q:'OK but like…',sub:'Are you REALLY, TRULY, 100% sure about this?'},
];
const EXIST_PHRASES = ['am i real?','what is a button?','please don\'t','i feel nothing','do i exist?','not again…','why me?','…'];
const RAINBOW_COLS  = ['#ff0000','#ff7700','#ffee00','#00cc44','#1177ff','#9900dd'];

const INTRO_SLIDES = [
  {content:'🥁  🥁  🥁',                          sub:'drumroll…',                         big:true,  dur:800 },
  {content:'LADIES AND GENTLEMEN',                 sub:'please take your seats',             big:false, dur:1000},
  {content:'we interrupt your\nregularly scheduled programming', sub:null,                   big:false, dur:1000},
  {content:'TO BRING YOU',                         sub:null,                                 big:false, dur:700 },
  {content:'AN EVENT OF',                          sub:null,                                 big:false, dur:650 },
  {content:'TRULY ASTRONOMICAL\nPROPORTIONS',      sub:null,                                 big:false, dur:1000},
  {content:'🎺  🎺  🎺',                            sub:null,                                 big:true,  dur:700 },
  {content:'NEVER  GONNA\nGIVE  YOU  UP',          sub:'🎵',                                big:false, dur:1300},
];

// ─── Geometry ─────────────────────────────────────────────────────────────────
const CHROME_OUTER=280, CHROME_INNER=230, DISC=196, TRACK_W=300, THUMB_D=52;

// ─── ButtonShell (clones) ─────────────────────────────────────────────────────
function ButtonShell({onClick}:{onClick?:()=>void}) {
  return (
    <div style={{width:CHROME_OUTER,height:CHROME_OUTER,borderRadius:'50%',background:'#b2b2b2',boxShadow:'0 8px 32px rgba(0,0,0,0.45),inset 0 2px 4px rgba(255,255,255,0.4),inset 0 -3px 6px rgba(0,0,0,0.3)',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{width:CHROME_INNER,height:CHROME_INNER,borderRadius:'50%',background:'#686868',boxShadow:'inset 0 4px 10px rgba(0,0,0,0.55)',display:'flex',alignItems:'center',justifyContent:'center'}}>
        <button onClick={onClick} style={{width:DISC,height:DISC,borderRadius:'50%',background:'#cc1f1f',border:'none',cursor:onClick?'pointer':'default',outline:'none',boxShadow:'0 5px 14px rgba(0,0,0,0.35)',userSelect:'none'}} />
      </div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [locked, setLocked]   = useState(false);
  const unlock = useCallback(() => setLocked(false), []);

  // Set page title
  useEffect(() => { document.title = 'The Button'; }, []);

  // ── Press counter ─────────────────────────────────────────────────────────
  const [pressCount, setPressCount] = useState<number>(() => {
    try { return parseInt(localStorage.getItem('the-button-presses') || '0', 10); } catch { return 0; }
  });

  // ── Timer ─────────────────────────────────────────────────────────────────
  const [timerStart,   setTimerStart]   = useState<number|null>(() => {
    try { const s = localStorage.getItem('the-button-timer-start'); return s ? parseInt(s,10) : null; } catch { return null; }
  });
  const [timerStopped, setTimerStopped] = useState<number|null>(() => {
    try { const s = localStorage.getItem('the-button-timer-stop'); return s ? parseInt(s,10) : null; } catch { return null; }
  });
  const [timerDisplay, setTimerDisplay] = useState('00:00');

  // ── Achievements ──────────────────────────────────────────────────────────
  const [achievements, setAchievements] = useState<Set<string>>(() => {
    try { const s = localStorage.getItem('the-button-ach'); return s ? new Set(JSON.parse(s) as string[]) : new Set(); } catch { return new Set(); }
  });
  const [showAchPanel, setAchPanel]       = useState(false);
  const [achNotif, setAchNotif]           = useState<{name:string;icon:string;rarity:AchievementRarity}|null>(null);
  const [achNotifShow, setAchNotifShow]   = useState(false);
  const achNotifTimer                     = useRef<ReturnType<typeof setTimeout>>();
  const pendingAch                        = useRef<string[]>([]);

  // ── Streak refs ───────────────────────────────────────────────────────────
  const nothingStreak   = useRef(0);
  const eventStreak     = useRef(0);
  const lastEventWeight = useRef<number|null>(null);

  // ── Leaderboard / global counter ─────────────────────────────────────────
  type LBEntry = { nickname: string; time_ms: number; presses: number; date: string };
  const [globalCount,    setGlobalCount]    = useState<number|null>(null);
  const [achTab,         setAchTab]         = useState<'achievements'|'leaderboard'>('achievements');
  const [leaderboard,    setLeaderboard]    = useState<LBEntry[]>([]);
  const [ldFetching,     setLdFetching]     = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitNickname, setSubmitNickname] = useState('');
  const [submitState,    setSubmitState]    = useState<'idle'|'submitting'|'done'|'error'>('idle');
  const [alreadySubmitted, setAlreadySubmitted] = useState(() => {
    try { return localStorage.getItem('the-button-submitted') === '1'; } catch { return false; }
  });
  const [show67, setShow67] = useState(false);

  // Discovery
  const [discovered, setDiscovered] = useState<Set<EventKey>>(() => {
    try { const s=localStorage.getItem('the-button-disc'); return s?new Set(JSON.parse(s) as EventKey[]):new Set(); } catch { return new Set(); }
  });
  const markFound = useCallback((key: EventKey) => {
    setDiscovered(prev => {
      if (prev.has(key)) return prev;
      const next = new Set(prev); next.add(key);
      try { localStorage.setItem('the-button-disc', JSON.stringify([...next])); } catch {}
      return next;
    });
  }, []);

  // UI
  const [showSplash, setShowSplash] = useState(true);
  const [splashFade, setSplashFade] = useState(false);
  const [showPanel, setPanel]       = useState(false);
  const [isPressed, setIsPressed]   = useState(false);

  // Rickroll intro
  const [introStep, setIntroStep]   = useState(-1);

  // Event states
  const [showRickroll, setRickroll]     = useState(false);
  const [raining, setRaining]           = useState(false);
  const [rainEmojis, setRainEmojis]     = useState<{id:number;left:number;emoji:string;delay:number}[]>([]);
  const [flipped, setFlipped]           = useState(false);
  const [tiny, setTiny]                 = useState(false);
  const [runAway, setRunAway]           = useState(false);
  const [buttonPos, setButtonPos]       = useState({top:50,left:50});
  const isMoving                        = useRef(false);
  const [xpError, setXpError]           = useState(false);
  const [popups, setPopups]             = useState<PopupItem[]>([]);
  const popupsActive                    = useRef(false);
  const [growPhase, setGrowPhase]       = useState<'idle'|'growing'|'popping'>('idle');
  const [growMax, setGrowMax]           = useState(10);
  const [loadVisible, setLoad]          = useState(false);
  const [loadPct, setLoadPct]           = useState(0);
  const [loadCanQuit, setLoadCanQuit]   = useState(false);
  const [sureDepth, setSureDepth]       = useState(0);
  const [darken, setDarken]             = useState(false);
  const [clones, setClones]             = useState<{id:number;top:number;left:number}[]>([]);
  const [showCert, setShowCert]         = useState(false);
  const [certTitle, setCertTitle]       = useState('');
  const [sliderActive, setSlider]       = useState(false);
  const [sliderVal, setSliderVal]       = useState(0);
  const sliderDone                      = useRef(false);
  const [tiltPhase, setTiltPhase]       = useState<'idle'|'tilting'|'sliding'|'reset'|'returning'>('idle');
  const [countdownDisplay, setCountdown]= useState<string|null>(null);
  const [airhorn, setAirhorn]           = useState(false);
  const [existPhrase, setExistPhrase]   = useState('');
  const [existActive, setExistActive]   = useState(false);
  const [bruhItems, setBruhItems]       = useState<{id:number;x:number;y:number;size:number;rot:number;op:number;delay:number}[]>([]);

  // Passive/toggle
  const [inverted, setInverted]   = useState(false);
  const [pizzaCursor, setPizza]   = useState(false);
  const [invisible, setInvisible] = useState(false);
  const [rainbowMode, setRainbow] = useState(false);

  // Mouse
  const [mousePos, setMousePos]   = useState({x:-200,y:-200});
  type TrailPt = {id:number;x:number;y:number};
  const [trail, setTrail]         = useState<TrailPt[]>([]);
  const lastTrailT                = useRef(0);

  // Invert auto-revert timer
  const invertTimer = useRef<ReturnType<typeof setTimeout>>();

  // Slider drag
  const sliderTrackRef  = useRef<HTMLDivElement>(null);
  const isDragging      = useRef(false);

  // Notif
  const [notif, setNotif]         = useState<{name:string;rarity:string}|null>(null);
  const [notifShow, setNotifShow] = useState(false);
  const notifTimer                = useRef<ReturnType<typeof setTimeout>>();

  // ── Splash ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const t1 = setTimeout(() => setSplashFade(true), 2600);
    const t2 = setTimeout(() => setShowSplash(false), 3500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // ── Rickroll intro — advance steps + sounds ────────────────────────────────
  useEffect(() => {
    if (introStep === 0) sounds.drumroll(INTRO_SLIDES[0].dur / 1000);
    if (introStep === 6) sounds.fanfare();       // 🎺 труб труб slide
    if (introStep < 0 || introStep >= INTRO_SLIDES.length) return;
    const t = setTimeout(() => setIntroStep(s => s + 1), INTRO_SLIDES[introStep].dur);
    return () => clearTimeout(t);
  }, [introStep]);

  useEffect(() => {
    if (introStep === INTRO_SLIDES.length) { setIntroStep(-1); setRickroll(true); }
  }, [introStep]);

  // ── Existential phrase sound ────────────────────────────────────────────────
  useEffect(() => {
    if (existPhrase) sounds.existential();
  }, [existPhrase]);

  // ── Slider success sound ────────────────────────────────────────────────────
  useEffect(() => {
    if (sliderActive && sliderVal >= 100 && !sliderDone.current) {
      sliderDone.current = true;
      sounds.sliderSuccess();
      unlockAch('slider_done');
      setTimeout(() => { setSlider(false); setSliderVal(0); sliderDone.current = false; unlock(); }, 350);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sliderVal, sliderActive, unlock]);

  // ── Cursor ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    document.body.style.cursor = (pizzaCursor || invisible) ? 'none' : '';
    return () => { document.body.style.cursor = ''; };
  }, [pizzaCursor, invisible]);

  // ── Global mouse ───────────────────────────────────────────────────────────
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      setMousePos({x:e.clientX,y:e.clientY});
      if (rainbowMode) {
        const now = Date.now();
        if (now - lastTrailT.current >= 25) {
          lastTrailT.current = now;
          setTrail(prev => [...prev.slice(-45), {id:now+Math.random(),x:e.clientX,y:e.clientY}]);
        }
      }
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, [rainbowMode]);

  useEffect(() => {
    if (!rainbowMode) { setTrail([]); return; }
    const id = setInterval(() => { const cut=Date.now()-600; setTrail(prev=>prev.filter(p=>p.id>cut)); }, 40);
    return () => clearInterval(id);
  }, [rainbowMode]);

  // ── Slider drag ────────────────────────────────────────────────────────────
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isDragging.current || !sliderTrackRef.current) return;
      const r = sliderTrackRef.current.getBoundingClientRect();
      setSliderVal(Math.max(0, Math.min(100, (e.clientX-r.left-THUMB_D/2)/(TRACK_W-THUMB_D)*100)));
    };
    const onUp = () => { isDragging.current = false; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, []);

  // ── Loading bar ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!loadVisible) { setLoadPct(0); setLoadCanQuit(false); return; }
    const iv = setInterval(() => setLoadPct(prev => prev>=99?(clearInterval(iv),99):Math.min(99,prev+Math.max(0.04,(99-prev)*0.038))), 80);
    const qt = setTimeout(() => setLoadCanQuit(true), 6500);
    return () => { clearInterval(iv); clearTimeout(qt); };
  }, [loadVisible]);

  // ── Popups unlock ─────────────────────���────────────────────────────────────
  useEffect(() => {
    if (popupsActive.current && popups.length === 0) { popupsActive.current=false; unlock(); }
  }, [popups, unlock]);

  // ── startTimer ────────────────────────────────────────────────────────────
  const startTimer = useCallback(() => {
    setTimerStart(prev => {
      if (prev !== null) return prev;
      const t = Date.now();
      try { localStorage.setItem('the-button-timer-start', String(t)); } catch {}
      return t;
    });
  }, []);

  // ── unlockAch ─────────────────────────────────────────────────────────────
  const unlockAch = useCallback((key: string) => {
    setAchievements(prev => {
      if (prev.has(key)) return prev;
      const next = new Set(prev); next.add(key);
      try { localStorage.setItem('the-button-ach', JSON.stringify([...next])); } catch {}
      pendingAch.current.push(key);
      return next;
    });
  }, []);

  // ── Fetch global counter on mount ────────────────────────────────────────
  useEffect(() => {
    fetch(`${API}/counter`, { headers: HEADERS })
      .then(r => r.json())
      .then(d => { if (typeof d.total === 'number') setGlobalCount(d.total); })
      .catch(err => console.log('Counter fetch error:', err));
  }, []);

  // ── Fetch leaderboard when tab opens ─────────────────────────────────────
  const fetchLeaderboard = useCallback(async () => {
    setLdFetching(true);
    try {
      const r = await fetch(`${API}/leaderboard`, { headers: HEADERS });
      const d = await r.json();
      if (Array.isArray(d.entries)) setLeaderboard(d.entries);
    } catch (err) {
      console.log('Leaderboard fetch error:', err);
    } finally {
      setLdFetching(false);
    }
  }, []);

  useEffect(() => {
    if (achTab === 'leaderboard' && showAchPanel) fetchLeaderboard();
  }, [achTab, showAchPanel, fetchLeaderboard]);

  // ── Nickname validation (mirrors server-side whitelist) ──────────────────
  const NICK_ALLOWED = /^[\p{L}\p{N} _.\-!?]+$/u;
  const nickValid   = submitNickname.trim().length > 0 && NICK_ALLOWED.test(submitNickname.trim());
  const nickInvalid = submitNickname.trim().length > 0 && !nickValid;

  // ── Submit leaderboard entry ──────────────────────────────────────────────
  const submitToLeaderboard = useCallback(async () => {
    if (!submitNickname.trim() || timerStart === null || timerStopped === null) return;
    setSubmitState('submitting');
    try {
      const r = await fetch(`${API}/leaderboard`, {
        method: 'POST', headers: HEADERS,
        body: JSON.stringify({ nickname: submitNickname.trim(), time_ms: timerStopped - timerStart, presses: pressCount }),
      });
      const d = await r.json();
      if (d.success) {
        setSubmitState('done');
        setAlreadySubmitted(true);
        try { localStorage.setItem('the-button-submitted', '1'); } catch {}
        setTimeout(() => setShowSubmitModal(false), 1200);
      } else {
        console.log('Leaderboard submit error response:', d);
        setSubmitState('error');
      }
    } catch (err) {
      console.log('Leaderboard submit exception:', err);
      setSubmitState('error');
    }
  }, [submitNickname, timerStart, timerStopped, pressCount]);

  // ── Timer display ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (timerStart === null) return;
    const update = () => {
      const elapsed = (timerStopped ?? Date.now()) - timerStart;
      const totalSecs = Math.floor(elapsed / 1000);
      const h = Math.floor(totalSecs / 3600);
      const m = Math.floor((totalSecs % 3600) / 60);
      const s = totalSecs % 60;
      const mm = String(m).padStart(2,'0'), ss = String(s).padStart(2,'0');
      setTimerDisplay(h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`);
    };
    update();
    if (timerStopped !== null) return;
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [timerStart, timerStopped]);

  // ── Stop timer + speedrun check when all discovered ───────────────────────
  useEffect(() => {
    if (discovered.size < EVENT_ORDER.length || timerStart === null || timerStopped !== null) return;
    const stopTime = Date.now();
    setTimerStopped(stopTime);
    try { localStorage.setItem('the-button-timer-stop', String(stopTime)); } catch {}
    if (stopTime - timerStart < 30 * 60 * 1000) unlockAch('speedrun');
    unlockAch('discover_all');
    // Show leaderboard submission modal if not already submitted
    if (localStorage.getItem('the-button-submitted') !== '1') setShowSubmitModal(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [discovered.size]);

  // ── Discovery achievements ────────────────────────────────────────────────
  useEffect(() => {
    if (discovered.size >= 1)  unlockAch('discover_first');
    if (discovered.size >= 12) unlockAch('discover_half');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [discovered.size]);

  // ── Toggle-all achievement ────────────────────────────────────────────────
  useEffect(() => {
    if (inverted && pizzaCursor && rainbowMode) unlockAch('toggle_all');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inverted, pizzaCursor, rainbowMode]);

  // ── Sure-depth achievement ────────────────────────────────────────────────
  useEffect(() => {
    if (sureDepth >= 5) unlockAch('sure_max');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sureDepth]);

  // ── Achievement notification trigger ─────────────────────────────────────
  useEffect(() => {
    if (pendingAch.current.length === 0) return;
    const keys: string[] = [];
    while (pendingAch.current.length > 0) keys.push(pendingAch.current.shift()!);
    const rarityRank: Record<AchievementRarity,number> = { common:0, uncommon:1, rare:2, epic:3, legendary:4 };
    keys.sort((a,b) => rarityRank[(ACHIEVEMENTS[b]?.rarity??'common')] - rarityRank[(ACHIEVEMENTS[a]?.rarity??'common')]);
    const ach = ACHIEVEMENTS[keys[0]];
    if (!ach) return;
    sounds.achievement();
    if (achNotifTimer.current) clearTimeout(achNotifTimer.current);
    setAchNotif({name:ach.name, icon:ach.icon, rarity:ach.rarity});
    setAchNotifShow(true);
    achNotifTimer.current = setTimeout(() => setAchNotifShow(false), 4000);
  }, [achievements]);

  // ── Notification ───────────────────────────────────────────────────────────
  const triggerNotif = useCallback((name:string, rarity:string) => {
    if (notifTimer.current) clearTimeout(notifTimer.current);
    setNotif({name,rarity}); setNotifShow(true);
    notifTimer.current = setTimeout(() => setNotifShow(false), 3800);
  }, []);

  // ── Pointer ────────────────────────────────────────────────────────────────
  const handlePointerDown = () => setIsPressed(true);
  const handlePointerUp   = () => setIsPressed(false);

  // ── Main click ────────────────────────────────────────────────────────────
  const handleClick = () => {
    if (locked) return;
    sounds.click();
    setLocked(true);

    // Press counter & achievements
    const newCount = pressCount + 1;
    setPressCount(newCount);
    try { localStorage.setItem('the-button-presses', String(newCount)); } catch {}
    // Fire-and-forget global counter
    fetch(`${API}/press`, { method: 'POST', headers: HEADERS })
      .then(r => r.json())
      .then(d => { if (typeof d.total === 'number') setGlobalCount(d.total); })
      .catch(err => console.log('Global press error:', err));
    if (newCount === 1)        { startTimer(); unlockAch('first_press'); }
    else if (newCount === 10)  unlockAch('press_10');
    else if (newCount === 50)  unlockAch('press_50');
    else if (newCount === 67)  { sounds.sixty7(); setShow67(true); setTimeout(() => setShow67(false), 2600); unlockAch('press_67'); }
    else if (newCount === 100) unlockAch('press_100');
    else if (newCount === 500) unlockAch('press_500');

    const key = pickEvent();
    const ev  = EVENTS[key];

    if (key === 'nothing') {
      nothingStreak.current++;
      eventStreak.current = 0;
      lastEventWeight.current = null;
      if (nothingStreak.current >= 5)  unlockAch('nothing_5');
      if (nothingStreak.current >= 10) unlockAch('nothing_10');
      setTimeout(unlock, 500); return;
    }

    nothingStreak.current = 0;
    eventStreak.current++;
    if (eventStreak.current >= 5) unlockAch('hot_streak');
    const w = ev.weight;
    if (lastEventWeight.current !== null && lastEventWeight.current <= 30 && w <= 30) unlockAch('double_rare');
    lastEventWeight.current = w;

    if (ev.name) triggerNotif(ev.name, ev.rarity!);
    markFound(key);

    switch (key) {
      case 'pizza':
        sounds.pizzaDing();
        setPizza(p=>!p); unlock(); break;

      case 'invert':
        sounds.pop(380);
        if (invertTimer.current) clearTimeout(invertTimer.current);
        if (!inverted) {
          // turning ON — auto-revert after 10 s
          invertTimer.current = setTimeout(() => setInverted(false), 10000);
        }
        setInverted(p=>!p); unlock(); break;

      case 'rainbow':
        sounds.sparkle();
        setRainbow(p=>!p); unlock(); break;

      case 'rickroll':
        setIntroStep(0);
        unlockAch('ultimate');
        break;

      case 'raining':
        sounds.rain();
        setRaining(true);
        setRainEmojis(Array.from({length:50},(_,i)=>({id:i,left:Math.random()*100,emoji:Math.random()>.5?'🐱':'🐶',delay:Math.random()*2})));
        setTimeout(()=>{setRaining(false);setRainEmojis([]);unlock();},3800);
        break;

      case 'flip':
        sounds.whoosh();
        setFlipped(true); setTimeout(()=>{sounds.whoosh();setFlipped(false);unlock();},5000); break;

      case 'tiny':
        sounds.shrink();
        setTiny(true); setTimeout(()=>{setTiny(false);unlock();},4000); break;

      case 'runaway':
        sounds.whoosh();
        setRunAway(true);
        setTimeout(()=>{setRunAway(false);isMoving.current=false;unlock();},10000); break;

      case 'xperror':
        sounds.xpError();
        setXpError(true); break;

      case 'popups':
        sounds.pop(450);
        popupsActive.current=true; setPopups(makePopups(6)); break;

      case 'grow':
        sounds.grow(); {
          const s = Math.ceil(Math.hypot(window.innerWidth,window.innerHeight)/DISC*1.2);
          setGrowMax(s); setGrowPhase('growing');
          setTimeout(()=>{setGrowPhase('popping');setTimeout(()=>{setGrowPhase('idle');unlock();},220);},2700);
        } break;

      case 'loading': setLoad(true); break;

      case 'sure': sounds.sure(1); setSureDepth(1); break;

      case 'darken':
        sounds.darken();
        setDarken(true); setTimeout(()=>{setDarken(false); unlockAch('survived_dark'); unlock();},4000); break;

      case 'clones': {
        const spawned:{id:number;top:number;left:number}[]=[];
        let cnt=0;
        const iv=setInterval(()=>{
          cnt++;
          sounds.clonePop();
          spawned.push({id:Date.now(),top:10+Math.random()*75,left:10+Math.random()*75});
          setClones([...spawned]);
          if(cnt>=8)clearInterval(iv);
        },900);
        setTimeout(()=>{setClones([]);unlock();},11000);
        break;
      }

      case 'invisible':
        sounds.shimmer();
        setInvisible(true); setTimeout(()=>{sounds.shimmer();setInvisible(false);unlock();},5000); break;

      case 'certificate':
        sounds.fanfare();
        setCertTitle(CERT_TITLES[Math.floor(Math.random()*CERT_TITLES.length)]); setShowCert(true); break;

      case 'slider':
        sounds.pop(300);
        setSliderVal(0); setSlider(true); break;

      case 'bruh':
        sounds.bruh(); {
          const items = Array.from({length:28},(_,i)=>({id:i,x:Math.random()*92,y:Math.random()*92,size:14+Math.random()*34,rot:(Math.random()-.5)*50,op:.35+Math.random()*.6,delay:Math.floor(Math.random()*6)*50}));
          setBruhItems(items);
          setTimeout(()=>{setBruhItems([]);unlock();},4200);
        } break;

      case 'existential': {
        setExistActive(true);
        setExistPhrase(EXIST_PHRASES[0]);
        let idx=0;
        const iv=setInterval(()=>{idx=(idx+1)%EXIST_PHRASES.length;setExistPhrase(EXIST_PHRASES[idx]);},1200);
        setTimeout(()=>{clearInterval(iv);setExistActive(false);setExistPhrase('');unlock();},EXIST_PHRASES.length*1200+400);
        break;
      }

      case 'airhorn':
        sounds.airhorn();
        setAirhorn(true); setTimeout(()=>{setAirhorn(false);unlock();},3200); break;

      case 'tilt':
        sounds.tiltFall();
        setTiltPhase('tilting');
        setTimeout(()=>setTiltPhase('sliding'),380);
        setTimeout(()=>setTiltPhase('reset'),1550);
        setTimeout(()=>setTiltPhase('returning'),1610);
        setTimeout(()=>{setTiltPhase('idle');unlock();},2250); break;

      case 'countdown': {
        let num=10; setCountdown('10');
        sounds.countdownTick();
        const iv=setInterval(()=>{
          num--;
          if(num<0){
            clearInterval(iv);
            sounds.countdownEnd();
            setCountdown('…');
            setTimeout(()=>{setCountdown('…nothing happened.');setTimeout(()=>{setCountdown(null);unlock();},2200);},1400);
          } else {
            sounds.countdownTick(num===0);
            setCountdown(String(num));
          }
        },750);
        break;
      }
    }
  };

  // ── Escape artist ──────────────────────────────────────────────────────────
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!runAway || isMoving.current) return;
    const el=document.getElementById('main-button'); if(!el) return;
    const r=el.getBoundingClientRect();
    const cx=r.left+r.width/2, cy=r.top+r.height/2;
    if (Math.hypot(e.clientX-cx,e.clientY-cy)>=220) return;
    sounds.whoosh();
    const dx=cx-e.clientX, dy=cy-e.clientY, len=Math.hypot(dx,dy)||1;
    const nx=dx/len, ny=dy/len;
    const vw=window.innerWidth, vh=window.innerHeight;
    const curLeft=(cx/vw)*100, curTop=(cy/vh)*100;
    const step=28+Math.random()*8;
    let newLeft=curLeft+nx*step+(Math.random()-.5)*12;
    let newTop=curTop+ny*step+(Math.random()-.5)*12;
    const hB=newLeft<14||newLeft>86, vB=newTop<14||newTop>86;
    if(hB&&vB){newLeft=e.clientX/vw*100>50?15+Math.random()*22:63+Math.random()*22;newTop=e.clientY/vh*100>50?15+Math.random()*22:63+Math.random()*22;}
    else if(hB){newLeft=curLeft;newTop=curTop+(ny||(Math.random()>.5?1:-1))*step*1.4;}
    else if(vB){newTop=curTop;newLeft=curLeft+(nx||(Math.random()>.5?1:-1))*step*1.4;}
    newLeft=Math.max(14,Math.min(86,newLeft)); newTop=Math.max(14,Math.min(86,newTop));
    isMoving.current=true; setButtonPos({top:newTop,left:newLeft});
    setTimeout(()=>{isMoving.current=false;},270);
  }, [runAway]);

  useEffect(()=>{if(!runAway){isMoving.current=false;setButtonPos({top:50,left:50});}}, [runAway]);

  // ── Scale ──────────────────────────────────────────────────────────────────
  const buttonScale = tiny?0.04:growPhase==='growing'?growMax:growPhase==='popping'?0:1;
  const scaleTrans  = tiny?'transform 0.5s cubic-bezier(0.34,1.3,0.64,1)':growPhase==='growing'?'transform 2.6s cubic-bezier(0.1,0,0.5,1)':growPhase==='popping'?'transform 0.18s ease-in':'transform 0.5s cubic-bezier(0.34,1.3,0.64,1)';

  // ── Page transform (flip + tilt) ───────────────────────────────────────────
  const flipT = flipped?'rotate(180deg)':'';
  const tiltT = tiltPhase==='tilting'?'rotate(15deg)':tiltPhase==='sliding'?'rotate(20deg) translateY(120vh)':tiltPhase==='reset'?'translateY(-130vh) rotate(-8deg)':'';
  const pageTransform=[flipT,tiltT].filter(Boolean).join(' ')||'none';
  const pageTrans=tiltPhase==='tilting'?'transform 0.35s ease':tiltPhase==='sliding'?'transform 1.1s cubic-bezier(0.4,0,0.8,1)':tiltPhase==='reset'?'none':tiltPhase==='returning'?'transform 0.5s cubic-bezier(0.34,1.2,0.64,1)':'transform 0.6s cubic-bezier(0.4,0,0.2,1)';

  // Slider geometry
  const thumbX=(sliderVal/100)*(TRACK_W-THUMB_D);
  const fillW=thumbX+THUMB_D/2;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="size-full bg-white flex items-center justify-center relative overflow-hidden"
      style={{transform:pageTransform,transition:pageTrans,filter:inverted?'invert(1)':'none'}}
      onMouseMove={handleMouseMove}
    >

      {/* ── Watermark ──────────────────────────────────────────────────── */}
      <div style={{position:'fixed',bottom:14,right:18,display:'flex',alignItems:'center',gap:8,zIndex:1,userSelect:'none'}}>
        <a href="https://www.instagram.com/fowiohuu" target="_blank" rel="noopener noreferrer"
          style={{color:'rgba(0,0,0,0.22)',display:'flex',alignItems:'center',transition:'color 0.2s'}}
          onMouseEnter={e=>(e.currentTarget.style.color='rgba(0,0,0,0.6)')}
          onMouseLeave={e=>(e.currentTarget.style.color='rgba(0,0,0,0.22)')}>
          <Instagram size={13} strokeWidth={1.6}/>
        </a>
        <a href="https://www.linkedin.com/in/man-huu-241a42396/" target="_blank" rel="noopener noreferrer"
          style={{color:'rgba(0,0,0,0.22)',display:'flex',alignItems:'center',transition:'color 0.2s'}}
          onMouseEnter={e=>(e.currentTarget.style.color='rgba(0,0,0,0.6)')}
          onMouseLeave={e=>(e.currentTarget.style.color='rgba(0,0,0,0.22)')}>
          <Linkedin size={13} strokeWidth={1.6}/>
        </a>
        <span style={{fontSize:11,fontFamily:'monospace',color:'rgba(0,0,0,0.18)',letterSpacing:'0.06em',pointerEvents:'none'}}>fowiohuu</span>
      </div>

      {/* ── Discovery panel toggle ─────────────────────────────────────── */}
      <button onClick={()=>setPanel(p=>!p)} style={{position:'fixed',top:16,left:16,zIndex:1100,background:'rgba(255,255,255,0.92)',border:'1px solid rgba(0,0,0,0.1)',borderRadius:10,padding:'7px 12px',cursor:'pointer',fontFamily:'monospace',fontSize:12,color:'#444',boxShadow:'0 2px 8px rgba(0,0,0,0.08)',display:'flex',alignItems:'center',gap:6,backdropFilter:'blur(8px)'}}>
        <span>📋</span><span>{discovered.size}/{EVENT_ORDER.length}</span>
      </button>

      {/* ── Achievement panel toggle ────────────────────────────────────── */}
      <button onClick={()=>setAchPanel(p=>!p)} style={{position:'fixed',top:16,right:16,zIndex:1100,background:'rgba(255,255,255,0.92)',border:'1px solid rgba(0,0,0,0.1)',borderRadius:10,padding:'7px 12px',cursor:'pointer',fontFamily:'monospace',fontSize:12,color:'#444',boxShadow:'0 2px 8px rgba(0,0,0,0.08)',display:'flex',alignItems:'center',gap:6,backdropFilter:'blur(8px)'}}>
        <span>🏆</span><span>{achievements.size}/{ACH_ORDER.length}</span>
      </button>

      {/* ── Timer + press counter (top centre) ─────────────────────────── */}
      <div style={{position:'fixed',top:16,left:'50%',transform:'translateX(-50%)',zIndex:100,display:'flex',flexDirection:'column',alignItems:'center',gap:2,pointerEvents:'none',userSelect:'none'}}>
        <div style={{fontFamily:'monospace',fontSize:13,color:timerStopped?'#22c55e':'#aaa',letterSpacing:'0.08em',transition:'color 0.5s'}}>
          {timerStart ? (timerStopped?'✓ ':'') + timerDisplay : '--:--'}
        </div>
        <div style={{fontFamily:'monospace',fontSize:10,color:'#ccc',letterSpacing:'0.04em'}}>
          {pressCount.toLocaleString()} local&nbsp;·&nbsp;{globalCount !== null ? globalCount.toLocaleString() : '…'} worldwide
        </div>
      </div>

      {/* ── Discovery panel ────────────────────────────────────────────── */}
      <div style={{position:'fixed',top:0,left:showPanel?0:-300,bottom:0,width:280,background:'rgba(255,255,255,0.97)',boxShadow:'4px 0 30px rgba(0,0,0,0.12)',zIndex:1050,transition:'left 0.3s cubic-bezier(0.4,0,0.2,1)',display:'flex',flexDirection:'column',overflow:'hidden'}}>
        <div style={{padding:'20px 18px 14px',borderBottom:'1px solid #f0f0f0'}}>
          <div style={{fontFamily:'monospace',fontSize:10,color:'#bbb',letterSpacing:'0.14em',textTransform:'uppercase',marginBottom:8}}>Event Log</div>
          <div style={{fontFamily:'monospace',fontSize:13,color:'#333',marginBottom:8}}>{discovered.size} / {EVENT_ORDER.length} discovered</div>
          <div style={{background:'#e5e7eb',borderRadius:999,height:6}}>
            <div style={{width:`${(discovered.size/EVENT_ORDER.length)*100}%`,background:'#cc1f1f',height:'100%',borderRadius:999,transition:'width 0.4s ease'}}/>
          </div>
        </div>
        <div style={{overflowY:'auto',flex:1,padding:'10px 12px'}}>
          {EVENT_ORDER.map(key => {
            const ev=EVENTS[key]; const found=discovered.has(key); const isUlt=key==='rickroll';
            return (
              <div key={key} style={{display:'flex',alignItems:'center',gap:10,padding:'7px 8px',borderRadius:8,background:found?'rgba(0,0,0,0.03)':'transparent',opacity:found?1:0.3,transition:'opacity 0.4s ease'}}>
                <div style={{width:8,height:8,borderRadius:'50%',background:found?tierColor(ev.weight):'#d1d5db',flexShrink:0,boxShadow:found?`0 0 6px ${tierColor(ev.weight)}60`:'none',transition:'all 0.4s ease'}}/>
                <div style={{flex:1,fontFamily:'monospace',fontSize:11,color:'#111',lineHeight:1.3}}>{isUlt&&!found?'???':ev.name}</div>
                <div style={{fontFamily:'monospace',fontSize:10,color:'#9ca3af',whiteSpace:'nowrap'}}>{isUlt&&!found?'???':ev.rarity}</div>
              </div>
            );
          })}
        </div>
        <div style={{padding:'12px 18px',borderTop:'1px solid #f0f0f0'}}>
          <div style={{fontFamily:'monospace',fontSize:10,color:'#ccc',letterSpacing:'0.06em',textAlign:'center'}}>find the ultimate event</div>
        </div>
      </div>
      {showPanel&&<div onClick={()=>setPanel(false)} style={{position:'fixed',inset:0,zIndex:1049}}/>}

      {/* ── Achievement / Leaderboard panel ────────────────────────────── */}
      <div style={{position:'fixed',top:0,right:showAchPanel?0:-300,bottom:0,width:280,background:'rgba(255,255,255,0.97)',boxShadow:'-4px 0 30px rgba(0,0,0,0.12)',zIndex:1050,transition:'right 0.3s cubic-bezier(0.4,0,0.2,1)',display:'flex',flexDirection:'column',overflow:'hidden'}}>
        {/* Tab bar */}
        <div style={{padding:'14px 12px 0',borderBottom:'1px solid #f0f0f0'}}>
          <div style={{display:'flex',gap:4,marginBottom:12}}>
            {(['achievements','leaderboard'] as const).map(tab => (
              <button key={tab} onClick={()=>setAchTab(tab)} style={{flex:1,padding:'7px 4px',background:achTab===tab?'#f4f4f4':'transparent',border:'none',borderRadius:7,cursor:'pointer',fontFamily:'monospace',fontSize:10,color:achTab===tab?'#111':'#999',fontWeight:achTab===tab?700:400,letterSpacing:'0.04em',transition:'all 0.15s'}}>
                {tab==='achievements'?'🏆 Achievements':'🌍 Leaderboard'}
              </button>
            ))}
          </div>
          {achTab==='achievements'&&(
            <>
              <div style={{fontFamily:'monospace',fontSize:12,color:'#444',marginBottom:8}}>{achievements.size} / {ACH_ORDER.length} unlocked</div>
              <div style={{background:'#e5e7eb',borderRadius:999,height:5,marginBottom:14}}>
                <div style={{width:`${(achievements.size/ACH_ORDER.length)*100}%`,background:'#fbbf24',height:'100%',borderRadius:999,transition:'width 0.4s ease'}}/>
              </div>
            </>
          )}
          {achTab==='leaderboard'&&(
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
              <div style={{fontFamily:'monospace',fontSize:10,color:'#bbb',letterSpacing:'0.1em',textTransform:'uppercase'}}>Fastest completions</div>
              <button onClick={fetchLeaderboard} disabled={ldFetching} style={{background:'none',border:'none',cursor:'pointer',fontFamily:'monospace',fontSize:10,color:'#aaa',padding:'2px 6px',borderRadius:4}} title="Refresh">↺</button>
            </div>
          )}
        </div>

        {/* Achievements tab */}
        {achTab==='achievements'&&(
          <div style={{overflowY:'auto',flex:1,padding:'8px 12px'}}>
            {ACH_ORDER.map(key => {
              const ach = ACHIEVEMENTS[key]; const found = achievements.has(key);
              return (
                <div key={key} style={{display:'flex',alignItems:'flex-start',gap:10,padding:'8px',borderRadius:8,background:found?'rgba(0,0,0,0.03)':'transparent',opacity:found?1:0.3,transition:'opacity 0.4s ease',marginBottom:2}}>
                  <div style={{fontSize:19,lineHeight:1,flexShrink:0,marginTop:2,filter:found?'none':'grayscale(1)'}}>{ach.icon}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:2}}>
                      <div style={{fontFamily:'monospace',fontSize:11,color:'#111',fontWeight:600}}>{found?ach.name:'???'}</div>
                      <div style={{width:6,height:6,borderRadius:'50%',background:found?achColor(ach.rarity):'#d1d5db',flexShrink:0,boxShadow:found?`0 0 5px ${achColor(ach.rarity)}80`:'none'}}/>
                    </div>
                    <div style={{fontFamily:'monospace',fontSize:10,color:'#888',lineHeight:1.4}}>{found?ach.desc:'Keep pressing…'}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Leaderboard tab */}
        {achTab==='leaderboard'&&(
          <div style={{overflowY:'auto',flex:1,padding:'10px 12px'}}>
            {ldFetching?(
              <div style={{textAlign:'center',color:'#bbb',fontFamily:'monospace',fontSize:11,paddingTop:50}}>Loading…</div>
            ):leaderboard.length===0?(
              <div style={{textAlign:'center',color:'#bbb',fontFamily:'monospace',fontSize:11,paddingTop:50,lineHeight:1.8}}>No entries yet.<br/>Be the first!</div>
            ):leaderboard.map((entry,i)=>(
              <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'9px 8px',borderRadius:8,background:i===0?'rgba(251,191,36,0.08)':i===1?'rgba(148,163,184,0.07)':i===2?'rgba(180,116,50,0.07)':'transparent',marginBottom:4}}>
                <div style={{fontFamily:'monospace',fontSize:15,width:22,textAlign:'center',flexShrink:0}}>{i===0?'🥇':i===1?'🥈':i===2?'🥉':`${i+1}.`}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontFamily:'monospace',fontSize:12,color:'#111',fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{entry.nickname}</div>
                  <div style={{fontFamily:'monospace',fontSize:10,color:'#aaa'}}>{entry.presses.toLocaleString()} presses</div>
                </div>
                <div style={{fontFamily:'monospace',fontSize:12,color:'#555',flexShrink:0,letterSpacing:'0.04em'}}>{formatTime(entry.time_ms)}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{padding:'10px 18px',borderTop:'1px solid #f0f0f0'}}>
          {achTab==='achievements'?(
            <div style={{fontFamily:'monospace',fontSize:10,color:'#ccc',letterSpacing:'0.06em',textAlign:'center'}}>
              {achievements.size===ACH_ORDER.length?'🎉 all achievements unlocked!':`${ACH_ORDER.length-achievements.size} remaining`}
            </div>
          ):(
            <div style={{fontFamily:'monospace',fontSize:10,color:'#ccc',textAlign:'center'}}>
              {globalCount!==null?`${globalCount.toLocaleString()} total presses worldwide`:'worldwide stats loading…'}
            </div>
          )}
        </div>
      </div>
      {showAchPanel&&<div onClick={()=>setAchPanel(false)} style={{position:'fixed',inset:0,zIndex:1049}}/>}

      {/* ── 67 easter egg overlay ──────────────────────────────────────── */}
      <style>{`
        @keyframes pop67 {
          0%   { transform: translate(-50%, -50%) scale(0.2); opacity: 0; }
          12%  { transform: translate(-50%, -50%) scale(1.18); opacity: 1; }
          22%  { transform: translate(-50%, -50%) scale(0.94); }
          32%  { transform: translate(-50%, -50%) scale(1.0); }
          72%  { transform: translate(-50%, -50%) scale(1.0); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(1.0); opacity: 0; }
        }
      `}</style>
      {show67&&(
        <div style={{position:'fixed',inset:0,zIndex:1550,background:'rgba(0,0,0,0.78)',pointerEvents:'none'}}>
          <div style={{position:'absolute',top:'50%',left:'50%',animation:'pop67 2.6s cubic-bezier(0.22,1,0.36,1) forwards',fontFamily:'monospace',fontWeight:900,fontSize:'30vw',color:'#fff',lineHeight:1,letterSpacing:'-0.04em',textShadow:'0 0 60px rgba(255,40,40,0.9), 0 0 120px rgba(255,40,40,0.5)',userSelect:'none',whiteSpace:'nowrap'}}>
            67
          </div>
        </div>
      )}

      {/* ── Leaderboard submission modal ───────────────────────────────── */}
      {showSubmitModal&&!alreadySubmitted&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.55)',zIndex:1600,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
          <div style={{background:'#fff',borderRadius:18,padding:32,width:'100%',maxWidth:320,boxShadow:'0 24px 64px rgba(0,0,0,0.35)',textAlign:'center'}}>
            <div style={{fontSize:44,marginBottom:10}}>🎉</div>
            <div style={{fontFamily:'monospace',fontSize:16,fontWeight:700,color:'#111',marginBottom:4}}>All 23 events found!</div>
            {timerStart!==null&&timerStopped!==null&&(
              <div style={{fontFamily:'monospace',fontSize:13,color:'#888',marginBottom:20}}>
                Time: <strong style={{color:'#22c55e'}}>{formatTime(timerStopped-timerStart)}</strong> · {pressCount.toLocaleString()} presses
              </div>
            )}
            <div style={{fontFamily:'monospace',fontSize:11,color:'#aaa',marginBottom:12}}>Submit to the worldwide leaderboard?</div>
            <input
              value={submitNickname}
              onChange={e=>setSubmitNickname(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&nickValid&&submitToLeaderboard()}
              placeholder="Your nickname (max 20 chars)"
              maxLength={20}
              style={{width:'100%',padding:'10px 12px',border:`1.5px solid ${nickInvalid?'#cc1f1f':'#e5e7eb'}`,borderRadius:9,fontFamily:'monospace',fontSize:13,outline:'none',boxSizing:'border-box',marginBottom:4,textAlign:'center',transition:'border-color 0.15s'}}
            />
            <div style={{fontFamily:'monospace',fontSize:10,marginBottom:10,minHeight:14,textAlign:'center',color:nickInvalid?'#cc1f1f':'transparent'}}>
              {nickInvalid?'Only letters, numbers, spaces, and . - _ ! ? are allowed':'‎'}
            </div>
            {submitState==='done'&&<div style={{fontFamily:'monospace',fontSize:11,color:'#22c55e',marginBottom:8}}>✓ Score submitted!</div>}
            {submitState==='error'&&<div style={{fontFamily:'monospace',fontSize:11,color:'#cc1f1f',marginBottom:8}}>Submission failed — try again.</div>}
            <div style={{display:'flex',gap:8}}>
              <button onClick={()=>{setShowSubmitModal(false);setAlreadySubmitted(true);try{localStorage.setItem('the-button-submitted','1')}catch{}}} style={{flex:1,padding:'10px',background:'transparent',border:'1.5px solid #e5e7eb',borderRadius:9,cursor:'pointer',fontFamily:'monospace',fontSize:12,color:'#aaa'}}>Skip</button>
              <button onClick={submitToLeaderboard} disabled={!nickValid||submitState==='submitting'||submitState==='done'} style={{flex:2,padding:'10px',background:'#cc1f1f',border:'none',borderRadius:9,cursor:!nickValid||submitState==='submitting'?'not-allowed':'pointer',fontFamily:'monospace',fontSize:12,color:'#fff',fontWeight:700,opacity:!nickValid||submitState==='submitting'?0.5:1,transition:'opacity 0.2s'}}>
                {submitState==='submitting'?'Submitting…':submitState==='done'?'Submitted ✓':'Submit Score'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Achievement notification (bottom-left) ──────────────────────── */}
      <div style={{position:'fixed',bottom:24,left:0,transform:`translateX(${achNotifShow?'16px':'-340px'})`,transition:'transform 0.45s cubic-bezier(0.34,1.3,0.64,1)',zIndex:1300,pointerEvents:'none'}}>
        {achNotif&&(
          <div style={{background:'#12100a',border:`1px solid ${achColor(achNotif.rarity)}40`,borderLeft:`3px solid ${achColor(achNotif.rarity)}`,borderRadius:12,padding:'12px 18px',display:'flex',alignItems:'center',gap:12,boxShadow:'0 8px 32px rgba(0,0,0,0.45)',minWidth:260,maxWidth:300}}>
            <span style={{fontSize:26,lineHeight:1,flexShrink:0}}>{achNotif.icon}</span>
            <div>
              <div style={{fontFamily:'monospace',fontSize:9,color:achColor(achNotif.rarity),letterSpacing:'0.16em',textTransform:'uppercase',marginBottom:3}}>Achievement Unlocked</div>
              <div style={{fontSize:13,fontWeight:700,color:'#fff',lineHeight:1.2}}>{achNotif.name}</div>
            </div>
          </div>
        )}
      </div>

      {/* ── Splash ─────────────────────────────────────────────────────── */}
      {showSplash&&(
        <div onClick={()=>{setSplashFade(true);setTimeout(()=>setShowSplash(false),700);}}
          style={{position:'fixed',inset:0,background:'#fff',zIndex:9999,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:8,cursor:'pointer',opacity:splashFade?0:1,transition:'opacity 0.8s ease',userSelect:'none'}}>
          <div style={{fontSize:15,color:'#aaa',fontFamily:'monospace',letterSpacing:'0.1em',textTransform:'uppercase'}}>Find the</div>
          <div style={{fontSize:72,fontWeight:900,color:'#cc1f1f',letterSpacing:'-0.02em',lineHeight:1}}>ULTIMATE</div>
          <div style={{fontSize:28,fontWeight:300,color:'#333',letterSpacing:'0.15em',textTransform:'uppercase'}}>event</div>
          <div style={{marginTop:24,fontSize:12,color:'#ccc',fontFamily:'monospace'}}>{EVENT_ORDER.length} events to discover</div>
        </div>
      )}

      {/* ── Rickroll intro ─────────────────────────────────────────────── */}
      {introStep>=0&&introStep<INTRO_SLIDES.length&&(
        <div style={{position:'fixed',inset:0,background:'#000',zIndex:9000,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:12}}>
          <div key={introStep} style={{textAlign:'center',animation:'introIn 0.3s ease-out',padding:'0 40px'}}>
            <div style={{fontSize:INTRO_SLIDES[introStep].big?88:30,color:'#fff',fontWeight:800,letterSpacing:'0.06em',whiteSpace:'pre-line',lineHeight:1.2}}>{INTRO_SLIDES[introStep].content}</div>
            {INTRO_SLIDES[introStep].sub&&<div style={{fontSize:14,color:'#555',marginTop:10,letterSpacing:'0.05em'}}>{INTRO_SLIDES[introStep].sub}</div>}
          </div>
        </div>
      )}

      {/* ── Rainbow trail ──────────────────────────────────────────────── */}
      {rainbowMode&&!invisible&&trail.map((pt,i)=>{
        const ratio=i/Math.max(trail.length-1,1),size=6+ratio*12;
        return <div key={pt.id} style={{position:'fixed',left:pt.x,top:pt.y,width:size,height:size,borderRadius:'50%',background:RAINBOW_COLS[i%RAINBOW_COLS.length],opacity:0.2+ratio*0.7,pointerEvents:'none',zIndex:9998,transform:'translate(-50%,-50%)'}}/>;
      })}

      {/* ── Pizza cursor ───────────────────────────────────────────────── */}
      {pizzaCursor && !invisible && <div style={{position:'fixed',left:mousePos.x-24,top:mousePos.y-24,fontSize:48,pointerEvents:'none',zIndex:9999,userSelect:'none',lineHeight:1}}>🍕</div>}

      {/* ── Bruh overlay ───────────────────────────────────────────────── */}
      {bruhItems.map(b=>(
        <div key={b.id} style={{position:'fixed',left:`${b.x}%`,top:`${b.y}%`,fontSize:b.size,fontWeight:800,color:'#111',opacity:b.op,transform:`rotate(${b.rot}deg)`,pointerEvents:'none',zIndex:800,fontFamily:'sans-serif',userSelect:'none',animation:`bruhIn 0.25s ${b.delay}ms ease-out both`}}>bruh</div>
      ))}

      {/* ── Notification ───────────────────────────────────────────────── */}
      <div style={{position:'fixed',top:0,left:'50%',transform:`translateX(-50%) translateY(${notifShow?'0':'-130%'})`,transition:'transform 0.45s cubic-bezier(0.34,1.4,0.64,1)',zIndex:200,pointerEvents:'none'}}>
        {notif&&<div style={{marginTop:18,background:'#0f0f0f',border:'1px solid rgba(255,255,255,0.08)',borderRadius:14,padding:'14px 28px 16px',display:'flex',flexDirection:'column',alignItems:'center',gap:4,boxShadow:'0 8px 40px rgba(0,0,0,0.35)',minWidth:260,textAlign:'center'}}>
          <div style={{fontFamily:'monospace',fontSize:10,color:'#555',letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:2}}>Event Triggered</div>
          <div style={{fontSize:17,fontWeight:700,color:'#fff'}}>{notif.name}</div>
          <div style={{fontFamily:'monospace',fontSize:12,color:'#f97316'}}>{notif.rarity}</div>
        </div>}
      </div>

      {/* ── Clones ─────────────────────────────────────────────────────── */}
      {clones.map(c=>(
        <div key={c.id} style={{position:'absolute',top:`${c.top}%`,left:`${c.left}%`,transform:'translate(-50%,-50%)',animation:'clonesIn 0.3s ease-out'}}>
          <ButtonShell onClick={()=>sounds.pop(350)}/>
        </div>
      ))}

      {/* ── Main button ────────────────────────────────────────────────── */}
      <div id="main-button" style={{position:'absolute',top:`${buttonPos.top}%`,left:`${buttonPos.left}%`,transform:'translate(-50%,-50%)',transition:runAway?'top 0.27s cubic-bezier(0.2,0,0.4,1),left 0.27s cubic-bezier(0.2,0,0.4,1)':'top 0.5s cubic-bezier(0.4,0,0.2,1),left 0.5s cubic-bezier(0.4,0,0.2,1)',zIndex:growPhase!=='idle'?9000:2}}>
        {sliderActive?(
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:14}}>
            <div style={{fontSize:13,color:'#888',fontFamily:'monospace'}}>drag to 100% to continue</div>
            <div ref={sliderTrackRef}
              onMouseDown={e=>{e.preventDefault();isDragging.current=true;const r=sliderTrackRef.current!.getBoundingClientRect();setSliderVal(Math.max(0,Math.min(100,(e.clientX-r.left-THUMB_D/2)/(TRACK_W-THUMB_D)*100)));}}
              style={{position:'relative',width:TRACK_W,height:THUMB_D,borderRadius:999,background:'#e0e0e0',cursor:'pointer',boxShadow:'inset 0 2px 8px rgba(0,0,0,0.18)'}}>
              <div style={{position:'absolute',left:0,top:0,bottom:0,width:fillW,borderRadius:999,background:sliderVal>=100?'#22c55e':'#cc1f1f',pointerEvents:'none',transition:'background 0.3s ease'}}/>
              <div onMouseDown={e=>{e.stopPropagation();isDragging.current=true;}} style={{position:'absolute',top:'50%',left:thumbX,transform:'translateY(-50%)',width:THUMB_D,height:THUMB_D,borderRadius:'50%',background:'#fff',boxShadow:'0 2px 12px rgba(0,0,0,0.28)',cursor:'grab',zIndex:1}}/>
            </div>
            <div style={{fontSize:20,fontWeight:700,fontFamily:'monospace',color:sliderVal>=100?'#22c55e':'#aaa',transition:'color 0.2s'}}>{Math.round(sliderVal)}%</div>
          </div>
        ):(
          <div style={{transform:`scale(${buttonScale})`,transition:scaleTrans,transformOrigin:'center center'}}>
            <div style={{position:'absolute',bottom:isPressed?-8:-18,left:'50%',transform:'translateX(-50%)',width:CHROME_OUTER*.82,height:28,borderRadius:'50%',background:'rgba(0,0,0,0.22)',filter:'blur(18px)',transition:'bottom 0.1s ease',pointerEvents:'none'}}/>
            <div style={{position:'relative',width:CHROME_OUTER,height:CHROME_OUTER,borderRadius:'50%',background:'#b2b2b2',boxShadow:'0 8px 32px rgba(0,0,0,0.45),inset 0 2px 4px rgba(255,255,255,0.4),inset 0 -3px 6px rgba(0,0,0,0.3)',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <div style={{width:CHROME_INNER,height:CHROME_INNER,borderRadius:'50%',background:'#686868',boxShadow:'inset 0 4px 10px rgba(0,0,0,0.55),inset 0 -2px 5px rgba(255,255,255,0.08)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <button onPointerDown={handlePointerDown} onPointerUp={handlePointerUp} onPointerLeave={handlePointerUp} onClick={handleClick}
                  style={{width:DISC,height:DISC,borderRadius:'50%',background:'#cc1f1f',border:'none',cursor:locked?'not-allowed':'pointer',outline:'none',opacity:locked?.82:1,transform:isPressed?'translateY(3px)':'translateY(0)',boxShadow:isPressed?'0 1px 6px rgba(0,0,0,0.4)':'0 5px 14px rgba(0,0,0,0.35)',transition:'transform 0.08s ease,box-shadow 0.08s ease,opacity 0.2s ease',userSelect:'none',WebkitUserSelect:'none',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden'}}>
                  {existActive&&<span key={existPhrase} style={{fontSize:13,color:'rgba(255,255,255,0.9)',fontWeight:600,textAlign:'center',padding:'0 18px',pointerEvents:'none',userSelect:'none',animation:'existIn 0.3s ease-out'}}>{existPhrase}</span>}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Rickroll ───────────────────────────────────────────────────── */}
      {showRickroll&&(
        <div className="fixed inset-0 bg-black flex items-center justify-center" style={{zIndex:1500}}>
          <button onClick={()=>{setRickroll(false);unlock();}} style={{position:'absolute',top:16,right:16,background:'#fff',color:'#000',border:'none',borderRadius:8,padding:'8px 18px',cursor:'pointer',fontWeight:600,zIndex:1501}}>Close</button>
          <iframe width="100%" height="100%" src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1" allow="autoplay; encrypted-media" allowFullScreen/>
        </div>
      )}

      {/* ── Rain ───────────────────────────────────────────────────────── */}
      {raining&&rainEmojis.map(item=><div key={item.id} className="absolute pointer-events-none" style={{left:`${item.left}%`,top:'-60px',fontSize:'2rem',animation:`emojifall 2.8s ${item.delay}s linear forwards`}}>{item.emoji}</div>)}

      {/* ── Popups ─────────────────────────────────────────────────────── */}
      {popups.map(p=>(
        <div key={p.id} style={{position:'fixed',left:`${p.x}%`,top:`${p.y}%`,zIndex:500,width:240,background:'#fff',border:'2px solid #aaa',borderRadius:6,boxShadow:'0 8px 28px rgba(0,0,0,0.35)',fontFamily:'Arial,sans-serif',overflow:'hidden'}}>
          <div style={{background:'linear-gradient(to bottom,#4a90d9,#1a5fb4)',color:'white',padding:'7px 10px',fontSize:12,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'space-between'}}><span>{p.title}</span><span style={{opacity:.6,fontSize:10}}>✕</span></div>
          <div style={{background:'#d4d4d4',height:80,display:'flex',alignItems:'center',justifyContent:'center',fontSize:28,color:'#888',borderBottom:'1px solid #ccc'}}>🖼️</div>
          <div style={{padding:'10px 12px',fontSize:12,color:'#222',lineHeight:1.4}}>You have been selected!<br/>Click <b>ACCEPT</b> to claim your exclusive reward.</div>
          <div style={{display:'flex',gap:8,padding:'0 12px 12px'}}>
            <button onClick={()=>{sounds.pop(400+Math.random()*150);setPopups(prev=>[...prev.filter(x=>x.id!==p.id),...makePopups(3)]);}} style={{flex:1,background:'#16a34a',color:'#fff',border:'none',borderRadius:4,padding:7,cursor:'pointer',fontWeight:700,fontSize:12}}>ACCEPT</button>
            <button onClick={()=>{sounds.pop(250);setPopups(prev=>prev.filter(x=>x.id!==p.id));}} style={{flex:1,background:'#dc2626',color:'#fff',border:'none',borderRadius:4,padding:7,cursor:'pointer',fontWeight:700,fontSize:12}}>DENY</button>
          </div>
        </div>
      ))}

      {/* ── XP Error ───────────────────────────────────────────────────── */}
      {xpError&&(
        <div style={{position:'fixed',top:'50%',left:'50%',transform:'translate(-50%,-50%)',zIndex:1000,width:420,fontFamily:'"Tahoma","Segoe UI",sans-serif',border:'1px solid #003c74',borderRadius:'8px 8px 4px 4px',boxShadow:'4px 4px 16px rgba(0,0,0,0.6)',overflow:'hidden'}}>
          <div style={{background:'linear-gradient(to bottom,#245edb 0%,#3b7be0 8%,#245edb 40%,#1a4abf 100%)',padding:'5px 8px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div style={{display:'flex',alignItems:'center',gap:6}}><span style={{fontSize:14}}>🛑</span><span style={{color:'#fff',fontSize:12,fontWeight:700}}>System Error</span></div>
            <button onClick={()=>{sounds.pop(300);setXpError(false);unlock();}} style={{background:'linear-gradient(to bottom,#f06060,#d03030)',color:'#fff',border:'1px solid #800000',borderRadius:3,width:20,height:18,cursor:'pointer',fontSize:10,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',padding:0}}>✕</button>
          </div>
          <div style={{background:'#ece9d8',padding:20}}>
            <div style={{display:'flex',gap:16,alignItems:'flex-start',marginBottom:16}}><span style={{fontSize:40,lineHeight:1}}>⛔</span><div><div style={{fontWeight:700,fontSize:13,marginBottom:8}}>A fatal exception 0xDEADBUTTON has occurred.</div><div style={{fontSize:12,color:'#333',lineHeight:1.5}}>The button you pressed has caused an unrecoverable error in the space-time continuum. Reality will now restart.<br/><br/>Press <b>OK</b> to pretend this never happened.</div></div></div>
            <div style={{textAlign:'center'}}><button onClick={()=>{sounds.pop(300);setXpError(false);unlock();}} style={{background:'linear-gradient(to bottom,#f0f0ea,#dcdcd6)',border:'1px solid #a0a0a0',borderRadius:3,padding:'4px 28px',fontSize:12,cursor:'pointer',boxShadow:'inset 0 1px 0 rgba(255,255,255,0.8)'}}>OK</button></div>
          </div>
        </div>
      )}

      {/* ── Loading ─────────────────────────────────────────────────────── */}
      {loadVisible&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.55)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:800}}>
          <div style={{background:'#1a1a1a',borderRadius:16,padding:'36px 44px',width:380,boxShadow:'0 20px 60px rgba(0,0,0,0.6)',display:'flex',flexDirection:'column',gap:18,fontFamily:'monospace'}}>
            <div style={{color:'#fff',fontSize:15,fontWeight:700}}>Loading…</div>
            <div style={{background:'#333',borderRadius:999,height:12,overflow:'hidden'}}><div style={{height:'100%',borderRadius:999,width:`${loadPct}%`,background:'linear-gradient(to right,#22c55e,#86efac)',transition:'width 0.15s linear'}}/></div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><span style={{color:'#888',fontSize:13}}>{loadPct.toFixed(1)}%</span>{loadPct>=99&&<span style={{color:'#f97316',fontSize:12}}>almost there…</span>}</div>
            {loadCanQuit&&<button onClick={()=>{sounds.pop(280);setLoad(false);unlock();}} style={{background:'transparent',border:'1px solid #444',color:'#888',borderRadius:8,padding:8,fontSize:12,cursor:'pointer'}}>Force Quit</button>}
          </div>
        </div>
      )}

      {/* ── Are You Sure ────────────────────────────────────────────────── */}
      {sureDepth>0&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:900}}>
          <div style={{background:'#fff',borderRadius:16,padding:'32px 36px',maxWidth:380,width:'90%',boxShadow:'0 20px 60px rgba(0,0,0,0.4)',display:'flex',flexDirection:'column',gap:12,textAlign:'center'}}>
            <div style={{fontSize:28}}>{'🤔'.repeat(sureDepth)}</div>
            <div style={{fontSize:18,fontWeight:700,color:'#111'}}>{SURE_QS[sureDepth-1].q}</div>
            {SURE_QS[sureDepth-1].sub&&<div style={{fontSize:13,color:'#666'}}>{SURE_QS[sureDepth-1].sub}</div>}
            <div style={{display:'flex',gap:10,marginTop:8}}>
              <button onClick={()=>{if(sureDepth>=5){sounds.pop(600);setSureDepth(0);unlock();}else{sounds.sure(sureDepth+1);setSureDepth(d=>d+1);}}} style={{flex:1,background:'#111',color:'#fff',border:'none',borderRadius:10,padding:12,cursor:'pointer',fontWeight:700}}>{sureDepth>=5?'I AM SURE':'Yes'}</button>
              <button onClick={()=>{sounds.pop(220);setSureDepth(0);unlock();}} style={{flex:1,background:'#f0f0f0',color:'#333',border:'none',borderRadius:10,padding:12,cursor:'pointer',fontWeight:700}}>No</button>
            </div>
            <div style={{fontSize:11,color:'#bbb',fontFamily:'monospace'}}>depth {sureDepth} / 5</div>
          </div>
        </div>
      )}

      {/* ── Certificate ─────────────────────────────────────────────────── */}
      {showCert&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}}>
          <div style={{background:'#fdfbf2',borderRadius:4,padding:'48px 52px',width:520,maxWidth:'92vw',textAlign:'center',boxShadow:'0 24px 80px rgba(0,0,0,0.4)',border:'3px solid #c9a84c',outline:'6px solid #fdfbf2',outlineOffset:'-12px',position:'relative'}}>
            {['top:8px;left:8px','top:8px;right:8px','bottom:8px;left:8px','bottom:8px;right:8px'].map((pos,i)=><div key={i} style={{position:'absolute',...Object.fromEntries(pos.split(';').map(p=>p.split(':'))),fontSize:18,opacity:.5}}>✦</div>)}
            <div style={{fontSize:13,letterSpacing:'0.25em',textTransform:'uppercase',color:'#b8952a',marginBottom:8,fontFamily:'Georgia,serif'}}>Certificate of Achievement</div>
            <div style={{width:80,height:2,background:'linear-gradient(to right,transparent,#c9a84c,transparent)',margin:'0 auto 20px'}}/>
            <div style={{fontSize:52,marginBottom:12}}>🏅</div>
            <div style={{fontSize:13,color:'#888',fontFamily:'Georgia,serif',marginBottom:6}}>This certifies that the bearer is hereby awarded the title of</div>
            <div style={{fontSize:22,fontWeight:700,color:'#222',fontFamily:'Georgia,serif',margin:'8px 0 16px',fontStyle:'italic'}}>"{certTitle}"</div>
            <div style={{fontSize:13,color:'#888',fontFamily:'Georgia,serif',marginBottom:4}}>for successfully pressing</div>
            <div style={{fontSize:18,fontWeight:700,letterSpacing:'0.15em',color:'#c9a84c',marginBottom:24}}>THE BUTTON</div>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:'#aaa',fontFamily:'monospace',borderTop:'1px solid #e8e0c8',paddingTop:14,marginBottom:20}}><span>May 2, 2026</span><span style={{fontStyle:'italic'}}>fowiohuu</span></div>
            <button onClick={()=>{sounds.fanfare();setShowCert(false);unlock();}} style={{background:'#c9a84c',color:'#fff',border:'none',borderRadius:8,padding:'10px 28px',cursor:'pointer',fontWeight:700,fontSize:13,letterSpacing:'0.06em'}}>Claim Your Certificate</button>
          </div>
        </div>
      )}

      {/* ── Lights Out ──────────────────────────────────────────────────── */}
      {darken&&<div style={{position:'fixed',inset:0,background:'#000',zIndex:10000,pointerEvents:'all',display:'flex',alignItems:'center',justifyContent:'center'}}><span style={{color:'rgba(255,255,255,0.06)',fontSize:14,fontFamily:'monospace',letterSpacing:'0.15em'}}>lights out</span></div>}

      {/* ── Airhorn ─────────────────────────────────────────────────────── */}
      {airhorn&&<div style={{position:'fixed',inset:0,display:'flex',alignItems:'center',justifyContent:'center',pointerEvents:'none',zIndex:1100}}><div style={{fontSize:160,animation:'airhornIn 0.4s cubic-bezier(0.34,1.4,0.64,1)',lineHeight:1}}>📯</div></div>}

      {/* ── Countdown ───────────────────────────────────────────────────── */}
      {countdownDisplay!==null&&(
        <div style={{position:'fixed',inset:0,display:'flex',alignItems:'center',justifyContent:'center',pointerEvents:'none',zIndex:1200}}>
          <div key={countdownDisplay} style={{fontSize:countdownDisplay.startsWith('…')?36:160,fontWeight:900,color:'#111',fontFamily:'monospace',animation:'countdownPop 0.3s ease-out',textAlign:'center',lineHeight:1.1}}>{countdownDisplay}</div>
        </div>
      )}

      {/* ── Keyframes ───────────────────────────────────────────────────── */}
      <style>{`
        @keyframes emojifall   { 0%{transform:translateY(0) rotate(0deg);opacity:1} 90%{opacity:1} 100%{transform:translateY(105vh) rotate(400deg);opacity:0} }
        @keyframes clonesIn    { from{transform:translate(-50%,-50%) scale(0.4);opacity:0} to{transform:translate(-50%,-50%) scale(1);opacity:1} }
        @keyframes introIn     { from{opacity:0;transform:scale(0.92) translateY(12px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes existIn     { from{opacity:0;transform:scale(0.8)} to{opacity:1;transform:scale(1)} }
        @keyframes airhornIn   { from{transform:scale(0) rotate(-30deg);opacity:0} to{transform:scale(1) rotate(0deg);opacity:1} }
        @keyframes bruhIn      { from{opacity:0} to{opacity:1} }
        @keyframes countdownPop{ from{transform:scale(1.3);opacity:0} to{transform:scale(1);opacity:1} }
      `}</style>
    </div>
  );
}