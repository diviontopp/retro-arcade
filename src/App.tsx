import { useState, useEffect, useRef } from 'react';
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
import audioBus from './services/AudioBus';
import { initMobileControls, removeMobileControls } from './services/MobileControls';

import { usePyodide } from './hooks/usePyodide';
import { LoginApp } from './apps/LoginApp';

// ... (other imports remain, but remove gameUtils import if handled by hook OR pass it to hook)
// Actually the hook I wrote handles the *loading* but not the *utils writing* yet.
// I should update the hook to write utils or keep that part here.
// The hook I wrote *just* loads.

// Let's stick to the plan: Simplify App.tsx. I will move the global loader OUT of App.tsx but keep the effect simple.

function App() {
  const [isBooting, setIsBooting] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Use the hook
  usePyodide();

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 5.0;
    }
  }, []);

  // Initialize mobile swipe controls
  useEffect(() => {
    if (isMobile) {
      initMobileControls();
    }
    return () => removeMobileControls();
  }, [isMobile]);

  // Listen for window resize to toggle mobile mode
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [windows, setWindows] = useState<{ id: string; type: string; title: string; x: number; y: number; width?: number; height?: number }[]>([]);
  const [showParticles, setShowParticles] = useState(false);
  const [showAvatar, setShowAvatar] = useState(true);
  const [mainContentMode, setMainContentMode] = useState<'ABOUT' | 'TECH_STACK' | 'MUSIC' | 'PHOTOS' | 'CONTROLS' | 'SCORES'>('ABOUT');
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

      LOGIN: { title: 'access_control.sys', width: 340, height: 400 },
      AVATAR_TOGGLE: { title: 'avatar.exe', width: 300, height: 200 },
      RANDOM: { title: 'random.exe', width: 300, height: 250 },
      GALLERY: { title: 'gallery.exe', width: 360, height: 420 },
      TECH_STACK: { title: 'tech_stack.info', width: 350, height: 400 },
      // Games
      SNAKE: { title: 'snake.py', width: 660, height: 530 },
      TETRIS: { title: 'tetris.py', width: 660, height: 530 },
      BREAKOUT: { title: 'breakout.py', width: 660, height: 530 },
      INVADERS: { title: 'invaders.py', width: 660, height: 530 },
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

    if (type === 'AVATAR_TOGGLE') {
      setShowAvatar(prev => !prev);
      return;
    }

    if (type === 'TECH_STACK') {
      setMainContentMode('TECH_STACK');
      return;
    }

    if (type === 'MUSIC') {
      setMainContentMode('MUSIC');
      return;
    }

    if (type === 'PHOTOS') {
      setMainContentMode('PHOTOS');
      return;
    }

    if (type === 'about') {
      setMainContentMode('ABOUT');
      return;
    }

    if (type === 'SCORES') {
      setMainContentMode('SCORES');
      return;
    }

    if (type === 'CONTROLS') {
      setMainContentMode('CONTROLS');
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

  const renderAppContent = (type: string, onClose: () => void) => {
    switch (type) {
      case 'CALC': return <CalcApp />;
      case 'TERMINAL': return <TerminalApp onOpenWindow={openWindow} />;
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
      case 'LOGIN': return <LoginApp />;
      // TECH_STACK removed - handled by main content
      case 'AVATAR_TOGGLE': return <div style={{ padding: '20px' }}>avatar toggle<br />[coming soon]</div>;
      // Games
      case 'SNAKE': return <PyodideRunner scriptName="snake" onClose={onClose} />;
      case 'TETRIS': return <PyodideRunner scriptName="tetris" onClose={onClose} />;
      case 'BREAKOUT': return <PyodideRunner scriptName="breakout" onClose={onClose} />;
      case 'INVADERS': return <PyodideRunner scriptName="invaders" onClose={onClose} />;
      default: return <div style={{ padding: '20px' }}>{type.toLowerCase()}<br />[coming soon]</div>;
    }
  };


  // Show boot screen first
  if (isBooting) {
    return <BootScreen onComplete={() => {
      setIsBooting(false);
      audioBus.trigger('startup');
      audioBus.playBGM();
    }} />;
  }

  return (
    <>
      <Scanline />
      <Particles active={showParticles} />
      <ClickEffect />

      <div className="app-container" style={isMobile ? {
        display: 'flex',
        flexDirection: 'column',
        width: '100vw',
        minHeight: '100vh',
        overflow: 'auto',
        position: 'relative',
        zIndex: 1
      } : {
        display: 'grid',
        gridTemplateColumns: showAvatar ? '240px 1fr 450px' : '240px 1fr 0px',
        gridTemplateRows: '1fr 60px',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Global Video Background - Zoomed */}
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          src="/back.mp4"
          style={{
            position: 'absolute',
            top: 0,
            left: '-10%',
            width: '110%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'left center',
            zIndex: 0,
            opacity: 1.0,
            filter: 'brightness(1.2)',
          }}
          onLoadedMetadata={(e) => {
            const video = e.currentTarget;
            video.playbackRate = 0.5;
          }}
        />

        {/* Left Sidebar - horizontal on mobile */}
        {!isMobile && (
          <div className="mobile-sidebar" style={{
            position: 'relative',
            backgroundColor: 'transparent',
            height: '100%',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1
          }}>
            <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Sidebar onOpenGame={openWindow} />
            </div>
          </div>
        )}

        {/* Mobile Sidebar - horizontal scrollable */}
        {isMobile && (
          <div style={{
            backgroundColor: 'rgba(0,0,0,0.95)',
            borderBottom: '3px solid var(--primary)',
            padding: '6px 8px',
            overflowX: 'auto',
            overflowY: 'hidden',
            display: 'flex',
            flexDirection: 'row',
            gap: '4px',
            flexShrink: 0,
            zIndex: 1,
            maxHeight: '70px'
          }}>
            <Sidebar onOpenGame={openWindow} isMobile={true} />
          </div>
        )}

        <main className="main-content-mobile" style={{
          position: 'relative',
          overflow: isMobile ? 'auto' : 'hidden',
          padding: '0',
          backgroundColor: isMobile ? 'rgba(0,0,0,0.9)' : 'transparent',
          zIndex: 1,
          flex: isMobile ? 1 : undefined,
          minHeight: isMobile ? 'calc(100vh - 130px)' : undefined
        }}>
          <div style={{ position: 'relative', height: '100%', minHeight: isMobile ? 'calc(100vh - 130px)' : undefined }}>
            {/* Dark overlay for readability if needed, or just content */}
            <ContentWindow mode={mainContentMode} />

            {/* Floating Windows */}
            {windows.map(win => (
              <WindowFrame
                key={win.id}
                id={win.id}
                title={win.title}
                className="window-frame-mobile"
                style={{
                  left: win.x,
                  top: win.y,
                  width: `${win.width}px`,
                  height: `${win.height}px`
                }}
                onClose={() => closeWindow(win.id)}
              >
                {renderAppContent(win.type, () => closeWindow(win.id))}
              </WindowFrame>
            ))}
          </div>
        </main>

        {/* Right Avatar Panel - hidden on mobile */}
        {showAvatar && !isMobile && (
          <div className="avatar-panel-container" style={{
            position: 'relative',
            transition: 'background-color 0.3s',
            backgroundColor: 'transparent',
            zIndex: 1,
            // Green borders on left and right
            borderLeft: '4px solid var(--primary)',
            borderRight: '4px solid var(--primary)'
          }}>
            <AvatarPanel />
            <ChatBox />
          </div>
        )}

        {/* Bottom Taskbar */}
        <div className="mobile-taskbar" style={isMobile ? {
          position: 'relative',
          width: '100%',
          minHeight: '60px',
          zIndex: 10,
          flexShrink: 0
        } : {
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          height: '60px',
          zIndex: 10
        }}>
          <Taskbar onOpenWindow={openWindow} />
        </div>
      </div>
    </>
  );
}

export default App;
