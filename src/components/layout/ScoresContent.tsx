import React, { useEffect, useState } from 'react';
import { ScoreService } from '../../services/ScoreService';
import { auth } from '../../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';

const ScoresContent: React.FC = () => {
    const [scores, setScores] = useState<Record<string, any[]>>({});
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [selectedGame, setSelectedGame] = useState<string>('INVADERS');
    const games = ['SNAKE', 'TETRIS', 'BREAKOUT', 'INVADERS', 'PACMAN'];

    useEffect(() => {
        const unsubAuth = onAuthStateChanged(auth, (user) => setCurrentUser(user));
        const unsubscribers: (() => void)[] = [];

        games.forEach(game => {
            const unsub = ScoreService.subscribeToHighScores(game.toLowerCase(), (data) => {
                setScores(prev => ({ ...prev, [game]: data }));
            });
            unsubscribers.push(unsub);
        });

        return () => {
            unsubAuth();
            unsubscribers.forEach(fn => fn());
        };
    }, []);

    const isMyScore = (entry: any) => {
        if (!currentUser) return false;
        if (entry.userId && entry.userId === currentUser.uid) return true;
        if (entry.username && currentUser.displayName && entry.username === currentUser.displayName) return true;
        return false;
    };

    // Correct colors from reference image
    const getHitColor = (rank: number) => {
        const colors = [
            '#9933FF', // 1ST - Purple
            '#FF00FF', // 2ND - Pink/Magenta
            '#FF0000', // 3RD - Red
            '#FF9900', // 4TH - Orange
            '#CCFF00', // 5TH - Lime/Yellow
            '#00FF00', // 6TH - Green
            '#00FF99', // 7TH - Teal
            '#00CCFF', // 8TH - Sky Blue
            '#3366FF', // 9TH - Blue
            '#0000FF'  // 10TH - Dark Blue
        ];
        return colors[rank % colors.length];
    };

    const currentScores = scores[selectedGame] || [];
    // Ensure we always show 10 rows, filling with placeholders if needed
    const displayScores = [...currentScores];
    while (displayScores.length < 10) {
        displayScores.push({ username: '---', score: 0, isPlaceholder: true });
    }

    return (
        <div style={{
            backgroundColor: '#000000',
            fontFamily: '"Press Start 2P", monospace',
            minHeight: '100%',
            color: '#FFFFFF',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '20px',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Starfield Background */}
            <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundImage: 'radial-gradient(white 1px, transparent 1px)',
                backgroundSize: '50px 50px',
                opacity: 0.2,
                pointerEvents: 'none'
            }} />

            {/* Header / Credits */}
            <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                <span style={{ fontSize: '16px', color: '#FFFFFF' }}>CREDITS 00</span>
            </div>

            {/* Game Title Logo Style */}
            <h1 style={{
                fontSize: '48px',
                textAlign: 'center',
                margin: '0 0 10px 0',
                textTransform: 'uppercase',
                background: 'linear-gradient(180deg, #FFFF00 0%, #0000FF 100%)', // Reversed gradient for visual pop or adjust to match
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(4px 4px 0px #000)',
                lineHeight: '1.2',
                letterSpacing: '5px'
            }}>
                {selectedGame}
            </h1>

            {/* "HIGH SCORES" Subheader */}
            <div style={{
                fontSize: '24px',
                color: '#66FFFF', // Light Cyan
                marginBottom: '40px',
                letterSpacing: '2px',
                textShadow: '2px 2px #0000FF',
                textTransform: 'uppercase'
            }}>
                HIGH SCORES
            </div>

            {/* Score Table */}
            <div style={{ width: '100%', maxWidth: '600px' }}>
                {displayScores.map((entry, i) => {
                    const color = getHitColor(i);
                    const rankSuffix = i === 0 ? 'ST' : i === 1 ? 'ND' : i === 2 ? 'RD' : 'TH';
                    const rankText = `${i + 1}${rankSuffix}`;

                    return (
                        <div key={i} style={{
                            display: 'grid',
                            gridTemplateColumns: '80px 1fr 120px',
                            gap: '20px',
                            fontSize: '20px',
                            marginBottom: '10px',
                            color: color,
                            textShadow: '2px 2px 0px #000'
                        }}>
                            {/* Rank */}
                            <div style={{ textAlign: 'left' }}>
                                {rankText}
                            </div>

                            {/* Name */}
                            <div style={{
                                textAlign: 'left', // Aligned left per reference
                                color: isMyScore(entry) ? '#FFFFFF' : color,
                                animation: isMyScore(entry) ? 'blink 1s step-end infinite' : 'none'
                            }}>
                                {entry.username ? entry.username.substring(0, 10).toUpperCase() : '---'}
                            </div>

                            {/* Score */}
                            <div style={{ textAlign: 'right' }}>
                                {entry.score.toString().padStart(5, '0')}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Game Selector (Bottom) */}
            <div style={{
                marginTop: 'auto',
                paddingTop: '40px',
                display: 'flex',
                gap: '15px',
                flexWrap: 'wrap',
                justifyContent: 'center'
            }}>
                {games.map(g => (
                    <button
                        key={g}
                        onClick={() => setSelectedGame(g)}
                        style={{
                            background: 'none',
                            border: selectedGame === g ? '2px solid #FF0000' : '2px solid transparent',
                            color: selectedGame === g ? '#FFFF00' : '#888',
                            fontFamily: '"Press Start 2P", monospace',
                            fontSize: '10px',
                            padding: '10px',
                            cursor: 'pointer',
                            textTransform: 'uppercase'
                        }}
                    >
                        {g}
                    </button>
                ))}
            </div>

            <style>{`
                @keyframes blink {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0; }
                }
            `}</style>
        </div>
    );
};

export default ScoresContent;
