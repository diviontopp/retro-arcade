import React, { useState, useEffect } from 'react';
import audioBus from '../services/AudioBus';

// ============= SEARCH APP (Aoogle) - Matching insect.christmas =============
export const SearchApp: React.FC = () => {
    const [query, setQuery] = useState('');
    return (
        <div style={{ padding: '20px', backgroundColor: '#fff', color: '#000', height: '100%' }}>
            {/* Logo with Google colors */}
            <div style={{ textAlign: 'center', marginBottom: '20px', fontSize: '32px', fontFamily: 'Arial, sans-serif' }}>
                <span style={{ color: '#4285F4' }}>a</span>
                <span style={{ color: '#EA4335' }}>o</span>
                <span style={{ color: 'yellow' }}>o</span>
                <span style={{ color: '#4285F4' }}>g</span>
                <span style={{ color: '#34A853' }}>l</span>
                <span style={{ color: '#EA4335' }}>e</span>
            </div>

            {/* Search bar */}
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ccc',
                    marginBottom: '15px',
                    fontFamily: 'Arial, sans-serif',
                    fontSize: '14px'
                }}
            />

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '20px' }}>
                <button style={{
                    padding: '8px 16px',
                    border: '1px solid #ccc',
                    background: '#f8f9fa',
                    cursor: 'pointer',
                    fontFamily: 'Arial, sans-serif',
                    fontSize: '14px'
                }}>
                    aoogle search
                </button>
                <button style={{
                    padding: '8px 16px',
                    border: '1px solid #ccc',
                    background: '#f8f9fa',
                    cursor: 'pointer',
                    fontFamily: 'Arial, sans-serif',
                    fontSize: '14px'
                }}>
                    i'm feeling lucky
                </button>
            </div>

            {/* Footer */}
            <div style={{ fontSize: '12px', color: '#666', fontFamily: 'Arial, sans-serif' }}>
                # of pages catalogued: 210
            </div>
        </div>
    );
};

// ============= GALLERY APP - Bug Images =============
export const GalleryApp: React.FC = () => {
    const bugs = [
        { name: 'beetle', src: '/pixel_bug_1_1768120426265.png' },
        { name: 'ladybug', src: '/pixel_bug_2_1768120445704.png' },
        { name: 'butterfly', src: '/pixel_bug_3_1768120461936.png' },
        { name: 'drag onfly', src: '/pixel_bug_4_1768120479786.png' },
    ];

    const [selected, setSelected] = useState(0);

    return (
        <div style={{ padding: '15px', textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ color: 'slateblue', marginBottom: '15px' }}>🖼️ bug gallery</div>

            {/* Main image display */}
            <div style={{
                flex: 1,
                border: '4px solid var(--primary)',
                backgroundColor: 'black',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '15px',
                minHeight: '200px'
            }}>
                <img
                    src={bugs[selected].src}
                    alt={bugs[selected].name}
                    style={{
                        maxWidth: '80%',
                        maxHeight: '80%',
                        imageRendering: 'pixelated'
                    }}
                />
            </div>

            {/* Name and navigation */}
            <div style={{ marginBottom: '10px', color: 'coral' }}>
                {bugs[selected].name}
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', alignItems: 'center' }}>
                <button style={{ padding: '8px 16px', border: '3px solid var(--primary)', background: 'black', color: 'var(--primary)', cursor: 'pointer', fontSize: '14px' }} onClick={() => setSelected((selected - 1 + bugs.length) % bugs.length)}>◀ prev</button>
                <span>{selected + 1}/{bugs.length}</span>
                <button style={{ padding: '8px 16px', border: '3px solid var(--primary)', background: 'black', color: 'var(--primary)', cursor: 'pointer', fontSize: '14px' }} onClick={() => setSelected((selected + 1) % bugs.length)}>next ▶</button>
            </div>
        </div>
    );
};

// ============= CALCULATOR APP =============
export const CalcApp: React.FC = () => {
    const [display, setDisplay] = useState('0');

    // Button layout matching reference image (4 rows of 4)
    const buttons = [
        ['7', '8', '9', '+'],
        ['4', '5', '6', '-'],
        ['1', '2', '3', 'x'],
        ['🐞', '0', 'C', '/']
    ];

    const handleClick = (btn: string) => {
        if (btn === '🐞') return; // Easter egg
        if (btn === 'C') {
            setDisplay('0');
        } else {
            setDisplay(prev => prev === '0' ? btn : prev + btn);
        }
    };

    const handleEquals = () => {
        try {
            const expr = display.replace(/x/g, '*');
            const result = eval(expr);
            setDisplay(String(result));
        } catch {
            setDisplay('ERROR');
        }
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            backgroundColor: 'black',
            padding: '8px',
            gap: '4px'
        }}>
            {/* Button Grid - 4x4 */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gridTemplateRows: 'repeat(4, 1fr)',
                gap: '4px',
                flex: 1
            }}>
                {buttons.flat().map((btn, i) => (
                    <button
                        key={i}
                        onClick={() => handleClick(btn)}
                        style={{
                            backgroundColor: btn === '🐞' ? 'black' : 'var(--primary)',
                            color: 'black',
                            border: '2px solid black',
                            fontSize: btn === '🐞' ? '32px' : '48px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontFamily: 'Arial, sans-serif'
                        }}
                    >
                        {btn}
                    </button>
                ))}
            </div>

            {/* Bottom Row: Display + Equals */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '3fr 1fr',
                gap: '4px',
                height: '70px'
            }}>
                {/* Display - White with black text */}
                <div style={{
                    backgroundColor: 'white',
                    color: 'black',
                    border: '2px solid black',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    padding: '0 12px',
                    fontSize: '24px',
                    fontFamily: 'monospace',
                    fontWeight: 'bold',
                    overflow: 'hidden'
                }}>
                    {display}
                </div>

                {/* Equals Button */}
                <button
                    onClick={handleEquals}
                    style={{
                        backgroundColor: 'var(--primary)',
                        color: 'black',
                        border: '2px solid black',
                        fontSize: '48px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    =
                </button>
            </div>
        </div>
    );
};

// ============= TERMINAL APP =============
export const TerminalApp: React.FC = () => {
    const [logs] = useState([
        { time: '13:42:00', type: 'info', msg: 'boot: system_ready' },
        { time: '13:42:01', type: 'info', msg: 'init: arcade_shell v0.1' },
        { time: '13:42:02', type: 'info', msg: 'load: games.dir mounted' },
        { time: '13:42:03', type: 'info', msg: 'net: connection established' },
        { time: '13:42:04', type: 'info', msg: 'usr: guest logged in' },
        { time: '13:42:05', type: 'warn', msg: 'pyodide: not initialized' },
        { time: '13:42:06', type: 'info', msg: 'ui: taskbar loaded' },
        { time: '13:42:07', type: 'info', msg: 'ui: avatar_panel loaded' },
    ]);

    return (
        <div style={{ padding: '10px', height: '100%', fontFamily: 'monospace', fontSize: '12px', overflow: 'auto' }}>
            <div style={{ color: 'slateblue', marginBottom: '10px' }}>$ system_logs --tail</div>
            {logs.map((log, i) => (
                <div key={i} style={{ color: log.type === 'warn' ? 'coral' : 'var(--primary)' }}>
                    [{log.time}] {log.msg}
                </div>
            ))}
            <div style={{ marginTop: '15px', color: 'slateblue' }}>$ <span style={{ animation: 'blink 1s infinite' }}>_</span></div>
            <style>{`@keyframes blink { 0%,50% { opacity: 1; } 51%,100% { opacity: 0; } }`}</style>
        </div>
    );
};

// ============= NOTEPAD APP =============
export const NotepadApp: React.FC = () => {
    const [text, setText] = useState(`welcome to notepad.exe
    
use this for quick notes.

commands:
- ctrl+s to save (mock)
- ctrl+n for new file

----
cyber gothic arcade
restoration project
----`);

    return (
        <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            style={{
                width: '100%', height: '100%', background: 'black', color: 'var(--primary)',
                border: 'none', padding: '10px', fontFamily: 'inherit', fontSize: '14px',
                resize: 'none', outline: 'none'
            }}
        />
    );
};

// ============= CALENDAR APP - Matching insect.christmas =============
export const CalendarApp: React.FC = () => {
    const now = new Date();
    const days = ['mo', 'tu', 'we', 'th', 'fr', 'sa', 'su'];
    const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).getDay();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

    const cells = [];
    for (let i = 0; i < (firstDay === 0 ? 6 : firstDay - 1); i++) cells.push(null);
    for (let i = 1; i <= daysInMonth; i++) cells.push(i);

    return (
        <div style={{ padding: '10px', height: '100%' }}>
            {/* Header with nav */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <button style={{ padding: '4px 8px', fontSize: '16px' }}>◀</button>
                <div style={{ color: 'var(--primary)', fontSize: '14px' }}>
                    {months[now.getMonth()]} {now.getFullYear()}
                </div>
                <button style={{ padding: '4px 8px', fontSize: '16px' }}>▶</button>
            </div>

            {/* Calendar grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', textAlign: 'center' }}>
                {days.map(d => <div key={d} style={{ color: 'var(--primary)', fontSize: '10px', padding: '4px' }}>{d}</div>)}
                {cells.map((day, i) => (
                    <div key={i} style={{
                        padding: '6px', fontSize: '12px',
                        backgroundColor: day === now.getDate() ? 'var(--primary)' : 'transparent',
                        color: day === now.getDate() ? 'black' : 'var(--primary)'
                    }}>
                        {day || ''}
                    </div>
                ))}
            </div>
        </div>
    );
};

// ============= STOPWATCH APP =============
export const StopwatchApp: React.FC = () => {
    const [time, setTime] = useState(0);
    const [running, setRunning] = useState(false);

    useEffect(() => {
        let interval: number;
        if (running) {
            interval = setInterval(() => setTime(t => t + 10), 10);
        }
        return () => clearInterval(interval);
    }, [running]);

    const format = (ms: number) => {
        const mins = Math.floor(ms / 60000);
        const secs = Math.floor((ms % 60000) / 1000);
        const centis = Math.floor((ms % 1000) / 10);
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(centis).padStart(2, '0')}`;
    };

    return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontFamily: 'monospace', marginBottom: '20px' }}>{format(time)}</div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button style={{ padding: '10px 20px', border: '3px solid var(--primary)', background: 'black', color: 'var(--primary)', cursor: 'pointer', fontSize: '16px' }} onClick={() => setRunning(!running)}>{running ? 'stop' : 'start'}</button>
                <button style={{ padding: '10px 20px', border: '3px solid var(--primary)', background: 'black', color: 'var(--primary)', cursor: 'pointer', fontSize: '16px' }} onClick={() => { setRunning(false); setTime(0); }}>reset</button>
            </div>
        </div>
    );
};

// ============= MONITOR APP =============
export const MonitorApp: React.FC = () => {
    const [stats, setStats] = useState({ cpu: 23, ram: 45, fps: 60 });

    useEffect(() => {
        const interval = setInterval(() => {
            setStats({
                cpu: Math.floor(Math.random() * 30) + 10,
                ram: Math.floor(Math.random() * 20) + 40,
                fps: Math.floor(Math.random() * 10) + 55
            });
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const Bar = ({ label, value, max }: { label: string; value: number; max: number }) => (
        <div style={{ marginBottom: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span>{label}</span><span>{value}%</span>
            </div>
            <div style={{ height: '12px', border: '2px solid var(--primary)', background: 'black' }}>
                <div style={{ height: '100%', width: `${(value / max) * 100}%`, background: 'var(--primary)' }}></div>
            </div>
        </div>
    );

    return (
        <div style={{ padding: '15px' }}>
            <Bar label="cpu" value={stats.cpu} max={100} />
            <Bar label="ram" value={stats.ram} max={100} />
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
                <span style={{ fontSize: '24px' }}>{stats.fps}</span>
                <span style={{ marginLeft: '5px', color: 'slateblue' }}>fps</span>
            </div>
        </div>
    );
};

// ============= PAINT APP =============
export const PaintApp: React.FC = () => {
    const [color, setColor] = useState('#7fff00');
    const colors = ['#7fff00', '#ff7f50', '#6a5acd', '#00ffff', '#ff0040', '#ffff00', '#ffffff', '#000000'];

    return (
        <div style={{ padding: '10px', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
                {colors.map(c => (
                    <div key={c} onClick={() => setColor(c)} style={{
                        width: '24px', height: '24px', backgroundColor: c,
                        border: color === c ? '3px solid white' : '2px solid var(--primary)',
                        cursor: 'pointer'
                    }}></div>
                ))}
            </div>
            <canvas width="280" height="200" style={{
                border: '2px solid var(--primary)',
                background: 'black',
                cursor: 'crosshair'
            }} onMouseMove={(e) => {
                if (e.buttons === 1) {
                    const ctx = (e.target as HTMLCanvasElement).getContext('2d');
                    if (ctx) {
                        ctx.fillStyle = color;
                        const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
                        ctx.fillRect(e.clientX - rect.left - 2, e.clientY - rect.top - 2, 4, 4);
                    }
                }
            }}></canvas>
        </div>
    );
};


// ============= CLOCK APP =============
export const ClockApp: React.FC = () => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const interval = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '36px', fontFamily: 'monospace' }}>
                {time.toLocaleTimeString('en-US', { hour12: false })}
            </div>
            <div style={{ fontSize: '14px', color: 'slateblue', marginTop: '10px' }}>
                {time.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
        </div>
    );
};

// ============= PET GAME (Cyber Dog) =============
export const PetApp: React.FC = () => {
    const [hunger, setHunger] = useState(80);
    const [happy, setHappy] = useState(90);
    const [action, setAction] = useState<'idle' | 'eating' | 'playing'>('idle');

    // Auto-decay stats
    useEffect(() => {
        const interval = setInterval(() => {
            setHunger(h => Math.max(0, h - 1));
            setHappy(h => Math.max(0, h - 1));
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    const handleFeed = () => {
        if (action !== 'idle') return;
        setAction('eating');
        audioBus.trigger('powerup'); // Use a generic positive sound
        setTimeout(() => {
            setHunger(h => Math.min(100, h + 30));
            setAction('idle');
        }, 2000);
    };

    const handlePlay = () => {
        if (action !== 'idle') return;
        setAction('playing');
        audioBus.trigger('jump');
        setTimeout(() => {
            setHappy(h => Math.min(100, h + 30));
            setAction('idle');
        }, 2000);
    };

    return (
        <div style={{ padding: '15px', textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Stats Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '12px' }}>
                <div style={{ color: hunger < 30 ? 'coral' : 'var(--primary)' }}>
                    HUNGER:
                    <div style={{ width: '80px', height: '8px', border: '1px solid var(--primary)', display: 'inline-block', marginLeft: '5px' }}>
                        <div style={{ width: `${hunger}%`, height: '100%', background: hunger < 30 ? 'coral' : 'var(--primary)' }} />
                    </div>
                </div>
                <div style={{ color: happy < 30 ? 'coral' : 'var(--primary)' }}>
                    HAPPY:
                    <div style={{ width: '80px', height: '8px', border: '1px solid var(--primary)', display: 'inline-block', marginLeft: '5px' }}>
                        <div style={{ width: `${happy}%`, height: '100%', background: happy < 30 ? 'coral' : 'var(--primary)' }} />
                    </div>
                </div>
            </div>

            {/* Main Stage */}
            <div style={{
                flex: 1,
                backgroundColor: '#001100',
                border: '2px solid var(--primary)',
                marginBottom: '20px',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
            }}>
                <CyberDog state={action} happy={happy > 30} />

                {/* Status/Speech Bubble */}
                {hunger < 30 && action === 'idle' && (
                    <div style={{ position: 'absolute', top: '10px', right: '10px', animation: 'bounce 1s infinite' }}>🍖?</div>
                )}
                {happy < 30 && action === 'idle' && hunger >= 30 && (
                    <div style={{ position: 'absolute', top: '10px', right: '10px', animation: 'bounce 1s infinite' }}>🥎?</div>
                )}
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button
                    style={{
                        padding: '10px 16px',
                        border: '2px solid var(--primary)',
                        background: action === 'eating' ? 'var(--primary)' : 'black',
                        color: action === 'eating' ? 'black' : 'var(--primary)',
                        cursor: 'pointer',
                        fontSize: '14px',
                        flex: 1
                    }}
                    onClick={handleFeed}
                    disabled={action !== 'idle'}
                >
                    {action === 'eating' ? 'YUM...' : 'FEED'}
                </button>
                <button
                    style={{
                        padding: '10px 16px',
                        border: '2px solid var(--primary)',
                        background: action === 'playing' ? 'var(--primary)' : 'black',
                        color: action === 'playing' ? 'black' : 'var(--primary)',
                        cursor: 'pointer',
                        fontSize: '14px',
                        flex: 1
                    }}
                    onClick={handlePlay}
                    disabled={action !== 'idle'}
                >
                    {action === 'playing' ? 'WEE!' : 'PLAY'}
                </button>
            </div>
            <style>{`
                @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
                @keyframes wag { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(10deg); } }
                @keyframes chomp { 0%, 100% { height: 4px; } 50% { height: 12px; } }
            `}</style>
        </div>
    );
};

// Cyber Dog Sprite Component (JS Animation)
const CyberDog: React.FC<{ state: 'idle' | 'eating' | 'playing'; happy: boolean }> = ({ state, happy }) => {
    const [frame, setFrame] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setFrame(f => (f + 1) % 4);
        }, 200); // 5 FPS
        return () => clearInterval(interval);
    }, []);

    const rowMap = { idle: 'row0', eating: 'row1', playing: 'row3' };

    // Construct path to current frame
    const imgSrc = `/pets/dog_${rowMap[state]}_${frame}.png`;

    return (
        <div style={{
            width: '128px',
            height: '128px',
            position: 'relative',
            filter: happy ? 'drop-shadow(0 0 5px var(--primary))' : 'hue-rotate(180deg) drop-shadow(0 0 2px blue)'
        }}>
            <img
                src={imgSrc}
                alt="Cyber Dog"
                style={{
                    width: '100%',
                    height: '100%',
                    imageRendering: 'pixelated',
                    display: 'block'
                }}
            />

            {/* <style> block removed as unused */}
            <style>{`
            `}</style>
        </div>
    );
};

// ============= COMIC VIEWER =============
export const ComicApp: React.FC = () => (
    <div style={{ padding: '15px', textAlign: 'center' }}>
        <div style={{ color: 'slateblue', marginBottom: '10px' }}>📓 comic viewer</div>
        <div style={{ border: '4px solid var(--primary)', padding: '30px', marginBottom: '15px' }}>
            <pre style={{ fontSize: '10px' }}>{`
  ┌──────────┐
  │ CYBER    │
  │ GOTHIC   │
  │ ARCADE   │
  │  ◇  ◇   │
  │   ──    │
  │  \\__ /   │
  └──────────┘
`}</pre>
        </div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', alignItems: 'center' }}>
            <button style={{ padding: '8px 16px', border: '3px solid var(--primary)', background: 'black', color: 'var(--primary)', cursor: 'pointer', fontSize: '14px' }}>◀ prev</button>
            <span>1/1</span>
            <button style={{ padding: '8px 16px', border: '3px solid var(--primary)', background: 'black', color: 'var(--primary)', cursor: 'pointer', fontSize: '14px' }}>next ▶</button>
        </div>
    </div>
);

// ============= HOME APP =============
export const HomeApp: React.FC = () => (
    <div style={{ padding: '20px' }}>
        <div style={{ fontSize: '20px', marginBottom: '15px' }}>🏠 home</div>
        <div style={{ color: 'slateblue', marginBottom: '10px' }}>welcome back, guest</div>
        <div style={{ borderTop: '2px dashed var(--primary)', paddingTop: '15px' }}>
            <div>📁 recent files: none</div>
            <div>🎮 last game: snake</div>
            <div>⏰ session: 0:15:00</div>
        </div>
    </div>
);
