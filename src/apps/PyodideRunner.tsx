/**
 * ═══════════════════════════════════════════════════════════════
 * PYODIDE RUNNER — Python Script Executor Component
 * ═══════════════════════════════════════════════════════════════
 * 
 * Loads Pyodide WASM from CDN and executes Python game scripts.
 * Provides canvas element and cleanup on unmount.
 */

import React, { useRef, useState, useEffect } from 'react';

// Import Python scripts as raw strings using Vite's ?raw suffix
import snakeScript from '../games/snake.py?raw';
import breakoutScript from '../games/breakout.py?raw';
import tetrisScript from '../games/tetris.py?raw';
import invadersScript from '../games/invaders.py?raw';
import antigravityScript from '../games/antigravity.py?raw';
import gameUtilsScript from '../games/game_utils.py?raw';

import { ScoreService } from '../services/ScoreService';
import audioBus from '../services/AudioBus';

interface PyodideRunnerProps {
    scriptName: string;
    onClose?: () => void;
}

// Python script mapping
const PYTHON_SCRIPTS: Record<string, string> = {
    snake: snakeScript,
    breakout: breakoutScript,
    tetris: tetrisScript,
    invaders: invadersScript,
    antigravity: antigravityScript,
};

const GAME_CONTROLS: Record<string, { desc: string; keys: string[] }> = {
    snake: { desc: "Eat food to grow. Don't hit walls!", keys: ["WASD / ARROWS : Move"] },
    breakout: { desc: "Destroy all bricks. Don't lose the ball!", keys: ["ARROWS / MOUSE : Move Paddle", "SPACE : Launch Ball"] },
    tetris: { desc: "Clear lines by fitting blocks.", keys: ["ARROWS / WASD : Move & Rotate", "SPACE : Hard Drop"] },
    invaders: { desc: "Defend Earth from alien invasion!", keys: ["ARROWS / WASD : Move Ship", "SPACE : Fire Laser"] },
    antigravity: { desc: "Run as far as you can!", keys: ["SPACE : Flip Gravity"] },
};

const PyodideRunner: React.FC<PyodideRunnerProps> = ({ scriptName, onClose }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [status, setStatus] = useState<'loading' | 'ready' | 'running' | 'error'>('loading');
    const [error, setError] = useState<string | null>(null);
    const [isGameOver, setIsGameOver] = useState(false);

    const pyodideRef = useRef<any>(null);

    // Initial load effect
    useEffect(() => {
        let mounted = true;

        const loadPyodideEnv = async () => {
            try {
                setStatus('loading');

                // Check if script exists first
                const script = PYTHON_SCRIPTS[scriptName];
                if (!script) throw new Error(`Script "${scriptName}" not found`);

                // Check if Pyodide is already loaded script tag
                if (!document.querySelector('script[src*="pyodide.js"]')) {
                    const pyodideScript = document.createElement('script');
                    pyodideScript.src = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js';
                    await new Promise((resolve, reject) => {
                        pyodideScript.onload = resolve;
                        pyodideScript.onerror = reject;
                        document.head.appendChild(pyodideScript);
                    });
                } else if (!(window as any).loadPyodide) {
                    await new Promise(r => setTimeout(r, 100));
                }

                if (!mounted) return;

                // Initialize Pyodide if not already
                if (!pyodideRef.current) {
                    // @ts-ignore
                    const pyodide = await window.loadPyodide({
                        indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/'
                    });
                    pyodideRef.current = pyodide;
                }

                const pyodide = pyodideRef.current;

                // Inject utils module
                try {
                    pyodide.FS.writeFile("game_utils.py", gameUtilsScript);
                } catch (e) {
                    // Ignore if already exists
                }

                if (mounted) {
                    // READY to start - pause here and wait for user interaction
                    setStatus('ready');
                }

            } catch (err) {
                console.error('Pyodide error:', err);
                if (mounted) {
                    setStatus('error');
                    setError(err instanceof Error ? err.message : 'Unknown error');
                }
            }
        };

        loadPyodideEnv();

        return () => {
            mounted = false;
            // Cleanup on unmount
            if (pyodideRef.current) {
                try {
                    pyodideRef.current.runPython(`
                        try: cleanup()
                        except: pass
                    `);
                } catch (e) { }
            }
        };
    }, [scriptName]);

    // Cleanup overlay logic (only for running state now)
    // We already hide it manually when 'ready'.

    // Expose functions to Python
    useEffect(() => {
        (window as any).setGameOver = (state: boolean) => {
            setIsGameOver(state);
        };
        (window as any).submitScore = (score: number) => {
            ScoreService.saveScore(scriptName, score);
            console.log(`Score saved for ${scriptName}: ${score}`);
        };

        return () => {
            delete (window as any).setGameOver;
            delete (window as any).submitScore;
        };
    }, [scriptName]);

    const handleStartGame = async () => {
        if (pyodideRef.current && status === 'ready') {
            try {
                // Ensure audio is unlocked
                audioBus.resume();

                setStatus('running');
                const script = PYTHON_SCRIPTS[scriptName];
                await pyodideRef.current.runPythonAsync(script);
            } catch (err) {
                console.error("Right after start:", err);
                setStatus('error');
                setError("Failed to start game script");
            }
        }
    };

    const handleRetry = () => {
        if (pyodideRef.current) {
            try {
                pyodideRef.current.runPython('reset_game()');
                setIsGameOver(false);
            } catch (e) {
                console.error("Failed to retry:", e);
            }
        }
    };

    const controls = GAME_CONTROLS[scriptName] || { desc: "GLHF", keys: [] };

    return (
        <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#000000',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Loading Video Overlay */}
            {status === 'loading' && (
                <div style={{
                    position: 'absolute',
                    top: 0, left: 0, width: '100%', height: '100%',
                    zIndex: 20, backgroundColor: 'black',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <video
                        src="/gameloading.mp4"
                        autoPlay muted loop playsInline
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                </div>
            )}

            {/* CONTROLS / READY SCREEN */}
            {status === 'ready' && (
                <div style={{
                    position: 'absolute',
                    top: 0, left: 0, width: '100%', height: '100%',
                    zIndex: 15,
                    backgroundColor: 'rgba(0,0,0,0.95)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--primary)',
                    padding: '20px',
                    textAlign: 'center'
                }}>
                    <h1 style={{
                        fontSize: '32px',
                        marginBottom: '10px',
                        textTransform: 'uppercase',
                        textShadow: '2px 2px 0px #888'
                    }}>
                        {scriptName}.EXE
                    </h1>

                    <div style={{
                        border: '2px dashed var(--primary)',
                        padding: '20px',
                        marginBottom: '30px',
                        background: 'rgba(0, 255, 65, 0.1)'
                    }}>
                        <p style={{ marginBottom: '20px', fontSize: '18px', color: '#fff' }}>{controls.desc}</p>
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                            {controls.keys.map((key, i) => (
                                <li key={i} style={{ marginBottom: '8px', fontFamily: 'monospace', fontSize: '16px' }}>{key}</li>
                            ))}
                        </ul>
                    </div>

                    <button
                        onClick={handleStartGame}
                        className="blink-btn"
                        style={{
                            fontSize: '24px',
                            padding: '10px 40px',
                            backgroundColor: 'var(--primary)',
                            color: 'black',
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontFamily: 'inherit',
                            boxShadow: '0 0 15px var(--primary)'
                        }}
                    >
                        START GAME
                    </button>

                    <style>{`
                        .blink-btn { animation: pulse-btn 1.5s infinite; }
                        @keyframes pulse-btn { 0% { opacity: 1; transform: scale(1); } 50% { opacity: 0.8; transform: scale(0.95); } 100% { opacity: 1; transform: scale(1); } }
                    `}</style>
                </div>
            )}

            {status === 'error' && (
                <div style={{ color: '#FF0040', padding: '20px' }}>ERROR: {error}</div>
            )}

            <canvas
                id="game-canvas"
                ref={canvasRef}
                style={{
                    display: status === 'running' ? 'block' : 'none',
                    border: '1px solid #00FF41',
                    imageRendering: 'pixelated',
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain'
                }}
            />

            {status === 'running' && isGameOver && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(0, 0, 0, 0.7)', // Translucent overlay
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10
                }}>
                    <h2 style={{
                        color: 'red',
                        fontFamily: 'var(--font-primary)',
                        fontSize: '32px',
                        marginBottom: '20px',
                        textShadow: '2px 2px 0px black',
                        textTransform: 'uppercase'
                    }}>GAME OVER</h2>

                    <div style={{ display: 'flex', gap: '20px' }}>
                        <button
                            onClick={handleRetry}
                            style={{
                                padding: '8px 20px',
                                backgroundColor: 'var(--primary)',
                                color: '#000',
                                border: 'none',
                                fontFamily: 'var(--font-primary)',
                                fontSize: '18px',
                                cursor: 'pointer',
                                fontWeight: 'bold'
                            }}
                        >
                            RETRY
                        </button>

                        {onClose && (
                            <button
                                onClick={onClose}
                                style={{
                                    padding: '8px 20px',
                                    backgroundColor: 'red',
                                    color: 'white',
                                    border: 'none',
                                    fontFamily: 'var(--font-primary)',
                                    fontSize: '18px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold'
                                }}
                            >
                                CLOSE
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PyodideRunner;
