import React from 'react';

// Sidebar: Authentic "Icon Box + Label Box" layout
interface SidebarProps {
    onOpenGame?: (gameId: string) => void;
    isMobile?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ onOpenGame, isMobile = false }) => {
    const games: { id: string; label: string; icon: string; iconSrc: string; isVideo?: boolean }[] = [
        { id: 'SNAKE', label: 'snake', icon: '🐍', iconSrc: '/games/snake/icon.png' },
        { id: 'TETRIS', label: 'tetris', icon: '🧱', iconSrc: '/games/tetris/icon.png' },
        { id: 'BREAKOUT', label: 'breakout', icon: '🏐', iconSrc: '/games/breakout/icon.png' },
        { id: 'INVADERS', label: 'invaders', icon: '👾', iconSrc: '/games/spaceinvaders/icon.png' },
        { id: 'CHESS', label: 'chess', icon: '♔', iconSrc: '/games/chess/icon.png' },
    ];

    // Additional "fake" links to match the density of the reference image
    const links = [
        { label: 'about', icon: '📜', id: 'about', iconSrc: '/icons/about.png' },
        { label: 'scores', icon: '🎮', id: 'SCORES', iconSrc: '/icons/controls.png' },
        { label: 'tech stack', icon: '💻', id: 'TECH_STACK', iconSrc: '/icons/techstack.png' },
        { label: 'music', icon: '🎵', id: 'MUSIC', iconSrc: '/icons/music.png' },
        { label: 'photos', icon: '🖼️', id: 'PHOTOS', iconSrc: '/icons/photos.png' },
    ];

    const SidebarItem = ({ label, icon, iconSrc, isVideo, onClick }: { label: string, icon: string, iconSrc?: string, isVideo?: boolean, onClick?: () => void }) => {
        return (
            <div style={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                marginBottom: isMobile ? '0' : '8px',
                marginRight: isMobile ? '4px' : '0',
                cursor: 'pointer',
                alignItems: isMobile ? 'center' : 'stretch'
            }} onClick={onClick} className="sidebar-hover-container sidebar-item" title={label}>
                {/* Icon Box */}
                <div style={{
                    width: isMobile ? '36px' : '48px',
                    height: isMobile ? '36px' : '48px',
                    border: isMobile ? '2px solid var(--primary)' : '3px solid var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: isMobile ? '16px' : '24px',
                    marginRight: isMobile ? '0' : '4px',
                    flexShrink: 0,
                    overflow: 'hidden',
                    position: 'relative',
                    backgroundColor: 'black'
                }} className="sidebar-box">
                    {iconSrc ? (
                        isVideo ? (
                            <video
                                src={iconSrc}
                                autoPlay
                                loop
                                muted
                                playsInline
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover'
                                }}
                            />
                        ) : (
                            <img
                                src={iconSrc}
                                alt={label}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    imageRendering: 'pixelated',
                                    filter: label === 'chess' ? 'invert(100%) sepia(100%) saturate(500%) hue-rotate(80deg) brightness(1.2) drop-shadow(0 0 2px #00FF41)' : 'none'
                                }}
                            />
                        )
                    ) : (
                        icon
                    )}
                </div>

                {/* Label Box - hidden on mobile */}
                {!isMobile && (
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
                    }} className="sidebar-box label-box">
                        {label}
                    </div>
                )}
            </div>
        );
    };

    // Mobile layout - horizontal scrollable
    if (isMobile) {
        return (
            <nav style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: '4px',
                padding: '4px',
                flexWrap: 'nowrap'
            }}>
                {/* Games */}
                {games.map(game => (
                    <SidebarItem
                        key={game.id}
                        label={game.label}
                        icon={game.icon}
                        iconSrc={game.iconSrc}
                        isVideo={game.isVideo}
                        onClick={() => onOpenGame && onOpenGame(game.id)}
                    />
                ))}

                {/* Small separator */}
                <div style={{ width: '1px', height: '36px', backgroundColor: 'var(--primary)', margin: '0 2px', flexShrink: 0 }}></div>



                {/* Links */}
                {links.map((link, i) => (
                    <SidebarItem
                        key={i}
                        label={link.label}
                        icon={link.icon}
                        iconSrc={link.iconSrc}
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
    }

    // Desktop layout - vertical
    return (
        <nav style={{
            height: '100%',
            borderRight: '4px solid var(--primary)',
            padding: '10px',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'rgba(0,0,0,0.9)',
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
                    iconSrc={game.iconSrc}
                    isVideo={game.isVideo}
                    onClick={() => onOpenGame && onOpenGame(game.id)}
                />
            ))}



            <div style={{ height: '20px' }}></div>

            {/* Header for Info */}
            <div style={{
                color: 'var(--primary)',
                marginBottom: '10px',
                border: '4px solid var(--primary)',
                padding: '4px 8px',
                fontWeight: 'bold',
                backgroundColor: 'black'
            }}>
                info.dir
            </div>

            {/* Links List */}
            {links.map((link, i) => (
                <SidebarItem
                    key={i}
                    label={link.label}
                    icon={link.icon}
                    iconSrc={link.iconSrc}
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
