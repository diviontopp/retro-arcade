import React, { useEffect, useState } from 'react';
import { ScoreService } from '../../services/ScoreService';

const ScoresContent: React.FC = () => {
    const [scores, setScores] = useState<Record<string, any[]>>({});
    const [loading, setLoading] = useState(true);
    const games = ['SNAKE', 'TETRIS', 'BREAKOUT', 'INVADERS', 'ANTIGRAV'];

    useEffect(() => {
        const fetchScores = async () => {
            const allScores: Record<string, any[]> = {};
            for (const game of games) {
                // Get global scores (using lowercase game ID as key for consistency?)
                // ScoreService uses whatever string we pass. Let's use lowercase for keys.
                // Wait, sidebar uses uppercase IDs. Let's stick to lowercase for uniformity in database.
                const gameId = game.toLowerCase();
                const data = await ScoreService.getGlobalHighScores(gameId);
                allScores[game] = data; // use Uppercase for display grouping
            }
            setScores(allScores);
            setLoading(false);
        };
        fetchScores();
    }, []);

    const user = JSON.parse(localStorage.getItem('arcade_user') || '{}');

    return (
        <div style={{ padding: '10px', color: 'var(--primary)' }}>
            <h2 style={{ color: 'slateblue', marginBottom: '20px', textTransform: 'uppercase', borderBottom: '2px solid var(--primary)', paddingBottom: '10px' }}>
                Global Leaderboards
            </h2>

            {user.username && (
                <div style={{ marginBottom: '20px', color: '#00FF41' }}>
                    LOGGED IN AS: {user.username.toUpperCase()}
                </div>
            )}

            {loading ? (
                <div style={{ padding: '20px', textAlign: 'center', animation: 'blink 1s infinite' }}>LOADING DATA...</div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                    {games.map(game => (
                        <div key={game} style={{ border: '1px solid #333', padding: '10px' }}>
                            <div style={{
                                backgroundColor: 'black', color: 'coral',
                                padding: '5px', marginBottom: '10px', fontWeight: 'bold',
                                borderBottom: '1px solid coral'
                            }}>
                                {game}
                            </div>
                            {scores[game]?.length === 0 ? (
                                <div style={{ color: '#666', fontSize: '12px' }}>NO DATA</div>
                            ) : (
                                <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                                    <tbody>
                                        {scores[game]?.map((entry, i) => (
                                            <tr key={i} style={{ borderBottom: '1px dashed #222' }}>
                                                <td style={{ width: '20px', color: '#666' }}>{i + 1}.</td>
                                                <td style={{ color: entry.username === user.username ? '#00FF41' : 'var(--primary)' }}>
                                                    {entry.username.toUpperCase()}
                                                </td>
                                                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                                                    {entry.score}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    ))}
                </div>
            )}

            <style>{`@keyframes blink { 0%, 50% { opacity: 1; } 51%, 100% { opacity: 0; } }`}</style>
        </div>
    );
};

export default ScoresContent;
