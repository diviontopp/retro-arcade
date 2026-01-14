import React, { useEffect, useState } from 'react';



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
