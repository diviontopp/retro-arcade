import React, { useState } from 'react';

export const LoginApp: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');
        // Simulate login delay
        setTimeout(() => {
            if (username && password) {
                setStatus('success');
                // Persist user session mock
                localStorage.setItem('arcade_user', JSON.stringify({ username }));
            } else {
                setStatus('error');
            }
        }, 1500);
    };

    return (
        <div style={{
            padding: '20px',
            color: 'var(--primary)',
            fontFamily: '"Press Start 2P", monospace',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            background: 'linear-gradient(135deg, #000 0%, #111 100%)'
        }}>
            <h2 style={{
                color: 'coral',
                marginBottom: '30px',
                textTransform: 'uppercase',
                textShadow: '2px 2px 0px maroon'
            }}>
                ACCESS CONTROL
            </h2>

            <form onSubmit={handleLogin} style={{ width: '100%', maxWidth: '280px' }}>
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px' }}>USERNAME:</label>
                    <input
                        type="text"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '10px',
                            backgroundColor: 'black',
                            border: '2px solid var(--primary)',
                            color: 'var(--primary)',
                            fontFamily: 'inherit',
                            outline: 'none'
                        }}
                    />
                </div>

                <div style={{ marginBottom: '25px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px' }}>PASSWORD:</label>
                    <input
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '10px',
                            backgroundColor: 'black',
                            border: '2px solid var(--primary)',
                            color: 'var(--primary)',
                            fontFamily: 'inherit',
                            outline: 'none'
                        }}
                    />
                </div>

                <button
                    type="submit"
                    disabled={status === 'loading'}
                    style={{
                        width: '100%',
                        padding: '12px',
                        backgroundColor: status === 'loading' ? '#333' : 'var(--primary)',
                        color: 'black',
                        border: 'none',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        boxShadow: '4px 4px 0px rgba(0,0,0,0.5)'
                    }}
                >
                    {status === 'loading' ? 'AUTHENTICATING...' : 'LOG IN'}
                </button>
            </form>

            {status === 'success' && (
                <div style={{ marginTop: '20px', color: '#00FF41', textAlign: 'center' }}>
                    ACCESS GRANTED.<br />WELCOME, {username.toUpperCase()}.
                </div>
            )}

            {status === 'error' && (
                <div style={{ marginTop: '20px', color: 'red', textAlign: 'center' }}>
                    INVALID CREDENTIALS.<br />TRY AGAIN.
                </div>
            )}
        </div>
    );
};
