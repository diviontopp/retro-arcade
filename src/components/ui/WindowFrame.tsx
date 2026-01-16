import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface WindowFrameProps {
    title: string;
    children: React.ReactNode;
    style?: React.CSSProperties;
    onClose: () => void;
    onMinimize?: () => void;
    onFocus?: () => void;
    id: string;
    className?: string;
}

const WindowFrame: React.FC<WindowFrameProps> = ({ title, children, style, onClose, onMinimize, onFocus, id, className }) => {
    // Determine start state based on passed style (e.g. 100% from App.tsx means maximized)
    const initialWidthStr = String(style?.width || '');

    const startMaximized = initialWidthStr === '100%' || initialWidthStr === '100vw';

    const [isMaximized, setIsMaximized] = useState(startMaximized);
    const [preMaximizeState, setPreMaximizeState] = useState({
        position: { x: style?.left as number || 100, y: style?.top as number || 100 },
        size: {
            width: startMaximized ? 800 : (style?.width ? parseInt(String(style.width)) : 300),
            height: startMaximized ? 600 : (style?.height ? parseInt(String(style.height)) : 300)
        }
    });

    const [position, setPosition] = useState({
        x: startMaximized ? 0 : (style?.left as number || 100),
        y: startMaximized ? 0 : (style?.top as number || 100)
    });

    const [size, setSize] = useState({
        width: startMaximized ? window.innerWidth : (style?.width ? parseInt(String(style.width)) : 300),
        height: startMaximized ? window.innerHeight : (style?.height ? parseInt(String(style.height)) : 300)
    });

    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const frameRef = useRef<HTMLDivElement>(null);

    // Mobile detection for UI scaling
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);
    const [isShortScreen, setIsShortScreen] = useState(window.innerHeight <= 600); // 600px threshold for landscape phones

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 1024);
            setIsShortScreen(window.innerHeight <= 600);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Condensed header for landscape mobile or short screens
    const useCompactHeader = isMobile && isShortScreen;

    const headerHeight = useCompactHeader ? '32px' : (isMobile ? '44px' : '28px');
    const buttonSize = useCompactHeader ? '24px' : (isMobile ? '34px' : '20px');
    const iconScale = useCompactHeader ? 1.0 : (isMobile ? 1.5 : 1);

    // Handle dragging
    const handleMouseDown = (e: React.MouseEvent) => {
        onFocus?.();
        if ((e.target as HTMLElement).closest('.window-header') && !isMaximized) {
            setIsDragging(true);
            setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
        }
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        onFocus?.();
        if ((e.target as HTMLElement).closest('.window-header') && !isMaximized) {
            const touch = e.touches[0];
            setIsDragging(true);
            document.body.style.overflow = 'hidden';
            setDragStart({ x: touch.clientX - position.x, y: touch.clientY - position.y });
        }
    };

    // Handle resizing
    const handleResizeStart = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isMaximized) {
            setIsResizing(true);
            setDragStart({ x: e.clientX, y: e.clientY });
        }
    };

    const handleTouchResizeStart = (e: React.TouchEvent) => {
        e.stopPropagation();
        if (!isMaximized) {
            const touch = e.touches[0];
            setIsResizing(true);
            document.body.style.overflow = 'hidden';
            setDragStart({ x: touch.clientX, y: touch.clientY });
        }
    };

    // Update size logic for dragging/resizing
    useEffect(() => {
        const handleMove = (e: MouseEvent) => {
            if (isDragging && !isMaximized) {
                setPosition({
                    x: e.clientX - dragStart.x,
                    y: e.clientY - dragStart.y
                });
            }
            if (isResizing && !isMaximized) {
                const frame = frameRef.current;
                if (!frame) return;
                const rect = frame.getBoundingClientRect();
                setSize({
                    width: e.clientX - rect.left,
                    height: e.clientY - rect.top
                });
            }
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (isDragging && !isMaximized) {
                e.preventDefault(); // Prevent scroll
                const touch = e.touches[0];
                setPosition({
                    x: touch.clientX - dragStart.x,
                    y: touch.clientY - dragStart.y
                });
            }
            if (isResizing && !isMaximized) {
                e.preventDefault(); // Prevent scroll
                const touch = e.touches[0];
                const frame = frameRef.current;
                if (!frame) return;
                const rect = frame.getBoundingClientRect();
                setSize({
                    width: touch.clientX - rect.left,
                    height: touch.clientY - rect.top
                });
            }
        };

        const handleUp = () => {
            setIsDragging(false);
            setIsResizing(false);
            document.body.style.overflow = 'auto';
        };

        if (isDragging || isResizing) {
            window.addEventListener('mousemove', handleMove);
            window.addEventListener('mouseup', handleUp);
            window.addEventListener('touchmove', handleTouchMove, { passive: false });
            window.addEventListener('touchend', handleUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', handleUp);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleUp);
        };
    }, [isDragging, isResizing, dragStart, isMaximized]);

    // Handle Maximize Toggle
    const toggleMaximize = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isMaximized) {
            // Restore
            setPosition(preMaximizeState.position);
            setSize(preMaximizeState.size);
            setIsMaximized(false);
        } else {
            // Maximize
            setPreMaximizeState({ position, size });
            setPosition({ x: 0, y: 0 });
            setSize({ width: window.innerWidth, height: window.innerHeight });
            setIsMaximized(true);
        }
    };

    // Resize Listener for Maximized
    useEffect(() => {
        const handleResize = () => {
            if (isMaximized) {
                setSize({ width: window.innerWidth, height: window.innerHeight });
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isMaximized]);

    const windowContent = (
        <div
            id={id}
            ref={frameRef}
            className={`${className} ${isMaximized ? 'maximized' : ''}`}
            style={{
                position: isMaximized ? 'fixed' : 'absolute',
                left: isMaximized ? (isMobile ? 0 : '240px') : position.x, // Desktop: Preserve Sidebar
                top: isMaximized ? 0 : position.y,
                width: isMaximized ? (isMobile ? '100vw' : 'calc(100vw - 240px)') : size.width, // Desktop: Fill remaining width
                height: isMaximized ? (isMobile ? '100dvh' : 'calc(100vh - 60px)') : size.height, // Desktop: Preserve Taskbar
                borderTop: isMaximized ? 'none' : '4px solid var(--primary)',
                borderLeft: isMaximized ? 'none' : '4px solid var(--primary)',
                borderRight: isMaximized ? 'none' : '4px solid var(--primary)',
                borderBottom: '4px solid var(--primary)',
                backgroundColor: 'var(--color-void-black)',
                display: style?.display || 'flex', // Allow hiding via style prop (minimized)
                flexDirection: 'column',
                boxShadow: isMaximized ? 'none' : '6px 6px 0px rgba(0,0,0,0.5)',
                zIndex: isMaximized ? 5000 : 1000,
                userSelect: isDragging || isResizing ? 'none' : 'auto'
            }}
            onMouseDown={handleMouseDown}
        >
            {/* Header */}
            <div
                className="window-header"
                style={{
                    height: headerHeight,
                    borderBottom: '4px solid var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 8px',
                    cursor: isDragging ? 'grabbing' : 'grab',
                    backgroundColor: 'var(--primary)',
                    color: 'black',
                    fontWeight: 'bold',
                    touchAction: 'none'
                }}
                onTouchStart={handleTouchStart}
                onDoubleClick={toggleMaximize}
            >
                <span style={{ fontSize: isMobile ? '16px' : '14px' }}>{title}</span>
                <div style={{ display: 'flex', gap: isMobile ? '8px' : '4px', height: '100%', alignItems: 'center' }}>

                    {/* Minimize Button */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if (isMaximized) {
                                toggleMaximize(e); // "Restore Down" behavior
                            } else {
                                onMinimize && onMinimize();
                            }
                        }}
                        title="Minimize"
                        style={{
                            background: 'transparent', border: '1px solid black',
                            width: buttonSize, height: buttonSize, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', padding: 0
                        }}
                    >
                        <svg width={10 * iconScale} height={2 * iconScale} viewBox="0 0 10 2" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect width="10" height="2" fill="black" />
                        </svg>
                    </button>

                    {/* Maximize/Restore Button */}
                    <button
                        onClick={toggleMaximize}
                        title={isMaximized ? "Restore" : "Maximize"}
                        style={{
                            background: 'transparent', border: '1px solid black',
                            width: buttonSize, height: buttonSize, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', padding: 0
                        }}
                    >
                        {isMaximized ? (
                            <svg width={10 * iconScale} height={10 * iconScale} viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M2.5 2.5H9.5V9.5H2.5V2.5Z" stroke="black" strokeWidth="1.5" />
                                <path d="M0.5 0.5H7.5V7.5H0.5V0.5Z" stroke="black" strokeWidth="1.5" fill="none" />
                            </svg>
                        ) : (
                            <svg width={10 * iconScale} height={10 * iconScale} viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="0.5" y="0.5" width="9" height="9" stroke="black" strokeWidth="1.5" />
                            </svg>
                        )}
                    </button>

                    {/* Close Button */}
                    <button
                        onClick={(e) => { e.stopPropagation(); onClose(); }}
                        title="Close"
                        style={{
                            background: 'red', border: '1px solid black',
                            width: buttonSize, height: buttonSize, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', padding: 0, marginLeft: isMobile ? '8px' : '4px'
                        }}
                    >
                        <svg width={10 * iconScale} height={10 * iconScale} viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1 1L9 9M9 1L1 9" stroke="white" strokeWidth="2" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Content */}
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                {children}
            </div>

            {/* Resize handle */}
            {!isMaximized && (
                <div
                    onMouseDown={handleResizeStart}
                    onTouchStart={handleTouchResizeStart}
                    style={{
                        position: 'absolute',
                        right: 0,
                        bottom: 0,
                        width: isMobile ? '40px' : '30px',
                        height: isMobile ? '40px' : '30px',
                        cursor: 'nwse-resize',
                        background: 'linear-gradient(135deg, transparent 0%, transparent 45%, var(--primary) 50%, transparent 55%, transparent 100%)',
                        zIndex: 10,
                        touchAction: 'none'
                    }}
                    title="Resize"
                />
            )}
        </div>
    );

    if (isMaximized) {
        return createPortal(windowContent, document.body);
    }

    return windowContent;
};

export default WindowFrame;
