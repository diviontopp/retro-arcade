import React, { useState, useRef, useEffect } from 'react';

interface WindowFrameProps {
    title: string;
    children: React.ReactNode;
    style?: React.CSSProperties;
    onClose: () => void;
    id: string;
    className?: string;
}

const WindowFrame: React.FC<WindowFrameProps> = ({ title, children, style, onClose, id, className }) => {
    const [position, setPosition] = useState({ x: style?.left as number || 100, y: style?.top as number || 100 });
    const [size, setSize] = useState({
        width: style?.width ? parseInt(String(style.width)) : 300,
        height: style?.height ? parseInt(String(style.height)) : 300
    });
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const frameRef = useRef<HTMLDivElement>(null);

    // Handle dragging
    const handleMouseDown = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('.window-header')) {
            setIsDragging(true);
            setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
        }
    };

    // Handle resizing
    const handleResizeStart = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsResizing(true);
        setDragStart({ x: e.clientX, y: e.clientY });
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                setPosition({
                    x: e.clientX - dragStart.x,
                    y: e.clientY - dragStart.y
                });
            } else if (isResizing) {
                const deltaX = e.clientX - dragStart.x;
                const deltaY = e.clientY - dragStart.y;
                setSize(prev => ({
                    width: Math.max(250, prev.width + deltaX),
                    height: Math.max(200, prev.height + deltaY)
                }));
                setDragStart({ x: e.clientX, y: e.clientY });
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            setIsResizing(false);
        };

        if (isDragging || isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDragging, isResizing, dragStart]);

    return (
        <div
            id={id}
            ref={frameRef}
            className={className}
            style={{
                position: 'absolute',
                left: position.x,
                top: position.y,
                width: size.width,
                height: size.height,
                border: '4px solid var(--primary)',
                backgroundColor: 'var(--color-void-black)',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '6px 6px 0px rgba(0,0,0,0.5)',
                zIndex: 1000,
                userSelect: isDragging || isResizing ? 'none' : 'auto'
            }}
            onMouseDown={handleMouseDown}
        >
            {/* Header */}
            <div
                className="window-header"
                style={{
                    height: '28px',
                    borderBottom: '4px solid var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 8px',
                    cursor: isDragging ? 'grabbing' : 'grab',
                    backgroundColor: 'var(--primary)',
                    color: 'black',
                    fontWeight: 'bold'
                }}
            >
                <span>{title}</span>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onClose();
                    }}
                    style={{
                        border: 'none',
                        background: 'red',
                        color: 'white',
                        fontWeight: 'bold',
                        padding: '2px 8px',
                        cursor: 'pointer',
                        fontSize: '14px'
                    }}
                >
                    ✖
                </button>
            </div>

            {/* Content */}
            <div style={{
                flex: 1,
                overflow: 'auto',
                position: 'relative'
            }}>
                {children}
            </div>

            {/* Resize handle */}
            <div
                onMouseDown={handleResizeStart}
                style={{
                    position: 'absolute',
                    right: 0,
                    bottom: 0,
                    width: '20px',
                    height: '20px',
                    cursor: 'nwse-resize',
                    background: 'linear-gradient(135deg, transparent 0%, transparent 45%, var(--primary) 50%, transparent 55%, transparent 100%)',
                    zIndex: 10
                }}
                title="Resize"
            />
        </div>
    );
};

export default WindowFrame;
