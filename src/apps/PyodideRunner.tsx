/**
 * ═══════════════════════════════════════════════════════════════
 * PYODIDE RUNNER — Python Script Executor Component
 * ═══════════════════════════════════════════════════════════════
 * 
 * Loads Pyodide WASM from CDN and executes Python game scripts.
 * Provides canvas element and cleanup on unmount.
 */

import React, { useRef, useState, useEffect } from 'react';

import { ScoreService } from '../services/ScoreService';
import audioBus from '../services/AudioBus';
import { auth } from '../services/firebase';

interface PyodideRunnerProps {
    scriptName: string;
    onClose?: () => void;
}

// Script Paths
const SCRIPT_PATHS: Record<string, string> = {
    snake: '/games/snake/main.py',
    breakout: '/games/breakout/main.py',
    tetris: '/games/tetris/main.py',
    invaders: '/games/spaceinvaders/main.py',
};

const PyodideRunner: React.FC<PyodideRunnerProps> = ({ scriptName, onClose }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [status, setStatus] = useState<'loading' | 'ready' | 'running' | 'error'>('loading');
    const [error, setError] = useState<string | null>(null);
    const [isGameOver, setIsGameOver] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const [finalScore, setFinalScore] = useState<number>(0);

    const pyodideRef = useRef<any>(null);

    // Expose functions to Python
    useEffect(() => {
        (window as any).setGameOver = (state: boolean) => {
            setIsGameOver(state);
            if (state) {
                try {
                    const pyodide = (window as any).pyodide;
                    if (pyodide) {
                        const score = pyodide.globals.get('score');
                        if (typeof score === 'number') {
                            setFinalScore(score);
                        }
                    }
                } catch (e) {
                    console.warn("Could not fetch score:", e);
                }
            }
        };
        (window as any).submitScore = (score: number) => {
            const user = auth.currentUser;
            const username = user?.displayName || user?.email?.split('@')[0] || 'Guest';
            ScoreService.saveScore(scriptName, score, user?.uid, username);
            console.log(`Score saved for ${scriptName}: ${score} by ${username}`);
        };
        (window as any).triggerSFX = (type: string) => {
            audioBus.trigger(type);
        };

        return () => {
            delete (window as any).setGameOver;
            delete (window as any).submitScore;
            delete (window as any).triggerSFX;
        };
    }, [scriptName]);

    // Initial load effect
    useEffect(() => {
        if (!canvasRef.current) return;

        let isMounted = true;
        let cleanupScript = false;

        setIsReady(false);
        setStatus('loading');

        const startGameSequence = async () => {
            const waitForPyodide = async () => {
                let attempts = 0;
                while (!(window as any).pyodide && attempts < 300) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                    attempts++;
                }
                const p = (window as any).pyodide;
                if (!p) throw new Error("Pyodide failed to load globally.");
                pyodideRef.current = p;
                return p;
            };

            try {
                // Fetch Scripts in parallel with loading
                const scriptUrl = SCRIPT_PATHS[scriptName];
                if (!scriptUrl) throw new Error(`Unknown script: ${scriptName}`);

                const fetchGame = fetch(scriptUrl).then(res => {
                    if (!res.ok) throw new Error(`Failed to load script: ${scriptName}`);
                    return res.text();
                });

                const fetchUtils = fetch('/games/_common/game_utils.py').then(res => res.text()).catch(() => "");

                const [pyodide, gameCode, utilsCode] = await Promise.all([
                    waitForPyodide(),
                    fetchGame,
                    fetchUtils
                ]);

                if (!isMounted) return;

                // Write Utils
                if (utilsCode) {
                    try {
                        pyodide.FS.writeFile("game_utils.py", utilsCode, { encoding: "utf8" });
                    } catch (e) {
                        console.warn("Utils rewrite warning:", e);
                    }
                }

                // Store code for play
                (window as any).__CURRENT_GAME_CODE = gameCode;

                const canvas = canvasRef.current;
                const ctx = canvas?.getContext('2d');
                if (ctx && canvas) {
                    ctx.fillStyle = "#000000";
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                }

                if (isMounted) setIsReady(true);
                if (isMounted) setStatus('ready');

            } catch (err: any) {
                console.error("Game Execution Error:", err);
                if (isMounted) {
                    setError(`Game Error: ${err.message}`);
                    setStatus('error');
                }
            }
        };

        startGameSequence();

        return () => {
            isMounted = false;
            if (cleanupScript) {
                // Cleanup logic unchanged
                try {
                    const pyodide = (window as any).pyodide;
                    if (pyodide) {
                        pyodide.runPython(`
try:
    if 'score' in globals() and 'submitScore' in globals():
        submitScore(score)
except:
    pass
`);
                        pyodide.runPython(`
try:
    if 'cleanup' in globals():
        cleanup()
except Exception as e:
    print(f"Cleanup error: {e}")
`);
                    }
                } catch (e) {
                    console.error("Cleanup failed:", e);
                }
            }
        };
    }, [scriptName]);

    // ... (Score/SFX logic unchanged)

    const handleRetry = () => {
        setIsGameOver(false);
        try {
            const pyodide = pyodideRef.current;
            if (pyodide) {
                pyodide.runPython(`
try:
    if 'reset_game' in globals():
        reset_game()
except:
    pass
`);
            }
        } catch (e) {
            console.error("Retry failed:", e);
            setStatus('loading');
            setTimeout(() => setStatus('ready'), 100);
        }
    };


    // Input State Optimization
    useEffect(() => {
        // Shared Input Buffer: [UP, DOWN, LEFT, RIGHT, SPACE, ENTER, ESC, Z, X, C]
        // 0=Released, 1=Pressed, 2=JustPressed
        (window as any).KEY_STATE = new Int32Array(20);

        const KEY_MAP: Record<string, number> = {
            'w': 0, 'arrowup': 0,
            's': 1, 'arrowdown': 1,
            'a': 2, 'arrowleft': 2,
            'd': 3, 'arrowright': 3,
            ' ': 4,
            'enter': 5,
            'escape': 6,
            'z': 7,
            'x': 8,
            'c': 9
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            const k = e.key.toLowerCase();
            if (KEY_MAP[k] !== undefined) {
                const idx = KEY_MAP[k];
                if ((window as any).KEY_STATE[idx] === 0) {
                    (window as any).KEY_STATE[idx] = 2; // Just Pressed
                } else {
                    (window as any).KEY_STATE[idx] = 1; // Held
                }
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            const k = e.key.toLowerCase();
            if (KEY_MAP[k] !== undefined) {
                (window as any).KEY_STATE[KEY_MAP[k]] = 0;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            delete (window as any).KEY_STATE;
        };
    }, []);

    const handlePlay = async () => {
        setIsReady(false);
        setStatus('running');
        setIsGameOver(false);

        try {
            const pyodide = (window as any).pyodide;
            if (!pyodide) return;

            pyodide.setStdout({ batched: (msg: string) => console.log(`[Python]: ${msg}`) });

            const gameCode = (window as any).__CURRENT_GAME_CODE;
            if (!gameCode) throw new Error("Game code not loaded");

            // Inject Input Helper
            await pyodide.runPythonAsync(`
import js
class FastInput:
    def __init__(self):
        self.state = js.window.KEY_STATE
        # Map: 0=UP, 1=DOWN, 2=LEFT, 3=RIGHT, 4=SPACE, 5=ENTER, 6=ESC, 7=Z, 8=X
        self.last_pressed = {}

    def check(self, key_code):
        # Direct poll
        if not self.state: return False
        return self.state[key_code] > 0

    def check_new(self, key_code):
        if not self.state: return False
        # If state is 2 (JustPressed), return True and optimize?
        # Actually, pure polling "Just Pressed" is hard without frame sync.
        # We'll trust the JS Side to set 2, but we need to ACK it.
        # Simple approach for latency:
        is_pressed = self.state[key_code] > 0
        was_pressed = self.last_pressed.get(key_code, False)
        self.last_pressed[key_code] = is_pressed
        return is_pressed and not was_pressed

fast_input = FastInput()
            `);

            pyodide.runPython(gameCode);
            console.log(`Started ${scriptName}`);
        } catch (err: any) {
            console.error("Game Execution Error:", err);
            setError(`Game Error: ${err.message}`);
            setStatus('error');
        }
    };

    return (
        <div style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            backgroundColor: '#000',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden'
        }}>
            <canvas
                id={`game-canvas-${scriptName}`}
                ref={canvasRef}
                style={{
                    boxShadow: '0 0 20px rgba(0, 255, 65, 0.2)',
                    maxWidth: '100%',
                    maxHeight: '100%',
                    imageRendering: 'pixelated'
                }}
            />

            {/* ERROR DISPLAY */}
            {status === 'error' && (
                <div style={{
                    position: 'absolute',
                    top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)',
                    color: 'red',
                    textAlign: 'center',
                    fontFamily: 'monospace',
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    padding: '20px',
                    border: '1px solid red'
                }}>
                    <h3>SYSTEM ERROR</h3>
                    <p>{error}</p>
                    <button onClick={() => window.location.reload()} style={{ marginTop: '10px' }}>RELOAD SYSTEM</button>
                </div>
            )}

            {/* READY SCREEN - Shows controls and PLAY button */}
            {isReady && !isGameOver && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(0, 0, 0, 0.95)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 25
                }}>
                    {/* Game Title */}
                    <h1 style={{
                        fontFamily: '"Press Start 2P", monospace',
                        fontSize: '56px',
                        textAlign: 'center',
                        margin: '0 0 60px 0',
                        textTransform: 'uppercase',
                        background: 'linear-gradient(180deg, #FFFF00 0%, #0000FF 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        filter: 'drop-shadow(4px 4px 0px #000)',
                        letterSpacing: '5px'
                    }}>
                        {scriptName.toUpperCase()}
                    </h1>

                    {/* Controls Display */}
                    <div style={{
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        border: '3px solid #00FF41',
                        padding: '30px 40px',
                        marginBottom: '50px',
                        borderRadius: '8px'
                    }}>
                        <h3 style={{
                            fontFamily: '"Press Start 2P", monospace',
                            fontSize: '16px',
                            color: '#00FF41',
                            marginBottom: '20px',
                            textAlign: 'center'
                        }}>
                            CONTROLS
                        </h3>
                        <div style={{
                            fontFamily: '"Press Start 2P", monospace',
                            fontSize: '12px',
                            color: '#FFFFFF',
                            lineHeight: '2.5'
                        }}>
                            {scriptName === 'snake' && (
                                <>
                                    <div>MOVE: WASD / ARROW KEYS</div>
                                    <div>RESTART: ENTER</div>
                                </>
                            )}
                            {scriptName === 'tetris' && (
                                <>
                                    <div>MOVE: A/D OR ← →</div>
                                    <div>ROTATE: W/Z OR ↑</div>
                                    <div>DROP: S OR ↓</div>
                                    <div>RESTART: ENTER</div>
                                </>
                            )}
                            {scriptName === 'breakout' && (
                                <>
                                    <div>MOVE: WASD / ARROW KEYS</div>
                                    <div>LAUNCH BALL: SPACE</div>
                                    <div>RESTART: ENTER</div>
                                </>
                            )}
                            {scriptName === 'invaders' && (
                                <>
                                    <div>MOVE: A/D OR ← →</div>
                                    <div>SHOOT: SPACE</div>
                                    <div>RESTART: ENTER</div>
                                </>
                            )}
                            {scriptName === 'antigravity' && (
                                <>
                                    <div>FLIP GRAVITY: SPACE</div>
                                    <div>RESTART: ENTER</div>
                                </>
                            )}
                            {!['snake', 'tetris', 'breakout', 'invaders', 'antigravity'].includes(scriptName) && (
                                <>
                                    <div>MOVE: WASD / ARROW KEYS</div>
                                    <div>ACTION: SPACE</div>
                                    <div>RESTART: ENTER</div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* PLAY Button */}
                    <button
                        onClick={handlePlay}
                        style={{
                            padding: '20px 60px',
                            backgroundColor: '#00FF41',
                            color: '#000',
                            border: '4px solid #005500',
                            fontFamily: '"Press Start 2P", monospace',
                            fontSize: '24px',
                            cursor: 'pointer',
                            textTransform: 'uppercase',
                            transition: 'all 0.2s',
                            borderRadius: '8px'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#fff';
                            e.currentTarget.style.transform = 'scale(1.1)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#00FF41';
                            e.currentTarget.style.transform = 'scale(1)';
                        }}
                    >
                        PLAY
                    </button>
                </div>
            )}

            {/* GAME OVER OVERLAY */}
            {isGameOver && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 20,
                    backdropFilter: 'blur(4px)'
                }}>
                    {/* GAME OVER Text */}
                    <h1 style={{
                        fontFamily: '"Press Start 2P", monospace',
                        fontSize: '48px',
                        textAlign: 'center',
                        margin: '0 0 60px 0',
                        textTransform: 'uppercase',
                        background: 'linear-gradient(180deg, #FFFF00 0%, #0000FF 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        filter: 'drop-shadow(4px 4px 0px #000)',
                        letterSpacing: '5px'
                    }}>
                        GAME OVER
                    </h1>

                    {/* Score Display (Added) */}
                    <div style={{
                        fontFamily: '"Press Start 2P", monospace',
                        fontSize: '24px',
                        color: '#fff',
                        marginBottom: '40px',
                        textAlign: 'center',
                        textTransform: 'uppercase',
                        letterSpacing: '2px'
                    }}>
                        SCORE: <span style={{ color: '#00FF41' }}>{finalScore}</span>
                    </div>

                    {/* Buttons */}
                    <div style={{ display: 'flex', gap: '30px' }}>
                        <button
                            onClick={handleRetry}
                            style={{
                                padding: '16px 40px',
                                backgroundColor: '#00FF41',
                                color: '#000',
                                border: '4px solid #005500',
                                fontFamily: '"Press Start 2P", monospace',
                                fontSize: '16px',
                                cursor: 'pointer',
                                textTransform: 'uppercase',
                                transition: 'all 0.2s',
                                borderRadius: '4px'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#fff';
                                e.currentTarget.style.transform = 'scale(1.05)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#00FF41';
                                e.currentTarget.style.transform = 'scale(1)';
                            }}
                        >
                            PLAY AGAIN
                        </button>

                        {onClose && (
                            <button
                                onClick={onClose}
                                style={{
                                    padding: '16px 40px',
                                    backgroundColor: '#FF0000',
                                    color: '#fff',
                                    border: '4px solid #550000',
                                    fontFamily: '"Press Start 2P", monospace',
                                    fontSize: '16px',
                                    cursor: 'pointer',
                                    textTransform: 'uppercase',
                                    transition: 'all 0.2s',
                                    borderRadius: '4px'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#fff';
                                    e.currentTarget.style.color = '#FF0000';
                                    e.currentTarget.style.transform = 'scale(1.05)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = '#FF0000';
                                    e.currentTarget.style.color = '#fff';
                                    e.currentTarget.style.transform = 'scale(1)';
                                }}
                            >
                                CLOSE
                            </button>
                        )}
                    </div>
                </div>
            )}

            <style>{`
                @keyframes blink {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0; }
                }
                @keyframes pulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                    100% { transform: scale(1); }
                }
            `}</style>
        </div>
    );
};

export default PyodideRunner;
