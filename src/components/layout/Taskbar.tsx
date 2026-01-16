import React, { useState, useEffect } from 'react';
import audioBus from '../../services/AudioBus';

// Retro App Icon Button - defined OUTSIDE to prevent re-creation on Taskbar re-renders
const AppButton: React.FC<{ icon: string; title: string; onClick: () => void; isImage?: boolean }> = ({ icon, title, onClick, isImage = false }) => {
    const [isHovered, setIsHovered] = useState(false);

    const handleMouseEnter = React.useCallback(() => {
        setIsHovered(true);
    }, []);

    const handleMouseLeave = React.useCallback(() => {
        setIsHovered(false);
    }, []);

    return (
        <button
            onClick={onClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            style={{
                width: isHovered ? 'auto' : '40px',
                minWidth: '40px',
                height: '40px',
                padding: isHovered ? '0 12px' : '0',
                marginRight: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: isHovered ? '13px' : (isImage ? '0' : '24px'),
                backgroundColor: isHovered ? 'black' : 'var(--primary)',
                color: isHovered ? 'var(--primary)' : 'black',
                border: isHovered ? '2px solid var(--primary)' : 'none',
                cursor: 'pointer',
                imageRendering: 'pixelated',
                overflow: 'hidden',
                fontWeight: 'bold',
                fontFamily: 'monospace',
                textTransform: 'uppercase',
                transition: 'all 0.3s ease-out',
                whiteSpace: 'nowrap',
                textShadow: isHovered ? '0 0 10px var(--primary), 0 0 20px var(--primary)' : 'none',
                boxShadow: isHovered ? '0 0 15px rgba(0, 255, 0, 0.3)' : 'none',
                willChange: 'width, background-color, color'
            }}
            className="retro-app-btn"
        >
            {isHovered ? (
                title
            ) : (
                isImage ? (
                    <img
                        src={icon}
                        alt={title}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            pointerEvents: 'none'
                        }}
                    />
                ) : (
                    icon
                )
            )}
        </button>
    );
};

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
            <AppButton icon="/icons/home.png" title="home" onClick={() => onOpenWindow('HOME')} isImage />
            <AppButton icon="/icons/clock.png" title="clock" onClick={() => onOpenWindow('CLOCK')} isImage />

            {/* Divider */}
            <div style={{ width: '2px', height: '40px', background: 'var(--primary)', margin: '0 16px' }}></div>

            {/* Apps Collection */}
            <AppButton icon="/icons/bug.png" title="avatar" onClick={() => onOpenWindow('AVATAR_TOGGLE')} isImage />
            <AppButton icon="/icons/random.png" title="random" onClick={() => onOpenWindow('RANDOM')} isImage />

            <div style={{ width: '2px', height: '40px', background: 'var(--primary)', margin: '0 16px' }}></div>

            <div style={{ display: 'flex', gap: '2px' }}>
                <AppButton icon="/icons/text.png" title="search" onClick={() => onOpenWindow('SEARCH')} isImage />
                <AppButton icon="/icons/image.png" title="gallery" onClick={() => onOpenWindow('GALLERY')} isImage />
                <AppButton icon="/icons/calendar.png" title="calendar" onClick={() => onOpenWindow('CALENDAR')} isImage />
                <AppButton icon="/icons/calculator.png" title="calc" onClick={() => onOpenWindow('CALC')} isImage />
                <AppButton icon="/icons/terminal.png" title="terminal" onClick={() => onOpenWindow('TERMINAL')} isImage />
                <AppButton icon="/icons/pet.png" title="pet" onClick={() => onOpenWindow('PET')} isImage />
                <AppButton icon="/icons/monitor.png" title="monitor" onClick={() => onOpenWindow('MONITOR')} isImage />
                <AppButton icon="/icons/notepad.png" title="notepad" onClick={() => onOpenWindow('NOTEPAD')} isImage />
                <AppButton icon="/icons/paint.png" title="paint" onClick={() => onOpenWindow('PAINT')} isImage />

                <AppButton icon="/icons/stopwatch.png" title="stopwatch" onClick={() => onOpenWindow('STOPWATCH')} isImage />

                {/* Login Button - Custom with Text */}
                <button
                    onClick={() => onOpenWindow('LOGIN')}
                    style={{
                        height: '40px',
                        padding: '0 12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        backgroundColor: 'black',
                        color: 'var(--primary)',
                        border: '2px solid var(--primary)',
                        marginRight: '8px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontFamily: 'monospace',
                        gap: '6px'
                    }}
                    className="retro-app-btn"
                >
                    <img src="/icons/login.png" alt="login" style={{ width: '24px', height: '24px', imageRendering: 'pixelated' }} /> LOGIN
                </button>
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
                
                /* Custom Tooltip Hover Effect */
                .app-button-container:hover .custom-tooltip {
                    opacity: 1 !important;
                }
            `}</style>
        </div>
    );
};

export default Taskbar;
