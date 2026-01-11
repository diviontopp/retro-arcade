import React, { useEffect, useState, useRef } from 'react';

// Starfield background component
export const Starfield: React.FC = () => {
    const [stars, setStars] = useState<Array<{ x: number; y: number; duration: number; delay: number }>>([]);

    useEffect(() => {
        // Generate 100 random stars
        const newStars = Array.from({ length: 100 }, () => ({
            x: Math.random() * 100,
            y: Math.random() * 100,
            duration: 2 + Math.random() * 4,
            delay: Math.random() * 3
        }));
        setStars(newStars);
    }, []);

    return (
        <div className="starfield">
            {stars.map((star, i) => (
                <div
                    key={i}
                    className="star"
                    style={{
                        left: `${star.x}%`,
                        top: `${star.y}%`,
                        '--duration': `${star.duration}s`,
                        '--delay': `${star.delay}s`
                    } as React.CSSProperties}
                />
            ))}
        </div>
    );
};

// Particle effects component (for ladybug/bug animations)
export const Particles: React.FC<{ active: boolean }> = ({ active }) => {
    const [particles, setParticles] = useState<Array<{ id: number; x: number; emoji: string; duration: number; delay: number; drift: number }>>([]);

    useEffect(() => {
        if (active) {
            const emojis = ['🐞', '🪲', '🦋', '🐛'];
            const newParticles = Array.from({ length: 15 }, (_, i) => ({
                id: Date.now() + i,
                x: Math.random() * 100,
                emoji: emojis[Math.floor(Math.random() * emojis.length)],
                duration: 8 + Math.random() * 4,
                delay: Math.random() * 2,
                drift: -50 + Math.random() * 100
            }));
            setParticles(prev => [...prev, ...newParticles]);

            // Remove particles after animation
            setTimeout(() => {
                setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
            }, 12000);
        }
    }, [active]);

    return (
        <>
            {particles.map(particle => (
                <div
                    key={particle.id}
                    className="particle"
                    style={{
                        left: `${particle.x}%`,
                        bottom: '-50px',
                        '--float-duration': `${particle.duration}s`,
                        '--float-delay': `${particle.delay}s`,
                        '--drift': `${particle.drift}px`
                    } as React.CSSProperties}
                >
                    {particle.emoji}
                </div>
            ))}
        </>
    );
};

// Scanline effect component
export const Scanline: React.FC = () => (
    <div className="scanline" />
);

// AnimatedAvatar component with chroma keying for transparent background
export const AnimatedAvatar: React.FC<{ src: string; alt: string }> = ({ src, alt }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const img = new Image();
        img.src = src;
        img.onload = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (!ctx) return;

            const w = img.width;
            const h = img.height;
            canvas.width = w;
            canvas.height = h;

            // Draw original image
            ctx.drawImage(img, 0, 0);

            // Access pixel data
            const imageData = ctx.getImageData(0, 0, w, h);
            const data = imageData.data;

            // Helper to check if pixel is "black-ish" background
            // We use a small threshold to catch compression artifacts if any, 
            // but usually for pixel art exact 0,0,0 is fine. 
            // Using < 20 for safety based on previous step.
            const isBlack = (idx: number) => {
                return data[idx] < 20 && data[idx + 1] < 20 && data[idx + 2] < 20;
            };

            // 1. Identify Background Mask (Flood Fill)
            // 0 = Body/Color/Internal-Black
            // 1 = Candidate Background (Connected Black)
            const typeMask = new Uint8Array(w * h); // Default 0

            // Stack for Flood Fill
            const stack: number[] = [];
            const addStack = (x: number, y: number) => {
                if (x < 0 || x >= w || y < 0 || y >= h) return;
                const idx = y * w + x;
                if (typeMask[idx] === 1) return; // Already visited/marked

                // If it is black, it's a candidate for BG
                if (isBlack(idx * 4)) {
                    typeMask[idx] = 1;
                    stack.push(idx);
                }
            };

            // Seed corners
            addStack(0, 0);
            addStack(w - 1, 0);

            // Process Flood Fill
            while (stack.length > 0) {
                const idx = stack.pop()!;
                const cx = idx % w;
                const cy = Math.floor(idx / w);

                addStack(cx - 1, cy);
                addStack(cx + 1, cy);
                addStack(cx, cy - 1);
                addStack(cx, cy + 1);
            }

            // 2. Dilation (Thick Outline Preservation)
            // We want to turn '1' (Candidate BG) back into '0' (Body) if it's close to '0'.
            // We run this for N iterations to preserve N-pixel thick black borders.
            const DILATION_CYCLES = 12; // Increased to preserve hoodie interior

            for (let i = 0; i < DILATION_CYCLES; i++) {
                const toFlip: number[] = [];

                for (let y = 0; y < h; y++) {
                    for (let x = 0; x < w; x++) {
                        const idx = y * w + x;
                        if (typeMask[idx] === 1) { // It's currently BG
                            // Check connections to Body (0)
                            let touchBody = false;

                            // Check 4 neighbors
                            if (x > 0 && typeMask[idx - 1] === 0) touchBody = true;
                            else if (x < w - 1 && typeMask[idx + 1] === 0) touchBody = true;
                            else if (y > 0 && typeMask[idx - w] === 0) touchBody = true;
                            else if (y < h - 1 && typeMask[idx + w] === 0) touchBody = true;

                            // Check diagonals (8-way dilation for smoother corners)
                            else if (x > 0 && y > 0 && typeMask[idx - w - 1] === 0) touchBody = true;
                            else if (x < w - 1 && y > 0 && typeMask[idx - w + 1] === 0) touchBody = true;
                            else if (x > 0 && y < h - 1 && typeMask[idx + w - 1] === 0) touchBody = true;
                            else if (x < w - 1 && y < h - 1 && typeMask[idx + w + 1] === 0) touchBody = true;

                            if (touchBody) {
                                toFlip.push(idx);
                            }
                        }
                    }
                }

                if (toFlip.length === 0) break; // Optimization

                for (const idx of toFlip) {
                    typeMask[idx] = 0; // Flip to Body
                }
            }

            // 3. Apply Transparency
            for (let i = 0; i < typeMask.length; i++) {
                if (typeMask[i] === 1) {
                    data[i * 4 + 3] = 0; // Set Alpha to 0
                }
            }

            ctx.putImageData(imageData, 0, 0);
        };
    }, [src]);

    return (
        <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'end',
            justifyContent: 'center',
            paddingBottom: '0'
        }}>
            <canvas
                ref={canvasRef}
                className="bounce"
                title={alt}
                style={{
                    width: 'auto',
                    height: 'auto',
                    maxWidth: '100%',
                    maxHeight: '100%',
                    imageRendering: 'pixelated',
                    objectFit: 'contain'
                }}
            />
        </div>
    );
};

// Click effect component
export const ClickEffect: React.FC = () => {
    const [clicks, setClicks] = useState<Array<{ id: number; x: number; y: number }>>([]);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            const id = Date.now();
            setClicks(prev => [...prev, { id, x: e.clientX, y: e.clientY }]);
            setTimeout(() => {
                setClicks(prev => prev.filter(c => c.id !== id));
            }, 500);
        };

        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 99999 }}>
            {clicks.map(click => (
                <div
                    key={click.id}
                    style={{
                        position: 'absolute',
                        left: click.x - 10,
                        top: click.y - 10,
                        width: '20px',
                        height: '20px',
                        border: '2px solid var(--primary)',
                        borderRadius: '50%',
                        animation: 'ping 0.5s ease-out forwards'
                    }}
                />
            ))}
            <style>{`
                @keyframes ping {
                    0% { transform: scale(0.5); opacity: 1; }
                    100% { transform: scale(2); opacity: 0; }
                }
            `}</style>
        </div>
    );
};
