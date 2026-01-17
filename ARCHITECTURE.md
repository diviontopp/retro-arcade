# ARCHITECTURE.md - Deep Technical Architecture

## Table of Contents
1. [Component Lifecycle](#component-lifecycle)
2. [State Management Patterns](#state-management-patterns)
3. [Layout Components Deep-Dive](#layout-components-deep-dive)
4. [UI Primitives Reference](#ui-primitives-reference)
5. [Visual Effects System](#visual-effects-system)
6. [Performance Optimization](#performance-optimization)

---

## Component Lifecycle

### App.tsx Initialization Sequence

```
1. React.StrictMode wrapper mounts
2. App component mounts
3. usePyodide() hook executes
   ├─ Check if window.pyodide exists
   ├─ Wait for window.loadPyodide (max 5 seconds)
   ├─ Call loadPyodide({ indexURL: CDN })
   ├─ Load micropip package
   └─ Set isPyodideReady = true
4. useState hooks initialize
   ├─ windows = []
   ├─ isBooting = true
   ├─ showAvatar = true
   ├─ mainContentMode = 'ABOUT'
   └─ isMobile = window.innerWidth <= 1024
5. useEffect hooks execute
   ├─ Video playback rate adjustment
   └─ Resize listener registration
6. Conditional render: BootScreen
7. BootScreen completes after 5 seconds
8. Main UI renders
   ├─ Sidebar
   ├─ ContentWindow
   ├─ AvatarPanel (if showAvatar)
   └─ Taskbar
```

### Window Lifecycle

**Creation:**
```typescript
openWindow('SNAKE')
  ↓
Check if window exists
  ↓
If exists and minimized → restore
  ↓
If not exists → create new window object
  ↓
Calculate center position
  ↓
Add to windows array
  ↓
React re-renders
  ↓
WindowFrame component mounts
  ↓
PyodideRunner component mounts (for games)
  ↓
Iframe created
  ↓
game_runner.html loads
  ↓
Pyodide initializes in iframe
  ↓
Python game code executes
  ↓
Game loop starts
```

**Destruction:**
```typescript
closeWindow(id)
  ↓
Filter window from array
  ↓
React re-renders
  ↓
WindowFrame unmounts
  ↓
PyodideRunner cleanup
  ↓
Iframe removed from DOM
  ↓
Python execution stops
  ↓
Memory freed
```

---

## State Management Patterns

### Local State (useState)

**Window State:**
```typescript
interface Window {
  id: string;
  type: string;
  title: string;
  x: number;
  y: number;
  width: number | string;
  height: number | string;
  minimized: boolean;
}

const [windows, setWindows] = useState<Window[]>([]);
```

**State Updates:**
```typescript
// Add window
setWindows([...windows, newWindow]);

// Remove window
setWindows(windows.filter(w => w.id !== id));

// Update window
setWindows(windows.map(w => 
  w.id === id ? {...w, minimized: true} : w
));

// Reorder windows (z-index)
setWindows(prev => {
  const index = prev.findIndex(w => w.id === id);
  const win = prev[index];
  return [...prev.slice(0, index), ...prev.slice(index + 1), win];
});
```

### Global State (Services)

**AudioBus (Singleton):**
```typescript
class AudioBus {
  private static instance: AudioBus;
  private sfxMap: Map<string, HTMLAudioElement>;
  private bgmPlayer: HTMLAudioElement | null;

  private constructor() {
    this.sfxMap = new Map();
    this.bgmPlayer = null;
    this.loadSounds();
  }

  static getInstance(): AudioBus {
    if (!AudioBus.instance) {
      AudioBus.instance = new AudioBus();
    }
    return AudioBus.instance;
  }

  trigger(sfxType: string) {
    const audio = this.sfxMap.get(sfxType);
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    }
  }
}

export default AudioBus.getInstance();
```

**ScoreService (Singleton):**
```typescript
class ScoreService {
  private static instance: ScoreService;
  private db: Firestore;

  private constructor() {
    this.db = getFirestore();
  }

  static getInstance(): ScoreService {
    if (!ScoreService.instance) {
      ScoreService.instance = new ScoreService();
    }
    return ScoreService.instance;
  }

  async submitScore(game: string, score: number) {
    const scoresRef = collection(this.db, 'scores');
    await addDoc(scoresRef, {
      game,
      score,
      timestamp: serverTimestamp()
    });
  }

  async getTopScores(game: string, limit: number = 10) {
    const q = query(
      collection(this.db, 'scores'),
      where('game', '==', game),
      orderBy('score', 'desc'),
      limit(limit)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data());
  }
}

export default ScoreService.getInstance();
```

---

## Layout Components Deep-Dive

### Sidebar.tsx

**Purpose:** Left navigation menu with game launchers

**Props:**
```typescript
interface SidebarProps {
  onOpenGame: (type: string) => void;
  isMobile?: boolean;
}
```

**Implementation:**
```typescript
const GAMES = [
  { id: 'SNAKE', name: 'Snake', icon: '/icons/snake.png' },
  { id: 'TETRIS', name: 'Tetris', icon: '/icons/tetris.png' },
  { id: 'BREAKOUT', name: 'Breakout', icon: '/icons/breakout.png' },
  { id: 'INVADERS', name: 'Space Invaders', icon: '/icons/invaders.png' },
  { id: 'PACMAN', name: 'Pac-Man', icon: '/icons/pacman.png' },
  { id: 'CHESS', name: 'Chess', icon: '/icons/chess.png' }
];

export default function Sidebar({ onOpenGame, isMobile }: SidebarProps) {
  return (
    <div className={isMobile ? 'sidebar-mobile' : 'sidebar-desktop'}>
      {GAMES.map(game => (
        <button
          key={game.id}
          onClick={() => {
            audioBus.trigger('click');
            onOpenGame(game.id);
          }}
          className="game-button"
        >
          <img src={game.icon} alt={game.name} />
          {!isMobile && <span>{game.name}</span>}
        </button>
      ))}
    </div>
  );
}
```

**Styling:**
```css
.sidebar-desktop {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  background: rgba(0, 0, 0, 0.95);
  border-right: 3px solid var(--primary);
}

.sidebar-mobile {
  display: flex;
  flex-direction: row;
  gap: 4px;
  padding: 8px;
  overflow-x: auto;
  background: rgba(0, 0, 0, 0.95);
  border-bottom: 3px solid var(--primary);
}

.game-button {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--glass);
  border: 2px solid var(--secondary);
  color: var(--primary);
  cursor: pointer;
  transition: all 0.2s;
}

.game-button:hover {
  background: var(--primary);
  color: black;
  transform: translateX(4px);
}

.game-button img {
  width: 32px;
  height: 32px;
  image-rendering: pixelated;
}
```

### Taskbar.tsx

**Purpose:** Bottom bar showing active windows and system tray

**State:**
```typescript
const [currentTime, setCurrentTime] = useState(new Date());

useEffect(() => {
  const timer = setInterval(() => {
    setCurrentTime(new Date());
  }, 1000);
  return () => clearInterval(timer);
}, []);
```

**Implementation:**
```typescript
export default function Taskbar({ onOpenWindow }: TaskbarProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  return (
    <div className="taskbar">
      <div className="taskbar-left">
        <button onClick={() => onOpenWindow('about')}>
          <img src="/icons/home.png" alt="Home" />
        </button>
      </div>

      <div className="taskbar-center">
        {windows.map(win => (
          <button
            key={win.id}
            className={win.minimized ? 'minimized' : 'active'}
            onClick={() => restoreWindow(win.id)}
          >
            {win.title}
          </button>
        ))}
      </div>

      <div className="taskbar-right">
        <span className="clock">
          {currentTime.toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
}
```

### ContentWindow.tsx

**Purpose:** Main content area displaying different modes

**Modes:**
```typescript
type ContentMode = 
  | 'ABOUT'
  | 'TECH_STACK'
  | 'MUSIC'
  | 'PHOTOS'
  | 'CONTROLS'
  | 'SCORES';
```

**Implementation:**
```typescript
export default function ContentWindow({ mode }: { mode: ContentMode }) {
  switch (mode) {
    case 'ABOUT':
      return <AboutContent />;
    case 'TECH_STACK':
      return <TechStackContent />;
    case 'MUSIC':
      return <MusicPlayer />;
    case 'PHOTOS':
      return <PhotoGallery />;
    case 'CONTROLS':
      return <ControlsGuide />;
    case 'SCORES':
      return <ScoresContent />;
    default:
      return <AboutContent />;
  }
}
```

**AboutContent:**
```typescript
function AboutContent() {
  return (
    <div className="content-panel">
      <h1>Welcome to Retro Arcade Web OS</h1>
      <p>
        A fully functional desktop environment running in your browser.
        Click any game in the sidebar to start playing!
      </p>
      <div className="features">
        <div className="feature">
          <h3>🎮 Six Classic Games</h3>
          <p>Snake, Tetris, Breakout, Space Invaders, Pac-Man, Chess</p>
        </div>
        <div className="feature">
          <h3>🐍 Python-Powered</h3>
          <p>Games written in Python, running via Pyodide/WebAssembly</p>
        </div>
        <div className="feature">
          <h3>🏆 Global Leaderboards</h3>
          <p>Compete with players worldwide via Firebase</p>
        </div>
      </div>
    </div>
  );
}
```

### AvatarPanel.tsx

**Purpose:** Right panel with animated character

**Implementation:**
```typescript
export default function AvatarPanel() {
  return (
    <div className="avatar-panel">
      <div className="avatar-container">
        <AnimatedSpriteAvatar />
      </div>
      <div className="avatar-info">
        <h3>NEO</h3>
        <p>System AI</p>
        <p className="status">● Online</p>
      </div>
      <ChatBox />
    </div>
  );
}
```

---

## UI Primitives Reference

### WindowFrame.tsx

**Purpose:** Draggable, resizable window container

**Props:**
```typescript
interface WindowFrameProps {
  id: string;
  title: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
  onClose: () => void;
  onMinimize: () => void;
  onFocus: () => void;
}
```

**Drag Implementation:**
```typescript
export default function WindowFrame({
  id,
  title,
  children,
  style,
  onClose,
  onMinimize,
  onFocus
}: WindowFrameProps) {
  const [position, setPosition] = useState({ x: style?.left || 0, y: style?.top || 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target !== e.currentTarget) return;
    
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
    onFocus();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    setPosition({
      x: e.clientX - dragOffset.x,
      y: e.clientY - dragOffset.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  return (
    <div
      className="window-frame"
      style={{
        ...style,
        left: position.x,
        top: position.y,
        position: 'absolute'
      }}
    >
      <div className="title-bar" onMouseDown={handleMouseDown}>
        <span className="title">{title}</span>
        <div className="controls">
          <button onClick={onMinimize}>_</button>
          <button onClick={onClose}>X</button>
        </div>
      </div>
      <div className="window-content">
        {children}
      </div>
    </div>
  );
}
```

### BootScreen.tsx

**Purpose:** Animated BIOS-style boot sequence

**Implementation:**
```typescript
export default function BootScreen({ onComplete }: { onComplete: () => void }) {
  const [lines, setLines] = useState<string[]>([]);

  useEffect(() => {
    const bootSequence = [
      'RETRO ARCADE BIOS v2.0',
      '',
      'Checking RAM... OK',
      'Checking CPU... OK',
      'Checking GPU... OK',
      'Loading Pyodide Runtime...',
      'Initializing Audio System...',
      'Mounting File System...',
      '',
      'Boot Complete.',
      'Starting Desktop Environment...'
    ];

    let index = 0;
    const interval = setInterval(() => {
      if (index < bootSequence.length) {
        setLines(prev => [...prev, bootSequence[index]]);
        index++;
      } else {
        clearInterval(interval);
        setTimeout(onComplete, 1000);
      }
    }, 300);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="boot-screen">
      <div className="boot-text">
        {lines.map((line, i) => (
          <div key={i} className="boot-line">
            {line}
          </div>
        ))}
        <span className="cursor">_</span>
      </div>
    </div>
  );
}
```

**Styling:**
```css
.boot-screen {
  width: 100vw;
  height: 100vh;
  background: black;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'VT323', monospace;
  color: var(--primary);
}

.boot-text {
  font-size: 20px;
  line-height: 1.5;
}

.boot-line {
  animation: fadeIn 0.3s;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.cursor {
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 49% { opacity: 1; }
  50%, 100% { opacity: 0; }
}
```

---

## Visual Effects System

### Scanline Effect

**Implementation** (`Animations.tsx`):
```typescript
export function Scanline() {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: `
          repeating-linear-gradient(
            to bottom,
            transparent 0px,
            transparent 2px,
            rgba(0, 0, 0, 0.3) 2px,
            rgba(0, 0, 0, 0.3) 4px
          )
        `,
        pointerEvents: 'none',
        zIndex: 9999,
        opacity: 0.5
      }}
    />
  );
}
```

### Click Effect

**Implementation:**
```typescript
export function ClickEffect() {
  const [clicks, setClicks] = useState<Array<{ id: number; x: number; y: number }>>([]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const id = Date.now();
      setClicks(prev => [...prev, { id, x: e.clientX, y: e.clientY }]);
      
      setTimeout(() => {
        setClicks(prev => prev.filter(c => c.id !== id));
      }, 1000);
    };

    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  return (
    <>
      {clicks.map(click => (
        <div
          key={click.id}
          className="click-ripple"
          style={{
            left: click.x,
            top: click.y
          }}
        />
      ))}
    </>
  );
}
```

**Styling:**
```css
.click-ripple {
  position: fixed;
  width: 20px;
  height: 20px;
  border: 2px solid var(--primary);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  animation: ripple 1s ease-out forwards;
}

@keyframes ripple {
  0% {
    width: 20px;
    height: 20px;
    opacity: 1;
  }
  100% {
    width: 100px;
    height: 100px;
    opacity: 0;
  }
}
```

### Particle System

**Implementation:**
```typescript
export function Particles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
    }> = [];

    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        life: 1
      });
    }

    function animate() {
      if (!ctx || !canvas) return;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.01;

        if (p.life <= 0) {
          p.x = Math.random() * canvas.width;
          p.y = Math.random() * canvas.height;
          p.life = 1;
        }

        ctx.fillStyle = `rgba(0, 255, 65, ${p.life})`;
        ctx.fillRect(p.x, p.y, 2, 2);
      });

      requestAnimationFrame(animate);
    }

    animate();
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 1
      }}
    />
  );
}
```

---

## Performance Optimization

### React Optimization

**1. Memoization:**
```typescript
const GameButton = React.memo(({ game, onClick }: GameButtonProps) => {
  return (
    <button onClick={() => onClick(game.id)}>
      <img src={game.icon} alt={game.name} />
      <span>{game.name}</span>
    </button>
  );
});
```

**2. useCallback:**
```typescript
const openWindow = useCallback((type: string) => {
  // Window opening logic
}, [windows]);

const closeWindow = useCallback((id: string) => {
  setWindows(prev => prev.filter(w => w.id !== id));
}, []);
```

**3. useMemo:**
```typescript
const sortedWindows = useMemo(() => {
  return windows.sort((a, b) => a.id.localeCompare(b.id));
}, [windows]);
```

### Pyodide Optimization

**1. Preload Common Modules:**
```typescript
useEffect(() => {
  if (pyodide) {
    pyodide.loadPackage(['numpy', 'micropip']);
  }
}, [pyodide]);
```

**2. Cache Python Code:**
```typescript
const codeCache = new Map<string, string>();

async function loadGameCode(game: string) {
  if (codeCache.has(game)) {
    return codeCache.get(game)!;
  }
  
  const response = await fetch(`/games/${game}/main.py`);
  const code = await response.text();
  codeCache.set(game, code);
  return code;
}
```

### Asset Optimization

**1. Lazy Loading:**
```typescript
const LazyPhotoGallery = React.lazy(() => import('./PhotoGallery'));

<Suspense fallback={<div>Loading...</div>}>
  <LazyPhotoGallery />
</Suspense>
```

**2. Image Optimization:**
```typescript
<img
  src="/photos/p1.jpg"
  loading="lazy"
  decoding="async"
  alt="Photo 1"
/>
```

**3. Video Optimization:**
```typescript
<video
  src="/back.mp4"
  autoPlay
  loop
  muted
  playsInline
  preload="auto"
  onLoadedMetadata={(e) => {
    e.currentTarget.playbackRate = 0.5;
  }}
/>
```

---

*[End of ARCHITECTURE.md]*
