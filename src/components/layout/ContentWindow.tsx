import React from 'react';

// Main content window - the "about" page like insect.christmas
import ScoresContent from './ScoresContent';

const ContentWindow: React.FC<{ mode?: 'ABOUT' | 'TECH_STACK' | 'MUSIC' | 'PHOTOS' | 'CONTROLS' | 'SCORES'; children?: React.ReactNode }> = ({ mode = 'ABOUT', children }) => {
    let content = children;
    if (!content) {
        if (mode === 'TECH_STACK') content = <TechStackContent />;
        else if (mode === 'MUSIC') content = <MusicContent />;
        else if (mode === 'PHOTOS') content = <PhotosContent />;
        else if (mode === 'CONTROLS') content = <ControlsContent />;
        else if (mode === 'SCORES') content = <ScoresContent />;
        else content = <DefaultContent />;
    }



    let title = 'cyber.arcade/';
    if (mode === 'TECH_STACK') title = 'tech_stack.info';
    else if (mode === 'MUSIC') title = 'audio_player.exe';
    else if (mode === 'PHOTOS') title = 'gallery_viewer.exe';
    else if (mode === 'CONTROLS') title = 'input_config.sys';
    else if (mode === 'SCORES') title = 'high_scores.db';

    return (
        <div style={{
            border: '4px solid var(--primary)',
            backgroundColor: 'rgba(0,0,0,0.9)',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            overflow: 'hidden',
        }}>
            {/* Window header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '4px solid var(--primary)',
                padding: '4px 8px',
                backgroundColor: 'black',
                color: 'var(--primary)'
            }}>
                <span>ʚïɞ {title}</span>
                <button style={{
                    background: 'red',
                    color: 'white',
                    border: 'none',
                    padding: '2px 6px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                }}>✖</button>
            </div>

            {/* Content */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                overflowX: 'hidden',
                WebkitOverflowScrolling: 'touch',
                padding: '15px'
            }}>
                {content}
            </div>
        </div>
    );
};

const TechStackContent: React.FC = () => (
    <div style={{ padding: '10px', color: 'var(--primary)' }}>
        <h2 style={{ color: 'slateblue', marginBottom: '20px', textTransform: 'uppercase', borderBottom: '2px solid var(--primary)', paddingBottom: '10px' }}>Technology Stack</h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
            <li style={{ marginBottom: '30px', display: 'flex', alignItems: 'center', fontSize: '24px' }}>
                <img src="https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg" alt="React" style={{ width: '64px', height: '64px', marginRight: '30px' }} />
                <div>
                    <div style={{ fontWeight: 'bold', fontSize: '28px' }}>React</div>
                    <div style={{ fontSize: '18px', color: 'coral' }}>UI Library</div>
                </div>
            </li>
            <li style={{ marginBottom: '30px', display: 'flex', alignItems: 'center', fontSize: '24px' }}>
                <img src="https://vitejs.dev/logo.svg" alt="Vite" style={{ width: '64px', height: '64px', marginRight: '30px' }} />
                <div>
                    <div style={{ fontWeight: 'bold', fontSize: '28px' }}>Vite</div>
                    <div style={{ fontSize: '18px', color: 'coral' }}>Build Tool</div>
                </div>
            </li>
            <li style={{ marginBottom: '30px', display: 'flex', alignItems: 'center', fontSize: '24px' }}>
                <img src="https://upload.wikimedia.org/wikipedia/commons/4/4c/Typescript_logo_2020.svg" alt="TypeScript" style={{ width: '64px', height: '64px', marginRight: '30px' }} />
                <div>
                    <div style={{ fontWeight: 'bold', fontSize: '28px' }}>TypeScript</div>
                    <div style={{ fontSize: '18px', color: 'coral' }}>Type Safety</div>
                </div>
            </li>
            <li style={{ marginBottom: '30px', display: 'flex', alignItems: 'center', fontSize: '24px' }}>
                <img src="https://upload.wikimedia.org/wikipedia/commons/c/c3/Python-logo-notext.svg" alt="Python" style={{ width: '64px', height: '64px', marginRight: '30px' }} />
                <div>
                    <div style={{ fontWeight: 'bold', fontSize: '28px' }}>Python (Pyodide)</div>
                    <div style={{ fontSize: '18px', color: 'coral' }}>In-browser Python Runtime</div>
                </div>
            </li>
        </ul>
    </div>
);

import audioBus from '../../services/AudioBus';

const MusicContent: React.FC = () => {
    // Force re-render on mount to match current audio state
    const [currentTrack, setCurrentTrack] = React.useState(audioBus.getCurrentTrackIndex());
    const playlist = audioBus.getPlaylist();

    // Polling to update highlight when track changes automatically
    React.useEffect(() => {
        const interval = setInterval(() => {
            const index = audioBus.getCurrentTrackIndex();
            if (index !== currentTrack) {
                setCurrentTrack(index);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [currentTrack]);

    const handlePlay = (index: number) => {
        audioBus.playTrack(index);
        setCurrentTrack(index);
    };

    return (
        <div style={{ padding: '10px', color: 'var(--primary)' }}>
            <h2 style={{ color: 'slateblue', marginBottom: '20px', textTransform: 'uppercase', borderBottom: '2px solid var(--primary)', paddingBottom: '10px' }}>
                Music Player
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {playlist.map((track, index) => {
                    const isPlaying = index === currentTrack;
                    return (
                        <div
                            key={index}
                            onClick={() => handlePlay(index)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '15px',
                                border: isPlaying ? '2px solid var(--primary)' : '2px dashed #444',
                                backgroundColor: isPlaying ? 'rgba(127, 255, 0, 0.1)' : 'transparent',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                position: 'relative'
                            }}
                            className={isPlaying ? "glow" : ""}
                        >
                            <div style={{
                                fontSize: '24px',
                                marginRight: '15px',
                                width: '30px',
                                textAlign: 'center'
                            }}>
                                {isPlaying ? '▶' : (index + 1)}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{
                                    fontSize: '20px',
                                    fontWeight: 'bold',
                                    color: isPlaying ? 'var(--primary)' : '#888'
                                }}>
                                    {track.title}
                                </div>
                                <div style={{ fontSize: '12px', color: 'slateblue', marginTop: '4px' }}>
                                    {isPlaying ? 'NOW PLAYING...' : 'CLICK TO PLAY'}
                                </div>
                            </div>
                            {isPlaying && (
                                <div style={{
                                    width: '10px',
                                    height: '10px',
                                    backgroundColor: 'coral',
                                    borderRadius: '50%',
                                    animation: 'pulse-glow 1s infinite'
                                }} />
                            )}
                        </div>
                    );
                })}
            </div>

            <div style={{ marginTop: '30px', fontSize: '14px', color: '#666', fontStyle: 'italic', borderTop: '1px dotted #444', paddingTop: '10px' }}>
                * Tracks will automatically play in sequence. Click any track to jump.
            </div>
        </div>
    );
};

const PhotosContent: React.FC = () => {
    // Generate array of 36 items
    const photos = Array.from({ length: 36 }, (_, i) => i + 1);

    return (
        <div style={{ padding: '10px', color: 'var(--primary)' }}>
            <h2 style={{ color: 'slateblue', marginBottom: '20px', textTransform: 'uppercase', borderBottom: '2px solid var(--primary)', paddingBottom: '10px' }}>
                Retro Gallery
            </h2>
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '15px'
            }}>
                {photos.map(num => (
                    <div key={num} style={{
                        border: '2px solid var(--primary)',
                        padding: '4px',
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        transition: 'transform 0.2s',
                        cursor: 'pointer'
                    }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        <img
                            src={`/photos/p${num}.jpg`}
                            alt={`Retro Arcade ${num}`}
                            style={{
                                width: '100%',
                                height: '150px',
                                objectFit: 'cover',
                                display: 'block'
                            }}
                            onError={(e) => {
                                // Fallback if image not found
                                e.currentTarget.src = 'https://via.placeholder.com/300x200?text=IMG_ERROR';
                            }}
                        />
                        <div style={{
                            textAlign: 'center',
                            fontSize: '10px',
                            marginTop: '4px',
                            color: 'slateblue'
                        }}>
                            IMG_{String(num).padStart(3, '0')}.JPG
                        </div>
                    </div>
                ))}
            </div>
            <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '12px', color: '#666' }}>
                Total Images: 30 | Source: Archive
            </div>
        </div>
    );
};

// Default "about" content
const DefaultContent: React.FC = () => (
    <div>
        {/* Header */}
        <h2 style={{ color: 'slateblue', marginBottom: '15px' }}>about:</h2>

        {/* Welcome */}
        <p style={{ marginBottom: '15px' }}>
            welcome to the <span style={{ color: 'coral' }}>cyber gothic arcade</span>.
            <br />
            this is a digital restoration project featuring retro games and utilities.
        </p>

        {/* Category list with emojis */}
        <div style={{ marginBottom: '20px' }}>
            <div style={{ marginBottom: '8px' }}>🎮 <span style={{ color: 'coral' }}>games</span> - classic arcade experiences</div>
            <div style={{ marginBottom: '8px' }}>🎵 <span style={{ color: 'coral' }}>music</span> - chiptune soundtracks</div>
            <div style={{ marginBottom: '8px' }}>📼 <span style={{ color: 'coral' }}>video</span> - retro animations</div>
            <div style={{ marginBottom: '8px' }}>🧮 <span style={{ color: 'coral' }}>utilities</span> - calculator, notepad, etc</div>
            <div style={{ marginBottom: '8px' }}>🌐 <span style={{ color: 'coral' }}>links</span> - external resources</div>
        </div>

        {/* Links row */}
        <div style={{
            display: 'flex',
            gap: '10px',
            flexWrap: 'wrap',
            marginBottom: '20px'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: 'slateblue', fontWeight: 'bold', fontSize: '26px' }}>github :</span>
                <a href="https://github.com/diviontopp/retro-arcade" target="_blank" rel="noopener noreferrer" style={{
                    color: 'coral',
                    cursor: 'pointer',
                    textDecoration: 'none'
                }}>
                    https://github.com/diviontopp/retro-arcade
                </a>
            </div>
        </div>

        {/* Credits */}
        <div style={{ marginBottom: '20px' }}>
            <h3 style={{ color: 'slateblue', fontSize: '26px', marginBottom: '10px' }}>credits:</h3>
            <div style={{
                color: 'var(--primary)',
                fontSize: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                paddingLeft: '10px'
            }}>
                <div>Divyaansh</div>
                <div>Suman</div>
                <div>Melvin</div>
                <div>Antony</div>
            </div>
        </div>


    </div>
);

// Controls page
const ControlsContent: React.FC = () => (
    <div style={{ padding: '10px', color: 'var(--primary)' }}>
        <h2 style={{ color: 'slateblue', marginBottom: '20px', textTransform: 'uppercase', borderBottom: '2px solid var(--primary)', paddingBottom: '10px' }}>
            System Controls
        </h2>

        <div style={{ marginBottom: '20px' }}>
            <p style={{ marginBottom: '10px' }}>Global Keybinds:</p>
            <ul style={{ listStyle: 'none', paddingLeft: '10px', color: '#888' }}>
                <li>[ ENTER ] - Restart Game / Confirm</li>
                <li>[ ESC ] - Pause / Unpause</li>
            </ul>
        </div>

        <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '18px',
            textAlign: 'left'
        }}>
            <thead>
                <tr style={{ borderBottom: '2px solid #444' }}>
                    <th style={{ padding: '10px', color: 'coral' }}>APPLICATION</th>
                    <th style={{ padding: '10px', color: 'coral' }}>INPUT MAP</th>
                </tr>
            </thead>
            <tbody>
                {[
                    { app: 'SNAKE.PY', input: 'WASD / ARROWS : Move' },
                    { app: 'TETRIS.PY', input: 'WASD / ARROWS : Move & Rotate, SPACE : Drop' },
                    { app: 'BREAKOUT.PY', input: 'A/D / ARROWS : Move Paddle, SPACE : Launch' },
                    { app: 'INVADERS.PY', input: 'A/D / ARROWS : Move Ship, SPACE : Shoot' },
                    { app: 'ANTIGRAV.PY', input: 'SPACE : Flip Gravity' },
                    { app: 'SYSTEM', input: 'MOUSE : Interact, CLICK : Shoot/Select' }
                ].map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #222' }}>
                        <td style={{ padding: '15px 10px', fontWeight: 'bold' }}>{row.app}</td>
                        <td style={{ padding: '15px 10px', fontFamily: 'monospace' }}>{row.input}</td>
                    </tr>
                ))}
            </tbody>
        </table>

        <div style={{ marginTop: '30px', fontSize: '14px', color: '#666', borderTop: '1px dotted #444', paddingTop: '10px' }}>
            * Gamepads are detected automatically but experimental.
        </div>
    </div>
);

export default ContentWindow;
