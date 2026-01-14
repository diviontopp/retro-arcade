import React from 'react';

// Sidebar: Authentic "Icon Box + Label Box" layout
interface SidebarProps {
    onOpenGame?: (gameId: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onOpenGame }) => {
    const games = [
        { id: 'SNAKE', label: 'snake', icon: '🐍' },
        { id: 'TETRIS', label: 'tetris', icon: '🧱' },
        { id: 'BREAKOUT', label: 'breakout', icon: '🏐' },
        { id: 'INVADERS', label: 'invaders', icon: '👾' },
        { id: 'ANTIGRAV', label: 'flappy bird', icon: '🐥' },
    ];

    // Additional "fake" links to match the density of the reference image
    const links = [
        { label: 'about', icon: '📜', id: 'about' },
        { label: 'tech stack', icon: '💻', id: 'TECH_STACK' },
        { label: 'music', icon: '🎵', id: 'MUSIC' },
        { label: 'photos', icon: '🖼️', id: 'PHOTOS' },
    ];

    const SidebarItem = ({ label, icon, onClick }: { label: string, icon: string, onClick?: () => void }) => (
        <div style={{ display: 'flex', marginBottom: '8px', cursor: 'pointer' }} onClick={onClick} className="sidebar-hover-container">
            {/* Icon Box */}
            <div style={{
                width: '48px',
                height: '48px',
                border: '4px solid var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                marginRight: '4px',
                flexShrink: 0
            }} className="sidebar-box">
                {icon}
            </div>

            {/* Label Box */}
            <div style={{
                flex: 1,
                height: '48px',
                border: '4px solid var(--primary)',
                display: 'flex',
                alignItems: 'center',
                paddingLeft: '10px',
                fontSize: '20px',
                fontWeight: 'bold',
                textTransform: 'lowercase',
                color: 'var(--primary)',
            }} className="sidebar-box">
                {label}
            </div>
        </div>
    );

    return (
        <nav style={{
            height: '100%',
            borderRight: '4px solid var(--primary)',
            padding: '10px',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'rgba(0,0,0,0.9)', // Restoring darker overlay
            imageRendering: 'pixelated',
            overflowY: 'auto'
        }}>
            {/* Header for Games */}
            <div style={{
                color: 'var(--primary)',
                marginBottom: '10px',
                border: '4px solid var(--primary)',
                padding: '4px 8px',
                fontWeight: 'bold',
                backgroundColor: 'black'
            }}>
                games.dir
            </div>

            {/* Game List */}
            {games.map(game => (
                <SidebarItem
                    key={game.id}
                    label={game.label}
                    icon={game.icon}
                    onClick={() => onOpenGame && onOpenGame(game.id)}
                />
            ))}

            {/* Controls Button */}
            <SidebarItem
                label="controls"
                icon="🎮"
                onClick={() => onOpenGame && onOpenGame('CONTROLS')}
            />

            <div style={{ height: '20px' }}></div>

            {/* Extra Links for aesthetic density */}
            {links.map((link, i) => (
                <SidebarItem
                    key={i}
                    label={link.label}
                    icon={link.icon}
                    onClick={() => link.id && onOpenGame && onOpenGame(link.id)}
                />
            ))}

            <style>{`
                .sidebar-hover-container:hover .sidebar-box {
                    background-color: var(--primary);
                    color: black !important;
                }
            `}</style>
        </nav>
    );
};

export default Sidebar;
