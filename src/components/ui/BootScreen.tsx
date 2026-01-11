import React, { useState, useEffect } from 'react';

interface BootScreenProps {
    onComplete: () => void;
}

const BootScreen: React.FC<BootScreenProps> = ({ onComplete }) => {
    const [lines, setLines] = useState<string[]>([]);
    const [showLogo, setShowLogo] = useState(false);
    const [waitForInput, setWaitForInput] = useState(false);

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
        'Loading Game Catalog...',
        '',
        'BOOT COMPLETE. Welcome to the Arcade.',
        ''
    ];

    useEffect(() => {
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
                // Wait for user interaction
                setLines(prev => [...prev, '', 'SYSTEM READY.', 'PRESS ANY KEY OR CLICK TO START...']);
                setWaitForInput(true);
            }
        }, 120); // Faster text

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!waitForInput) return;

        const handleInput = () => {
            onComplete();
        };

        window.addEventListener('keydown', handleInput);
        window.addEventListener('click', handleInput);

        return () => {
            window.removeEventListener('keydown', handleInput);
            window.removeEventListener('click', handleInput);
        };
    }, [waitForInput, onComplete]);

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: '#000011',
            color: '#00FF41',
            fontFamily: '"Courier New", monospace',
            fontSize: '14px',
            padding: '40px',
            boxSizing: 'border-box',
            overflow: 'hidden',
            zIndex: 99999
        }}>
            {/* Energy Star Style Logo */}
            {showLogo && (
                <div style={{
                    position: 'absolute',
                    top: '30px',
                    right: '60px',
                    textAlign: 'center'
                }}>
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
            <div style={{ marginTop: '180px' }}>
                {lines.map((line, i) => (
                    <div key={i} style={{
                        marginBottom: '2px',
                        color: !line ? '#CCCCCC' :
                            line.includes('...') ? '#AAAAAA' :
                                line.includes('OK') ? '#00FF41' :
                                    line.includes('Copyright') ? '#888888' :
                                        line.includes('BOOT COMPLETE') ? '#00FF41' :
                                            '#CCCCCC'
                    }}>
                        {line || ''}
                    </div>
                ))}

                {/* Blinking cursor */}
                <span style={{
                    animation: 'blink 0.5s infinite',
                    color: '#00FF41'
                }}>_</span>
            </div>

            <style>{`
                @keyframes blink {
                    0%, 50% { opacity: 1; }
                    51%, 100% { opacity: 0; }
                }
            `}</style>
        </div>
    );
};

export default BootScreen;
