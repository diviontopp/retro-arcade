import React, { useState, useEffect } from 'react';
import audioBus from '../../services/AudioBus';

// Bottom taskbar with all shell OS apps from insect.christmas
const Taskbar: React.FC<{ onOpenWindow: (type: string) => void }> = ({ onOpenWindow }) => {
    const [time, setTime] = useState(new Date().toLocaleTimeString('en-US', { hour12: false }));
    const [isPlaying, setIsPlaying] = useState(true); // Assume auto-playing on start

    useEffect(() => {
        const interval = setInterval(() => {
            setTime(new Date().toLocaleTimeString('en-US', { hour12: false }));
        }, 1000);
        return () => clearInterval(interval);
    }, []);


    // Retro App Icon Button
    const AppButton: React.FC<{ icon: string; title: string; onClick: () => void }> = ({ icon, title, onClick }) => (
        <button
            title={title}
            onClick={onClick}
            style={{
                width: '40px',
                height: '40px',
                padding: '0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                backgroundColor: 'var(--primary)',
                color: 'black',  // Icons are black on green
                border: 'none',
                marginRight: '8px',
                cursor: 'pointer',
                imageRendering: 'pixelated'
            }}
            className="retro-app-btn"
        >
            {icon}
        </button>
    );

    // Music Player Control Button
    const MusicBtn: React.FC<{ label: string; onClick?: () => void }> = ({ label, onClick }) => (
        <button
            onClick={onClick}
            style={{
                width: '32px',
                height: '32px',
                backgroundColor: 'var(--primary)',
                color: 'black',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                marginRight: '4px'
            }}>
            {label}
        </button>
    );

    return (
        <div style={{
            gridColumn: '1 / -1',
            borderTop: '4px solid var(--primary)',
            backgroundColor: 'black',
            display: 'flex',
            alignItems: 'center',
            padding: '0 10px',
            height: '60px',
            overflowX: 'auto'
        }}>
            {/* System / Core */}
            <AppButton icon="🏠" title="home" onClick={() => onOpenWindow('HOME')} />
            <AppButton icon="🕐" title="clock" onClick={() => onOpenWindow('CLOCK')} />

            {/* Divider */}
            <div style={{ width: '2px', height: '40px', background: 'var(--primary)', margin: '0 16px' }}></div>

            {/* Apps Collection */}
            <AppButton icon="🖼️" title="background" onClick={() => onOpenWindow('BG_CYCLE')} />
            <AppButton icon="🪲" title="avatar" onClick={() => onOpenWindow('AVATAR_TOGGLE')} />
            <AppButton icon="🐞" title="random" onClick={() => onOpenWindow('RANDOM')} />

            <div style={{ width: '2px', height: '40px', background: 'var(--primary)', margin: '0 16px' }}></div>

            <div style={{ display: 'flex', gap: '2px' }}>
                <AppButton icon="🅰️" title="search" onClick={() => onOpenWindow('SEARCH')} />
                <AppButton icon="📷" title="gallery" onClick={() => onOpenWindow('GALLERY')} />
                <AppButton icon="📅" title="calendar" onClick={() => onOpenWindow('CALENDAR')} />
                <AppButton icon="🧮" title="calc" onClick={() => onOpenWindow('CALC')} />
                <AppButton icon="📓" title="comic" onClick={() => onOpenWindow('COMIC')} />
                <AppButton icon="📟" title="terminal" onClick={() => onOpenWindow('TERMINAL')} />
                <AppButton icon="🥚" title="pet" onClick={() => onOpenWindow('PET')} />
                <AppButton icon="👁️" title="monitor" onClick={() => onOpenWindow('MONITOR')} />
                <AppButton icon="📝" title="notepad" onClick={() => onOpenWindow('NOTEPAD')} />
                <AppButton icon="🎨" title="paint" onClick={() => onOpenWindow('PAINT')} />
                <AppButton icon="⏱️" title="stopwatch" onClick={() => onOpenWindow('STOPWATCH')} />
            </div>

            <div style={{ flex: 1 }}></div>

            {/* Music Player - Custom UI matches user request */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                marginRight: '20px',
                border: '2px solid var(--primary)', // Optional container
                padding: '4px',
                height: '40px'
            }}>
                <MusicBtn label="⏮" onClick={() => audioBus.prevTrack()} />
                <MusicBtn label={isPlaying ? "⏸" : "▶"} onClick={() => {
                    const playing = audioBus.toggleBGM();
                    setIsPlaying(playing);
                }} />
                <MusicBtn label="⏭" onClick={() => audioBus.nextTrack()} />

                <span style={{ fontSize: '20px', margin: '0 8px', color: '#aaa' }}>🔊</span>

                {/* Purple Slider */}
                <input
                    type="range"
                    min="0"
                    max="100"
                    defaultValue="50"
                    onChange={(e) => audioBus.setVolume(Number(e.target.value) / 100)}
                    style={{
                        width: '80px',
                        accentColor: '#6A00FF', // Purple accent
                        height: '6px',
                        background: '#333',
                        marginRight: '12px'
                    }}
                />

                <span style={{
                    fontFamily: 'monospace',
                    color: 'var(--primary)',
                    fontSize: '16px',
                    letterSpacing: '1px'
                }}>
                    {/* Placeholder for now, could be hooked up to events later */}
                    BGM
                </span>
            </div>

            {/* Clock */}
            <div style={{
                fontSize: '18px',
                paddingLeft: '10px',
                display: 'flex',
                alignItems: 'center',
                fontFamily: 'monospace',
                color: 'var(--primary)' // Ensure clock color is primary green
            }}>
                {time}
            </div>

            <style>{`
                .retro-app-btn:hover {
                    filter: brightness(1.2); /* Slightly brighter green on hover */
                }
                /* No marquee animation needed for music player title */
            `}</style>
        </div>
    );
};

export default Taskbar;
