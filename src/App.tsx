import { useState } from 'react';
import Sidebar from './components/layout/Sidebar';
import Taskbar from './components/layout/Taskbar';
import ContentWindow from './components/layout/ContentWindow';
import AvatarPanel from './components/layout/AvatarPanel';
import ChatBox from './components/ui/ChatBox';
import WindowFrame from './components/ui/WindowFrame';
import PyodideRunner from './apps/PyodideRunner';
import { Particles, Scanline, ClickEffect } from './components/fx/Animations';
import BootScreen from './components/ui/BootScreen';
import {
  CalcApp, TerminalApp, NotepadApp, CalendarApp, StopwatchApp,
  MonitorApp, PaintApp, SearchApp, ClockApp, PetApp,
  ComicApp, HomeApp, GalleryApp
} from './apps/ShellApps';

function App() {
  const [isBooting, setIsBooting] = useState(true);
  const [windows, setWindows] = useState<{ id: string; type: string; title: string; x: number; y: number; width?: number; height?: number }[]>([]);
  const [showParticles, setShowParticles] = useState(false);
  const [backgroundType, setBackgroundType] = useState<string>('void');
  const [showAvatar, setShowAvatar] = useState(true);

  const getWindowConfig = (type: string) => {
    const configs: Record<string, { title: string; width: number; height: number }> = {
      CALC: { title: 'calc.exe', width: 280, height: 400 },
      TERMINAL: { title: 'terminal.exe', width: 450, height: 320 },
      NOTEPAD: { title: 'notepad.exe', width: 400, height: 350 },
      CALENDAR: { title: 'calendar.exe', width: 320, height: 380 },
      STOPWATCH: { title: 'stopwatch.exe', width: 280, height: 220 },
      MONITOR: { title: 'monitor.exe', width: 300, height: 280 },
      PAINT: { title: 'paint.exe', width: 340, height: 360 },
      SEARCH: { title: 'aoogle.exe', width: 400, height: 320 },
      CLOCK: { title: 'clock.exe', width: 320, height: 200 },
      PET: { title: 'pet.exe', width: 300, height: 280 },
      COMIC: { title: 'comic.exe', width: 320, height: 400 },
      HOME: { title: 'home.exe', width: 320, height: 280 },
      BG_CYCLE: { title: 'bg_cycle.exe', width: 300, height: 250 },
      AVATAR_TOGGLE: { title: 'avatar.exe', width: 300, height: 200 },
      RANDOM: { title: 'random.exe', width: 300, height: 250 },
      GALLERY: { title: 'gallery.exe', width: 360, height: 420 },
      // Games
      SNAKE: { title: 'snake.py', width: 660, height: 530 },
      TETRIS: { title: 'tetris.py', width: 660, height: 530 },
      BREAKOUT: { title: 'breakout.py', width: 660, height: 530 },
      INVADERS: { title: 'invaders.py', width: 660, height: 530 },
      ANTIGRAV: { title: 'antigravity.py', width: 660, height: 530 },
    };
    return configs[type] || { title: `${type.toLowerCase()}.exe`, width: 320, height: 280 };
  };

  const openWindow = (type: string) => {
    // Special handlers
    if (type === 'RANDOM') {
      setShowParticles(prev => !prev);
      setTimeout(() => setShowParticles(false), 500);  // Trigger particle burst
      return;
    }

    if (type === 'BG_CYCLE') {
      // Cycle through pastel backgrounds
      const bgs = ['pastel-yellow', 'pastel-pink', 'pastel-purple', 'pastel-cyan', 'void'];
      setBackgroundType(prev => {
        const nextIndex = (bgs.indexOf(prev) + 1) % bgs.length;
        return bgs[nextIndex];
      });
      return;
    }

    if (type === 'AVATAR_TOGGLE') {
      setShowAvatar(prev => !prev);
      return;
    }

    // Check if window already exists
    if (windows.find(w => w.type === type)) return;

    const config = getWindowConfig(type);
    const newWindow = {
      id: `win-${Date.now()}`,
      type,
      title: config.title,
      x: 100 + (windows.length * 35) % 250,
      y: 60 + (windows.length * 30) % 180,
      width: config.width,
      height: config.height
    };
    setWindows([...windows, newWindow]);
  };

  const closeWindow = (id: string) => {
    setWindows(windows.filter(w => w.id !== id));
  };

  const renderAppContent = (type: string) => {
    switch (type) {
      case 'CALC': return <CalcApp />;
      case 'TERMINAL': return <TerminalApp />;
      case 'NOTEPAD': return <NotepadApp />;
      case 'CALENDAR': return <CalendarApp />;
      case 'STOPWATCH': return <StopwatchApp />;
      case 'MONITOR': return <MonitorApp />;
      case 'PAINT': return <PaintApp />;
      case 'SEARCH': return <SearchApp />;
      case 'CLOCK': return <ClockApp />;
      case 'PET': return <PetApp />;
      case 'COMIC': return <ComicApp />;
      case 'HOME': return <HomeApp />;
      case 'GALLERY': return <GalleryApp />;
      case 'BG_CYCLE': return <div style={{ padding: '20px' }}>background cycle<br />[coming soon]</div>;
      case 'AVATAR_TOGGLE': return <div style={{ padding: '20px' }}>avatar toggle<br />[coming soon]</div>;
      // Games
      case 'SNAKE': return <PyodideRunner scriptName="snake" />;
      case 'TETRIS': return <PyodideRunner scriptName="tetris" />;
      case 'BREAKOUT': return <PyodideRunner scriptName="breakout" />;
      case 'INVADERS': return <PyodideRunner scriptName="invaders" />;
      case 'ANTIGRAV': return <PyodideRunner scriptName="antigravity" />;
      default: return <div style={{ padding: '20px' }}>{type.toLowerCase()}<br />[coming soon]</div>;
    }
  };

  // Background Color Map (Pastel only, no green)
  const bgColors: Record<string, string> = {
    'pastel-yellow': '#FFFF99',
    'pastel-pink': '#FFB7B2',
    'pastel-purple': '#E0B0FF',
    'pastel-cyan': '#E0FFFF',
    'void': '#000000'
  };
  // Default to pastel-yellow
  const currentBgColor = bgColors[backgroundType] || '#FFFF99';

  // Show boot screen first
  if (isBooting) {
    return <BootScreen onComplete={() => setIsBooting(false)} />;
  }

  return (
    <>
      <Scanline />
      <Particles active={showParticles} />
      <ClickEffect />

      <div className="app-container" style={{
        display: 'grid',
        gridTemplateColumns: showAvatar ? '160px 1fr 450px' : '160px 1fr 0px',
        gridTemplateRows: '1fr 60px',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Left Sidebar - Games (Wrapped for BG color) */}
        <div style={{ backgroundColor: currentBgColor, height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <Sidebar onOpenGame={openWindow} />
        </div>

        {/* Main Content Area */}
        <main style={{ position: 'relative', overflow: 'hidden', padding: '10px' }}>
          <ContentWindow />

          {/* Floating Windows */}
          {windows.map(win => (
            <WindowFrame
              key={win.id}
              id={win.id}
              title={win.title}
              style={{
                left: win.x,
                top: win.y,
                width: `${win.width}px`,
                height: `${win.height}px`
              }}
              onClose={() => closeWindow(win.id)}
            >
              {renderAppContent(win.type)}
            </WindowFrame>
          ))}
        </main>

        {/* Right Avatar Panel - conditional */}
        {showAvatar && (
          <div style={{ position: 'relative', borderLeft: '4px solid var(--primary)', backgroundColor: currentBgColor, transition: 'background-color 0.3s' }}>
            <AvatarPanel />
            <ChatBox />
          </div>
        )}

        {/* Bottom Taskbar */}
        <Taskbar onOpenWindow={openWindow} />
      </div>
    </>
  );
}

export default App;
