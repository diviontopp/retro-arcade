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

const PyodideRunner: React.FC<PyodideRunnerProps> = ({ scriptName, onClose }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [status, setStatus] = useState<'loading' | 'running' | 'error'>('loading');
    const [error, setError] = useState<string | null>(null);
    const [isGameOver, setIsGameOver] = useState(false);
    const [showLoadingOverlay, setShowLoadingOverlay] = useState(true);

    const pyodideRef = useRef<any>(null);

    // Initial load effect
    useEffect(() => {
        let mounted = true;

        const loadAndRun = async () => {
            try {
                setStatus('loading');
                setShowLoadingOverlay(true);

                // Check if script exists first
                const script = PYTHON_SCRIPTS[scriptName];
                if (!script) {
                    throw new Error(`Script "${scriptName}" not found`);
                }

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
                    // Wait slightly if script tag exists but global not ready
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

                await pyodide.runPythonAsync(script);

                if (mounted) {
                    setStatus('running');
                }
            } catch (err) {
                console.error('Pyodide error:', err);
                if (mounted) {
                    setStatus('error');
                    setError(err instanceof Error ? err.message : 'Unknown error');
                }
            }
        };

        loadAndRun();

        return () => {
            mounted = false;
            if (pyodideRef.current) {
                try {
                    // Attempt to call cleanup() function in Python if it exists
                    pyodideRef.current.runPython(`
try:
    cleanup()
except:
    pass
          `);
                } catch (e) {
                    console.warn('Could not stop Python execution:', e);
                }
            }
        };
    }, [scriptName]);

    // Cleanup overlay logic
    useEffect(() => {
        if (status === 'running') {
            const timer = setTimeout(() => {
                // We keep it mounted but hidden in CSS, so state change isn't strictly necessary for visibility,
                // but we can toggle this if we wanted to remove it from DOM. 
                // For now, consistent with CSS logic, we leave it true or handle logic here.
                // Actually, let's keep it simple and rely on the CSS opacity/visibility trick.
                setShowLoadingOverlay(false);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [status]);

    // Expose setGameOver to the window object for Python to call
    useEffect(() => {
        (window as any).setGameOver = (state: boolean) => {
            setIsGameOver(state);
        };
        return () => {
            delete (window as any).setGameOver;
        };
    }, []);

    const handleRetry = () => {
        if (pyodideRef.current) {
            try {
                pyodideRef.current.runPython('reset_game()');
                setIsGameOver(false);
                // Ensure focus returns to canvas interaction if needed
            } catch (e) {
                console.error("Failed to retry:", e);
            }
        }
    };

    return (
        <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#000000',
            position: 'relative'
        }}>
            {/* Loading Video Overlay */}
            {/* We render if loading OR if running (to allow fade out transition) */}
            {(status === 'loading' || (status === 'running' && showLoadingOverlay)) && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    zIndex: 20,
                    opacity: status === 'running' ? 0 : 1,
                    visibility: status === 'running' ? 'hidden' : 'visible',
                    transition: 'opacity 1.5s ease-out, visibility 0s linear 1.5s',
                    pointerEvents: 'none',
                    backgroundColor: 'black',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <video
                        src="/gameloading.mp4"
                        autoPlay
                        muted
                        loop
                        playsInline
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                        }}
                    />
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
