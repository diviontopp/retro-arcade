/**
 * ═══════════════════════════════════════════════════════════════
 * MOBILE CONTROLS — Swipe-based Game Controls
 * ═══════════════════════════════════════════════════════════════
 * 
 * Provides swipe gesture controls for mobile gameplay.
 * Integrates with the same KEY_STATE system used by keyboard input.
 */

import React, { useEffect, useState, useRef } from 'react';

interface MobileControlsProps {
    gameType: string;
}

const MobileControls: React.FC<MobileControlsProps> = ({ gameType }) => {
    // 1. Hooks MUST be declared unconditionally at the top level
    const [isMobile, setIsMobile] = useState(false);
    const [showInstructions, setShowInstructions] = useState(true);

    const touchStart = useRef<{ x: number; y: number } | null>(null);
    const touchEnd = useRef<{ x: number; y: number } | null>(null);
    const keyTimeouts = useRef<{ [key: number]: number }>({});

    // 2. Effect: Detect Mobile
    useEffect(() => {
        const checkMobile = () => {
            const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
            const isIPad = /iPad/.test(userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

            // Broader check for any touch device up to small laptop size
            const hasTouch = (navigator.maxTouchPoints && navigator.maxTouchPoints > 0);
            const mobile = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent) ||
                isIPad ||
                (hasTouch && window.innerWidth <= 1366) ||
                window.innerWidth <= 1024;

            setIsMobile(!!mobile);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // 3. Helper: Trigger Key
    const triggerKey = (keyCode: number, turbo: boolean = false) => {
        if (!(window as any).KEY_STATE) return;

        try {
            if (keyTimeouts.current[keyCode]) {
                clearTimeout(keyTimeouts.current[keyCode]);
            }

            (window as any).KEY_STATE[keyCode] = 2; // Press

            const duration = turbo ? 50 : 100;

            keyTimeouts.current[keyCode] = setTimeout(() => {
                if ((window as any).KEY_STATE) {
                    (window as any).KEY_STATE[keyCode] = 0; // Release
                }
                delete keyTimeouts.current[keyCode];
            }, duration) as unknown as number;

        } catch (error) {
            console.error('Error triggering key:', error);
        }
    };

    // 4. Effect: Swipe & Tap Detection
    useEffect(() => {
        if (!isMobile) return;

        const isBreakout = gameType === 'breakout';
        const isInvaders = gameType === 'invaders';
        const isTurbo = isBreakout || isInvaders;

        const minSwipeDistance = isTurbo ? 5 : 20;

        const handleTouchStart = (e: TouchEvent) => {
            const target = e.target as HTMLElement;
            if (!target.tagName || target.tagName !== 'CANVAS') return;

            touchEnd.current = null;
            touchStart.current = {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY
            };
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (!touchStart.current) return;

            if (e.cancelable) e.preventDefault();

            touchEnd.current = {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY
            };

            // Turbo mode (Breakout/Invaders) - Continuous movement
            if (isTurbo && touchEnd.current) {
                const xDiff = touchStart.current.x - touchEnd.current.x;
                if (Math.abs(xDiff) > 2) {
                    if (xDiff > 0) triggerKey(2, true); // Left
                    else triggerKey(3, true); // Right
                    touchStart.current = touchEnd.current;
                }
            }
        };

        const handleTouchEnd = () => {
            if (!touchStart.current || !touchEnd.current) return;

            if (isTurbo) {
                touchStart.current = null;
                touchEnd.current = null;
                return;
            }

            const xDiff = touchStart.current.x - touchEnd.current.x;
            const yDiff = touchStart.current.y - touchEnd.current.y;

            if (Math.abs(xDiff) > Math.abs(yDiff)) {
                // Horizontal
                if (Math.abs(xDiff) > minSwipeDistance) {
                    if (xDiff > 0) triggerKey(2); // Left
                    else triggerKey(3); // Right
                }
            } else {
                // Vertical
                if (Math.abs(yDiff) > minSwipeDistance) {
                    if (yDiff > 0) {
                        triggerKey(0); // Swipe UP (Up Arrow/Rotate)
                    } else {
                        triggerKey(1); // Swipe DOWN (Down Arrow)
                    }
                }
            }

            touchStart.current = null;
            touchEnd.current = null;
        };

        const handleTap = (e: TouchEvent) => {
            const target = e.target as HTMLElement;
            if (!target.tagName || target.tagName !== 'CANVAS') return;
            if (!touchStart.current || touchEnd.current) return;

            // Tap detection logic
            const tapX = e.changedTouches[0].clientX;
            const tapY = e.changedTouches[0].clientY;

            if (touchStart.current &&
                Math.abs(tapX - touchStart.current.x) < 10 &&
                Math.abs(tapY - touchStart.current.y) < 10) {

                // Generic Tap = SPACE (Action/Drop)
                triggerKey(4);
            }
        };

        document.addEventListener('touchstart', handleTouchStart, { passive: true });
        document.addEventListener('touchmove', handleTouchMove, { passive: false });
        document.addEventListener('touchend', handleTouchEnd);
        document.addEventListener('touchend', handleTap);

        return () => {
            document.removeEventListener('touchstart', handleTouchStart);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleTouchEnd);
            document.removeEventListener('touchend', handleTap);
        };
    }, [isMobile, gameType]);

    // 5. Effect: Fade Instructions
    useEffect(() => {
        if (!isMobile) return;
        const timer = setTimeout(() => setShowInstructions(false), 5000);
        return () => clearTimeout(timer);
    }, [isMobile]);

    // 6. Effect: Flash Instructions on Touch
    useEffect(() => {
        if (!isMobile) return;

        const flashInstructions = () => {
            if (!showInstructions) {
                setShowInstructions(true);
                setTimeout(() => setShowInstructions(false), 2000);
            }
        };

        document.addEventListener('touchstart', flashInstructions, { capture: true });
        return () => document.removeEventListener('touchstart', flashInstructions, { capture: true });
    }, [isMobile, showInstructions]);

    // 7. Render
    if (!isMobile) return null;

    const getInstructions = () => {
        switch (gameType) {
            case 'snake': return 'SWIPE TO MOVE';
            case 'tetris': return 'SWIPE LEFT/RIGHT TO MOVE • SWIPE UP TO ROTATE • TAP TO DROP';
            case 'breakout': return 'SWIPE LEFT/RIGHT TO MOVE PADDLE • TAP TO LAUNCH';
            case 'invaders': return 'SWIPE LEFT/RIGHT TO MOVE • TAP TO FIRE';
            case 'chess': return 'TAP TO SELECT AND MOVE PIECES';
            default: return 'SWIPE TO MOVE • TAP FOR ACTION';
        }
    };

    return (
        <>
            {/* Swipe Instructions */}
            <div style={{
                position: 'fixed',
                bottom: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                border: '1px solid rgba(0, 255, 65, 0.5)',
                borderRadius: '20px',
                padding: '8px 16px',
                color: '#00FF41',
                fontFamily: '"Press Start 2P", monospace',
                fontSize: '10px',
                textAlign: 'center',
                zIndex: 1000,
                maxWidth: '90%',
                lineHeight: '1.5',
                pointerEvents: 'none',
                opacity: showInstructions ? 1 : 0,
                transition: 'opacity 1s ease-in-out',
                textShadow: '0 1px 2px black'
            }}>
                {getInstructions()}
            </div>

            {/* Rotate Device Overlay */}
            <div className="rotate-warning" style={{
                display: 'none',
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                backgroundColor: 'rgba(0,0,0,0.95)',
                zIndex: 9999,
                color: '#fff',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center',
                padding: '20px',
                backdropFilter: 'blur(10px)'
            }}>
                <div style={{ fontSize: '48px', marginBottom: '20px', animation: 'spin 4s linear infinite' }}>⟳</div>
                <div style={{ fontFamily: '"Press Start 2P", monospace', color: 'var(--primary)', fontSize: '18px', marginBottom: '10px' }}>
                    PLEASE ROTATE
                </div>
                <div style={{ fontSize: '12px', color: '#aaa', maxWidth: '300px', lineHeight: '1.6' }}>
                    This arcade experience is optimized for landscape mode.
                </div>
            </div>

            <style>{`
                @media (max-width: 1024px) {
                    body { overscroll-behavior: none; }
                }
                @media (max-width: 1024px) and (orientation: portrait) {
                    .rotate-warning { display: flex !important; }
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </>
    );
};

export default MobileControls;
