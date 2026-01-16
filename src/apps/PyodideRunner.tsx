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
import MobileControls from '../components/ui/MobileControls';

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
    chess: '/games/chess/main.py',
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
        (window as any).setGameOver = (state: boolean, score?: number) => {
            setIsGameOver(state);
            if (state) {
                if (typeof score === 'number') {
                    setFinalScore(score);
                } else {
                    try {
                        const pyodide = (window as any).pyodide;
                        if (pyodide) {
                            const globalScore = pyodide.globals.get('score');
                            if (typeof globalScore === 'number') {
                                setFinalScore(globalScore);
                            }
                        }
                    } catch (e) {
                        console.warn("Could not fetch score:", e);
                    }
                }
            }
        };
        (window as any).submitScore = (score: number) => {
            if (scriptName === 'chess') return;
            const user = auth.currentUser;
            const username = user?.displayName || user?.email?.split('@')[0] || 'Guest';
            ScoreService.saveScore(scriptName, score, user?.uid, username);
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

                if (utilsCode) {
                    try {
                        pyodide.FS.writeFile("game_utils.py", utilsCode, { encoding: "utf8" });
                    } catch (e) { }
                }

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
            try {
                // FORCE CLEANUP of Python Game Loop
                const pyodide = (window as any).pyodide;
                if (pyodide) {
                    pyodide.runPython(`
                        try:
                            if 'cleanup' in globals():
                                cleanup()
                        except:
                            pass
                    `);
                }
            } catch (e) {
                console.error("Python cleanup failed:", e);
            }
        };
    }, [scriptName]);

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
            setStatus('loading');
            setTimeout(() => setStatus('ready'), 100);
        }
    };

    // Input State Optimization
    useEffect(() => {
        if (!(window as any).KEY_STATE) {
            (window as any).KEY_STATE = new Int32Array(20);
        }

        const KEY_MAP: Record<string, number> = {
            'w': 0, 'arrowup': 0,
            's': 1, 'arrowdown': 1,
            'a': 2, 'arrowleft': 2,
            'd': 3, 'arrowright': 3,
            ' ': 4,
            'enter': 5,
            'escape': 6,
            'z': 7, 'x': 8, 'c': 9
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            const k = e.key.toLowerCase();
            if (KEY_MAP[k] !== undefined) {
                const idx = KEY_MAP[k];
                if ((window as any).KEY_STATE[idx] === 0) {
                    (window as any).KEY_STATE[idx] = 2;
                } else {
                    (window as any).KEY_STATE[idx] = 1;
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

            await pyodide.runPythonAsync(`
import js
class FastInput:
    def __init__(self):
        self.state = js.window.KEY_STATE
        self.last_pressed = {}

    def check(self, key_code):
        if not self.state: return False
        return self.state[key_code] > 0

    def check_new(self, key_code):
        if not self.state: return False
        is_pressed = self.state[key_code] > 0
        was_pressed = self.last_pressed.get(key_code, False)
        self.last_pressed[key_code] = is_pressed
        return is_pressed and not was_pressed

fast_input = FastInput()
            `);

            pyodide.runPython(gameCode);
        } catch (err: any) {
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
            overflow: 'hidden',
            boxSizing: 'border-box', // Ensure padding subtracts from height
            paddingBottom: window.innerHeight <= 600 ? '90px' : '60px' // More space for mobile controls
        }}>
            <canvas
                id={`game-canvas-${scriptName}`}
                ref={canvasRef}
                style={{
                    boxShadow: '0 0 20px rgba(0, 255, 65, 0.2)',
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    imageRendering: 'pixelated'
                }}
            />

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

            {isReady && !isGameOver && (
                <div className="ready-screen" style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    backgroundColor: 'rgba(0, 0, 0, 0.95)',
                    display: 'flex', flexDirection: 'column',
                    justifyContent: 'center', alignItems: 'center',
                    zIndex: 25,
                    overflowY: 'auto'
                }}>
                    <h1 className="ready-title">{scriptName.toUpperCase()}</h1>

                    <div className="controls-box">
                        <h3 className="controls-header">CONTROLS</h3>
                        <div className="controls-list">
                            {scriptName === 'snake' && (
                                <>
                                    <div>MOVE: WASD / ARROWS</div>
                                    <div>RESTART: ENTER</div>
                                </>
                            )}
                            {scriptName === 'tetris' && (
                                <>
                                    <div>MOVE: ← →</div>
                                    <div>ROTATE: ↑</div>
                                    <div>DROP: ↓</div>
                                    <div>RESTART: ENTER</div>
                                </>
                            )}
                            {scriptName === 'breakout' && (
                                <>
                                    <div>MOVE: ← →</div>
                                    <div>LAUNCH: SPACE</div>
                                    <div>RESTART: ENTER</div>
                                </>
                            )}
                            {scriptName === 'invaders' && (
                                <>
                                    <div>MOVE: ← →</div>
                                    <div>SHOOT: SPACE</div>
                                    <div>RESTART: ENTER</div>
                                </>
                            )}
                            {scriptName === 'chess' && (
                                <>
                                    <div>MOVE: MOUSE / TAP</div>
                                    <div>SELECT: CLICK</div>
                                </>
                            )}
                            {!['snake', 'tetris', 'breakout', 'invaders', 'chess'].includes(scriptName) && (
                                <>
                                    <div>MOVE: ARROWS</div>
                                    <div>ACTION: SPACE</div>
                                </>
                            )}
                        </div>
                    </div>

                    <button className="play-button" onClick={handlePlay}>PLAY</button>
                </div>
            )}

            {isGameOver && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    display: 'flex', flexDirection: 'column',
                    justifyContent: 'center', alignItems: 'center',
                    zIndex: 20, backdropFilter: 'blur(4px)'
                }}>
                    <h1 className="ready-title">GAME OVER</h1>
                    <div style={{
                        fontFamily: '"Press Start 2P", monospace', fontSize: '24px', color: '#fff',
                        marginBottom: '40px', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '2px'
                    }}>
                        SCORE: <span style={{ color: '#00FF41' }}>{finalScore}</span>
                    </div>

                    <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap', justifyContent: 'center' }}>
                        <button className="ready-button" onClick={handleRetry}>PLAY AGAIN</button>
                        {onClose && <button className="close-button" onClick={onClose}>CLOSE</button>}
                    </div>
                </div>
            )}

            <MobileControls gameType={scriptName} />

            <style>{`
                .ready-title {
                    font-family: "Press Start 2P", monospace;
                    font-size: 56px;
                    text-align: center;
                    margin: 0 0 60px 0;
                    text-transform: uppercase;
                    background: linear-gradient(180deg, #FFFF00 0%, #0000FF 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    filter: drop-shadow(4px 4px 0px #000);
                    letter-spacing: 5px;
                }
                .controls-box {
                    background-color: rgba(0, 0, 0, 0.8);
                    border: 3px solid #00FF41;
                    padding: 30px 40px;
                    margin-bottom: 50px;
                    border-radius: 8px;
                }
                .controls-header {
                    font-family: "Press Start 2P", monospace;
                    font-size: 16px;
                    color: #00FF41;
                    margin-bottom: 20px;
                    text-align: center;
                }
                .controls-list {
                    font-family: "Press Start 2P", monospace;
                    font-size: 12px;
                    color: #FFFFFF;
                    line-height: 2.5;
                }
                .play-button {
                    padding: 20px 60px;
                    background-color: #00FF41;
                    color: #000;
                    border: 4px solid #005500;
                    font-family: "Press Start 2P", monospace;
                    font-size: 24px;
                    cursor: pointer;
                    text-transform: uppercase;
                    transition: all 0.2s;
                    border-radius: 8px;
                }
                .play-button:hover { background-color: #fff; transform: scale(1.1); }
                .ready-button {
                    padding: 16px 40px;
                    background-color: #00FF41;
                    color: #000;
                    border: 4px solid #005500;
                    font-family: "Press Start 2P", monospace;
                    font-size: 16px;
                    cursor: pointer;
                    text-transform: uppercase;
                    transition: all 0.2s;
                    border-radius: 4px;
                }
                .ready-button:hover { background-color: #fff; transform: scale(1.05); }
                .close-button {
                    padding: 16px 40px;
                    background-color: #FF0000;
                    color: #fff;
                    border: 4px solid #550000;
                    font-family: "Press Start 2P", monospace;
                    font-size: 16px;
                    cursor: pointer;
                    text-transform: uppercase;
                    transition: all 0.2s;
                    border-radius: 4px;
                }
                .close-button:hover { background-color: #fff; color: #FF0000; transform: scale(1.05); }

                /* RESPONSIVE SCALING */
                @media (max-width: 1024px) {
                    .ready-title { font-size: 32px; margin-bottom: 20px; }
                    .controls-box { padding: 15px 20px; margin-bottom: 20px; }
                    .controls-header { font-size: 12px; margin-bottom: 10px; }
                    .controls-list { font-size: 10px; line-height: 1.8; }
                    .play-button { padding: 16px 40px; font-size: 18px; border-width: 3px; }
                }

                /* EXTREMELY COMPACT FOR LANDSCAPE MOBILE (Short Screens) */
                @media (max-height: 500px) {
                    canvas {
                        width: auto !important;
                        height: auto !important;
                        max-width: 100% !important;
                        max-height: 100% !important;
                    }
                    .ready-screen {
                        justify-content: flex-start !important;
                        padding-top: 30px !important;
                    }
                    /* ... (rest of existing rules if any) */
                    .ready-title {
                        font-size: 28px !important;
                        margin: 0 0 15px 0 !important;
                    }
                    .controls-box {
                        width: 450px !important;
                        max-width: 90% !important;
                        padding: 15px 20px !important;
                        margin-bottom: 15px !important;
                        border-width: 3px !important;
                    }
                    .controls-header {
                        font-size: 14px !important;
                        margin-bottom: 8px !important;
                    }
                    .controls-list {
                        font-size: 12px !important;
                        line-height: 1.6 !important;
                        display: flex;
                        flex-wrap: wrap;
                        justify-content: center;
                        gap: 15px;
                    }
                    .controls-list > div {
                        white-space: nowrap;
                    }
                    .play-button {
                        padding: 10px 50px !important;
                        font-size: 18px !important;
                        border-width: 3px !important;
                    }
                    .ready-button, .close-button {
                        padding: 10px 30px !important;
                        font-size: 14px !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default PyodideRunner;
