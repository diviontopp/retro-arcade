import React, { useState, useEffect, useCallback } from 'react';

interface BootScreenProps {
    onComplete: () => void;
}

// All assets that need to be preloaded
const SIDEBAR_ICONS = [
    '/icons/about.png', '/icons/bug.png', '/icons/calculator.png', '/icons/calendar.png',
    '/icons/chess.png', '/icons/clock.png', '/icons/comic.png', '/icons/controls.png',
    '/icons/home.png', '/icons/image.png', '/icons/login.png', '/icons/monitor.png',
    '/icons/music.png', '/icons/notepad.png', '/icons/paint.png', '/icons/pet.png',
    '/icons/photos.png', '/icons/stopwatch.png', '/icons/techstack.png', '/icons/terminal.png',
    '/icons/text.png'
];

const GAME_ICONS = [
    '/games/snake/icon.png', '/games/tetris/icon.png', '/games/breakout/icon.png',
    '/games/spaceinvaders/icon.png', '/games/pacman/icon.png'
];

// Photos used in sidebar and gallery
const PHOTOS = Array.from({ length: 36 }, (_, i) => `/photos/p${i + 1}.jpg`);

// All images to preload
const ALL_IMAGES = [...SIDEBAR_ICONS, ...GAME_ICONS, ...PHOTOS];

// Font files to preload
const FONTS_TO_LOAD = [
    { family: 'LowresPixel', src: '/fonts/LowresPixel-Regular.otf' },
];

const BootScreen: React.FC<BootScreenProps> = ({ onComplete }) => {
    const [lines, setLines] = useState<string[]>([]);
    const [showLogo, setShowLogo] = useState(false);
    const [waitForInput, setWaitForInput] = useState(false);
    const [assetsLoaded, setAssetsLoaded] = useState(false);

    // Preload all critical assets
    const preloadAssets = useCallback(async () => {
        // Preload fonts first
        const fontPromises = FONTS_TO_LOAD.map(font => {
            return new Promise<void>((resolve) => {
                const fontFace = new FontFace(font.family, `url(${font.src})`);
                fontFace.load().then((loadedFont) => {
                    document.fonts.add(loadedFont);
                    resolve();
                }).catch(() => {
                    resolve(); // Continue even if font fails
                });
            });
        });

        // Preload all images
        const imagePromises = ALL_IMAGES.map(src => {
            return new Promise<void>((resolve) => {
                const img = new Image();
                img.onload = () => resolve();
                img.onerror = () => resolve(); // Continue even if image fails
                img.src = src;
            });
        });

        // Wait for all assets
        await Promise.all([...fontPromises, ...imagePromises]);

        // Also ensure document fonts are ready
        await document.fonts.ready;

        setAssetsLoaded(true);
    }, []);

    // Boot messages to display
    const bootMessages = [
        '',
        'Cyber Gothic Arcade, An Insect OS Ally.',
        'Copyright (C) 2024-2026, Neo Industries.',
        '',
        'CPU-9000 at 3200 MHz              , 1 Processor(s)',
        'Memory Test :   1048576K OK',
        '',
        'Arcade Plug and Play ROM Extension v1.0',
        'Copyright (C) 2026, Neo Industries.',
        'Detecting Graphics ROM     ... CyberGothic v.2x',
        'Detecting Audio Extension  ... WebAudio API',
        'Detecting Game Storage     ... LocalStorage OK',
        'Detecting Avatar Module    ... Neo Avatar Loaded',
        '',
        'Initializing Pyodide WASM Engine...',
        'Loading Python Runtime     ... OK',
        'Loading Game Catalog...',
        '',
        'Mounting Virtual Filesystem...',
        'Loading Icon Cache         ... 21 icons cached',
        'Loading Photo Archive      ... 36 images indexed',
        'Loading Font Assets        ... LowresPixel OK',
        'Initializing Audio Bus     ... 8 channels ready',
        '',
        'Starting Window Manager    ... OK',
        'Loading User Preferences   ... guest profile',
        '',
    ];

    // Track if we've already shown the completion message
    const completionShownRef = React.useRef(false);

    useEffect(() => {
        // Start preloading assets immediately
        preloadAssets();

        // Show logo first
        setTimeout(() => setShowLogo(true), 300);

        // Then start showing boot messages
        let index = 0;
        const interval = setInterval(() => {
            if (index < bootMessages.length) {
                setLines(prev => [...prev, bootMessages[index]]);
                index++;
            } else {
                clearInterval(interval);
            }
        }, 80);

        return () => clearInterval(interval);
    }, [preloadAssets]);

    // Once both messages and assets are done, show final message (only once)
    useEffect(() => {
        if (assetsLoaded && lines.length >= bootMessages.length && !completionShownRef.current) {
            completionShownRef.current = true;
            setLines(prev => [
                ...prev,
                'BOOT COMPLETE. Welcome to the Arcade.',
                '',
                'SYSTEM READY.',
                'PRESS ANY KEY OR CLICK TO START...'
            ]);
            setWaitForInput(true);
        }
    }, [assetsLoaded, lines.length]);

    useEffect(() => {
        if (!waitForInput) return;

        const handleInput = () => {
            onComplete();
        };

        window.addEventListener('keydown', handleInput);
        window.addEventListener('click', handleInput);
        window.addEventListener('touchstart', handleInput);

        return () => {
            window.removeEventListener('keydown', handleInput);
            window.removeEventListener('click', handleInput);
            window.removeEventListener('touchstart', handleInput);
        };
    }, [waitForInput, onComplete]);

    return (
        <div className="boot-screen">
            {/* Energy Star Style Logo */}
            {showLogo && (
                <div className="boot-logo">
                    {/* Arc/Swoosh */}
                    <div style={{
                        width: '160px',
                        height: '80px',
                        border: '4px solid #FFFF00',
                        borderBottom: 'none',
                        borderRadius: '100px 100px 0 0',
                        marginBottom: '-20px'
                    }}></div>

                    {/* Star */}
                    <div style={{
                        fontSize: '48px',
                        color: '#FFFF00',
                        marginTop: '-10px'
                    }}>★</div>

                    {/* Text under star */}
                    <div style={{
                        fontFamily: 'cursive, Arial',
                        fontSize: '24px',
                        color: '#00FF41',
                        fontStyle: 'italic',
                        marginTop: '-15px'
                    }}>arcade</div>

                    <div style={{
                        fontSize: '10px',
                        color: '#FFFF00',
                        marginTop: '5px',
                        letterSpacing: '2px'
                    }}>CYBER GOTHIC SYSTEM</div>
                </div>
            )}

            {/* Boot Messages */}
            <div className="boot-text-container">
                {lines.map((line, i) => (
                    <div key={i} className="boot-line" style={{
                        color: !line ? '#CCCCCC' :
                            line.includes('...') ? '#AAAAAA' :
                                line.includes('OK') ? '#00FF41' :
                                    line.includes('Copyright') ? '#888888' :
                                        line.includes('BOOT COMPLETE') ? '#00FF41' :
                                            '#CCCCCC'
                    }}>
                        {line || '\u00A0'}
                    </div>
                ))}

                {/* Blinking cursor */}
                <span style={{
                    animation: 'blink 0.5s infinite',
                    color: '#00FF41'
                }}>_</span>
            </div>

            <style>{`
                /* Base Styles (Desktop) - Cleaner, Larger */
                .boot-screen {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    background-color: #000000;
                    color: #00FF41;
                    font-family: "Courier New", monospace;
                    font-size: 16px; /* Larger for readability */
                    padding: 50px;
                    box-sizing: border-box;
                    overflow: hidden;
                    z-index: 99999;
                }
                
                .boot-logo {
                    position: absolute;
                    top: 40px;
                    right: 60px;
                    text-align: center;
                    transform-origin: top right;
                }

                .boot-text-container {
                    margin-top: 140px; /* Reduced gap but safe for logo */
                    max-width: 800px; /* Prevent lines stretching too far */
                }

                .boot-line {
                    margin-bottom: 6px;
                    white-space: pre-wrap;
                    line-height: 1.4;
                }

                @keyframes blink {
                    0%, 50% { opacity: 1; }
                    51%, 100% { opacity: 0; }
                }

                /* Mobile/Tablet Adjustments */
                @media (max-width: 900px) {
                    .boot-screen {
                        padding: 20px;
                        font-size: 13px;
                    }

                    .boot-logo {
                        top: 15px;
                        right: 15px;
                        transform: scale(0.65);
                    }

                    .boot-text-container {
                        margin-top: 70px; 
                        width: 100%;
                        max-width: none;
                    }
                }

                /* Compact Landscape (Mobile Phone Rotation) */
                @media (max-height: 500px) {
                    .boot-text-container {
                        margin-top: 10px;
                        width: 65%;
                    }
                    .boot-logo {
                        transform: scale(0.5);
                        top: 5px;
                        right: 10px;
                    }
                }
            `}</style>
        </div>
    );
};

export default BootScreen;
