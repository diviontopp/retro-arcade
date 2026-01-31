/**
 * ═══════════════════════════════════════════════════════════════
 * PYODIDE RUNNER — Isolated Iframe Executor
 * ═══════════════════════════════════════════════════════════════
 * 
 * Runs Python games in an isolated iframe ('game_runner.html') 
 * to ensure stability and multitasking support.
 * Bridges input, scores, and audio between Iframe and React.
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

const PyodideRunner: React.FC<PyodideRunnerProps> = ({ scriptName, onClose }) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [status, setStatus] = useState<'loading' | 'ready' | 'running' | 'error'>('loading');
    const [error, setError] = useState<string | null>(null);
    const [isGameOver, setIsGameOver] = useState(false);
    const [finalScore, setFinalScore] = useState<number>(0);
    const [hasStarted, setHasStarted] = useState(false); // User clicked PLAY
    const [globalHighScore, setGlobalHighScore] = useState<number>(0);

    // Fetch Global High Score with Local Fallback
    useEffect(() => {
        const fetchScore = async () => {
            try {
                const tops = await ScoreService.getGlobalHighScores(scriptName, 1);
                let score = 0;

                if (tops.length > 0) {
                    score = tops[0].score;
                } else {
                    // Fallback to local high score if global not found/offline
                    const localScores = ScoreService.getLocalScores();
                    score = localScores[scriptName] || 0;
                }
                setGlobalHighScore(score);
            } catch (e) {
                console.error("Failed to fetch high score", e);
                // Fallback on error
                const localScores = ScoreService.getLocalScores();
                setGlobalHighScore(localScores[scriptName] || 0);
            }
        };
        fetchScore();
    }, [scriptName]);

    // Send High Score whenever it updates (Resolves Race Condition)
    useEffect(() => {
        if (iframeRef.current?.contentWindow) {
            iframeRef.current.contentWindow.postMessage({
                type: 'GLOBAL_HIGH_SCORE',
                score: globalHighScore
            }, '*');
        }
    }, [globalHighScore]);

    // Keep a ref for the event listener to access latest score without re-binding
    const globalHighScoreRef = useRef(globalHighScore);
    useEffect(() => { globalHighScoreRef.current = globalHighScore; }, [globalHighScore]);

    // Handle Bridge Messages from Iframe
    useEffect(() => {
        const handleMessage = (e: MessageEvent) => {
            // Security check: Ensure message comes from our iframe (conceptually, same origin)
            if (e.source !== iframeRef.current?.contentWindow) return;

            // Note: Our game_runner sends flattened data, check game_runner.html structure
            const data = e.data;

            if (data.type === 'GAME_READY') {
                setStatus('ready');
                // Send the LATEST score from Ref
                iframeRef.current?.contentWindow?.postMessage({
                    type: 'GLOBAL_HIGH_SCORE',
                    score: globalHighScoreRef.current
                }, '*');
            }
            else if (data.type === 'GAME_ERROR') {
                setError(data.message);
                setStatus('error');
            }
            else if (data.type === 'GAME_OVER') {
                setIsGameOver(data.state);
                if (data.score !== undefined) setFinalScore(data.score);
            }
            else if (data.type === 'SFX') {
                audioBus.trigger(data.sfxType);
            }
            else if (data.type === 'SUBMIT_SCORE') {
                if (scriptName === 'chess') return;
                const user = auth.currentUser;
                const username = user?.displayName || user?.email?.split('@')[0] || 'Guest';
                ScoreService.saveScore(scriptName, data.score, user?.uid, username);

                // Optimistically update local state if higher
                if (data.score > globalHighScoreRef.current) {
                    setGlobalHighScore(data.score);
                }
            }
            else if (data.type === 'GAME_O_ACK') {
                setIsGameOver(false);
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [scriptName]);

    const handlePlay = () => {
        setHasStarted(true);
        setStatus('running');
        //Focus iframe for keyboard input
        setTimeout(() => {
            iframeRef.current?.contentWindow?.focus();
            iframeRef.current?.focus();
        }, 100);
    };

    const handleRetry = () => {
        iframeRef.current?.contentWindow?.postMessage({ type: 'RESTART_GAME' }, '*');
        setIsGameOver(false);
        setTimeout(() => {
            iframeRef.current?.contentWindow?.focus();
        }, 100);
    };

    return (
        <div style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            backgroundColor: '#000',
            overflow: 'hidden',
        }}>
            {/* The Isolated Game Environment */}
            <iframe
                ref={iframeRef}
                src={`/game_runner.html?game=${scriptName}`}
                title={`Game: ${scriptName}`}
                style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    display: 'block',
                    visibility: (status === 'error') ? 'hidden' : 'visible'
                }}
                allow="autoplay; fullscreen"
            />

            {/* Error Screen */}
            {status === 'error' && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    backgroundColor: 'rgba(50,0,0,0.9)', color: 'red', display: 'flex', flexDirection: 'column',
                    justifyContent: 'center', alignItems: 'center', zIndex: 50, padding: 20, textAlign: 'center'
                }}>
                    <h3>SYSTEM MALFUNCTION</h3>
                    <p style={{ fontFamily: 'monospace', margin: '20px 0' }}>{error}</p>
                    <button onClick={() => { setStatus('loading'); setError(null); }} style={{ padding: '10px' }}>RETRY CONNECTION</button>
                </div>
            )}

            {/* Ready / Attract Screen */}
            {(!hasStarted && !isGameOver) && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.85)',
                    display: 'flex', flexDirection: 'column',
                    justifyContent: 'center', alignItems: 'center',
                    zIndex: 30,
                    backdropFilter: 'blur(5px)'
                }}>
                    <h1 style={{
                        fontFamily: '"Press Start 2P", monospace',
                        fontSize: window.innerWidth <= 600 ? '32px' : '48px',
                        color: 'transparent',
                        background: 'linear-gradient(180deg, #FFFF00 0%, #0000FF 100%)',
                        WebkitBackgroundClip: 'text',
                        filter: 'drop-shadow(4px 4px 0px #000)',
                        marginBottom: '30px',
                        textTransform: 'uppercase'
                    }}>{scriptName}</h1>

                    {/* Controls Box */}
                    <div style={{
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        border: '3px solid #00FF41',
                        padding: '20px 30px',
                        marginBottom: '40px',
                        borderRadius: '8px',
                        textAlign: 'center',
                        maxWidth: '80%'
                    }}>
                        <h3 style={{
                            fontFamily: '"Press Start 2P", monospace',
                            fontSize: '16px', color: '#00FF41', marginBottom: '15px',
                            textTransform: 'uppercase'
                        }}>CONTROLS</h3>
                        <div style={{
                            fontFamily: '"Press Start 2P", monospace',
                            fontSize: '12px', color: '#FFFFFF', lineHeight: '2',
                            textTransform: 'uppercase'
                        }}>
                            {scriptName === 'snake' && (
                                <>
                                    <div>MOVE: WASD / ARROWS</div>
                                    <div>RESTART: ENTER</div>
                                </>
                            )}
                            {scriptName === 'tetris' && (
                                <>
                                    <div>MOVE: A D / ← →</div>
                                    <div>ROTATE: W / ↑ / Z</div>
                                    <div>SOFT DROP: S / ↓</div>
                                    <div>HARD DROP: SPACE</div>
                                    <div>RESTART: ENTER</div>
                                </>
                            )}
                            {scriptName === 'breakout' && (
                                <>
                                    <div>MOVE: A D / ← →</div>
                                    <div>LAUNCH: SPACE</div>
                                    <div>RESTART: ENTER</div>
                                </>
                            )}
                            {scriptName === 'invaders' && (
                                <>
                                    <div>MOVE: A D / ← →</div>
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
                                    <div>MOVE: WASD / ARROWS</div>
                                    <div>ACTION: SPACE</div>
                                </>
                            )}
                        </div>
                    </div>

                    {status === 'loading' ? (
                        <div style={{
                            color: '#00FF41',
                            fontFamily: '"Press Start 2P", monospace',
                            fontSize: '24px',
                            animation: 'blink 1s infinite',
                            textTransform: 'uppercase',
                            textAlign: 'center',
                            lineHeight: '1.5',
                            width: '100%',
                            padding: '0 20px'
                        }}>
                            INITIALIZING SYSTEM...
                        </div>
                    ) : (
                        <button
                            onClick={handlePlay}
                            style={{
                                padding: '20px 60px',
                                backgroundColor: '#00FF41', color: 'black',
                                border: '4px solid #005500',
                                fontFamily: '"Press Start 2P"', fontSize: '24px',
                                cursor: 'pointer', textTransform: 'uppercase'
                            }}
                        >
                            START GAME
                        </button>
                    )}
                </div>
            )}

            {/* Game Over Screen */}
            {isGameOver && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    display: 'flex', flexDirection: 'column',
                    justifyContent: 'center', alignItems: 'center',
                    zIndex: 40, backdropFilter: 'blur(4px)'
                }}>
                    <h1 style={{ fontFamily: '"Press Start 2P"', color: 'red', fontSize: '48px', marginBottom: '20px', textTransform: 'uppercase' }}>GAME OVER</h1>
                    {scriptName !== 'chess' && (
                        <div style={{ fontFamily: '"Press Start 2P"', color: 'white', fontSize: '24px', marginBottom: '40px', textTransform: 'uppercase' }}>
                            SCORE: <span style={{ color: '#00FF41' }}>{finalScore}</span>
                        </div>
                    )}
                    <div style={{ display: 'flex', gap: '20px' }}>
                        <button onClick={handleRetry} style={{ padding: '15px 30px', fontFamily: '"Press Start 2P"', background: '#00FF41', border: 'none', cursor: 'pointer', textTransform: 'uppercase' }}>PLAY AGAIN</button>
                        {onClose && <button onClick={onClose} style={{ padding: '15px 30px', fontFamily: '"Press Start 2P"', background: 'red', color: 'white', border: 'none', cursor: 'pointer', textTransform: 'uppercase' }}>CLOSE</button>}
                    </div>
                </div>
            )}

            {/* Mobile Controls Instructions Only (Input handled by game_runner.html) */}
            <MobileControls gameType={scriptName} />
        </div>
    );
};

export default PyodideRunner;
