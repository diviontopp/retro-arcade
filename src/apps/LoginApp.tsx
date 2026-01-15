import React, { useState, useEffect } from 'react';
import { auth } from '../services/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile } from 'firebase/auth';
import type { User } from 'firebase/auth';

export const LoginApp: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState('');
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
        });
        return () => unsubscribe();
    }, []);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');
        setErrorMsg('');

        // Construct faux email for Firebase Auth
        const email = `${username.toLowerCase().replace(/\s+/g, '')}@arcade.local`;

        try {
            if (isRegistering) {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                // Update display name immediately
                await updateProfile(userCredential.user, {
                    displayName: username
                });
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }
            setStatus('success');
            setUsername('');
            setPassword('');
        } catch (err: any) {
            console.error(err);
            setStatus('error');
            // Friendly error messages
            let msg = err.message.replace('Firebase: ', '');
            if (msg.includes('auth/invalid-email')) msg = 'INVALID USERNAME FORMAT';
            if (msg.includes('auth/user-not-found')) msg = 'USER NOT FOUND';
            if (msg.includes('auth/wrong-password')) msg = 'WRONG PASSWORD';
            if (msg.includes('auth/email-already-in-use')) msg = 'USERNAME TAKEN';
            setErrorMsg(msg);
        }
    };

    const handleLogout = async () => {
        await signOut(auth);
        setStatus('idle');
    };

    if (currentUser) {
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
                textAlign: 'center'
            }}>
                <h2 style={{ color: '#00FF41', marginBottom: '20px', textShadow: '2px 2px 0px #003300' }}>
                    ACCESS GRANTED
                </h2>
                <div style={{ marginBottom: '20px', fontSize: '12px' }}>
                    USER: {currentUser.displayName?.toUpperCase() || username.toUpperCase()}
                </div>
                <div style={{ marginBottom: '30px', fontSize: '10px', color: '#888' }}>
                    ID: {currentUser.uid.slice(0, 8)}...
                </div>
                <button
                    onClick={handleLogout}
                    style={{
                        padding: '12px 24px',
                        backgroundColor: 'red',
                        color: 'white',
                        border: 'none',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        boxShadow: '4px 4px 0px rgba(0,0,0,0.5)'
                    }}
                >
                    LOGOUT
                </button>
            </div>
        );
    }

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
                textShadow: '2px 2px 0px maroon',
                fontSize: '18px'
            }}>
                {isRegistering ? 'NEW USER REGISTRATION' : 'SYSTEM ACCESS CONTROL'}
            </h2>

            <form onSubmit={handleAuth} style={{ width: '100%', maxWidth: '280px' }}>
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '10px' }}>USERNAME:</label>
                    <input
                        type="text"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        required
                        placeholder="ENTER USERNAME"
                        style={{
                            width: '100%',
                            padding: '10px',
                            backgroundColor: 'black',
                            border: '2px solid var(--primary)',
                            color: 'var(--primary)',
                            fontFamily: 'inherit',
                            outline: 'none',
                            fontSize: '12px',
                            textTransform: 'uppercase'
                        }}
                    />
                </div>

                <div style={{ marginBottom: '25px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '10px' }}>PASSWORD:</label>
                    <input
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        placeholder="••••••"
                        style={{
                            width: '100%',
                            padding: '10px',
                            backgroundColor: 'black',
                            border: '2px solid var(--primary)',
                            color: 'var(--primary)',
                            fontFamily: 'inherit',
                            outline: 'none',
                            fontSize: '12px'
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
                        boxShadow: '4px 4px 0px rgba(0,0,0,0.5)',
                        marginBottom: '15px'
                    }}
                >
                    {status === 'loading' ? 'PROCESSING...' : (isRegistering ? 'REGISTER' : 'LOG IN')}
                </button>
            </form>

            <div style={{ fontSize: '10px', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setIsRegistering(!isRegistering)}>
                {isRegistering ? 'ALREADY HAVE AN ACCOUNT? LOGIN' : 'NO ACCOUNT? REGISTER HERE'}
            </div>

            {status === 'error' && (
                <div style={{ marginTop: '20px', color: 'red', textAlign: 'center', fontSize: '10px', maxWidth: '250px' }}>
                    ERROR: {errorMsg.toUpperCase()}
                </div>
            )}
        </div>
    );
};
