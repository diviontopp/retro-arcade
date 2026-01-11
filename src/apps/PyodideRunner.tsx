/**
 * ═══════════════════════════════════════════════════════════════
 * PYODIDE RUNNER — Python Script Executor Component
 * ═══════════════════════════════════════════════════════════════
 * 
 * Loads Pyodide WASM from CDN and executes Python game scripts.
 * Provides canvas element and cleanup on unmount.
 */

import React, { useRef } from 'react';

// Import Python scripts as raw strings using Vite's ?raw suffix
import snakeScript from '../games/snake.py?raw';
import breakoutScript from '../games/breakout.py?raw';
import tetrisScript from '../games/tetris.py?raw';
import invadersScript from '../games/invaders.py?raw';
import antigravityScript from '../games/antigravity.py?raw';

interface PyodideRunnerProps {
    scriptName: string;
}

// Python script mapping
const PYTHON_SCRIPTS: Record<string, string> = {
    snake: snakeScript,
    breakout: breakoutScript,
    tetris: tetrisScript,
    invaders: invadersScript,
    antigravity: antigravityScript,
};

const PyodideRunner: React.FC<PyodideRunnerProps> = ({ scriptName }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [status, setStatus] = React.useState<'loading' | 'running' | 'error'>('loading');
    const [error, setError] = React.useState<string | null>(null);
    const [isGameOver, setIsGameOver] = React.useState(false);

    const pyodideRef = useRef<any>(null);

    React.useEffect(() => {
        let mounted = true;

        const loadAndRun = async () => {
            try {
                setStatus('loading');

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

    // Expose setGameOver to the window object for Python to call
    React.useEffect(() => {
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
            {status === 'loading' && (
                <div style={{
                    color: '#00FF41',
                    fontFamily: 'var(--font-primary)',
                    fontSize: '16px',
                    textAlign: 'center'
                }}>
                    LOADING...
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
                    imageRendering: 'pixelated'
                }}
            />

            {status === 'running' && isGameOver && (
                <button
                    onClick={handleRetry}
                    style={{
                        marginTop: '10px',
                        padding: '8px 20px',
                        backgroundColor: 'var(--primary)',
                        color: '#000',
                        border: 'none',
                        fontFamily: 'var(--font-primary)',
                        fontSize: '14px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    RETRY
                </button>
            )}
        </div>
    );
};

export default PyodideRunner;
