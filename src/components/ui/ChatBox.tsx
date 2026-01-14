import React, { useState } from 'react';

interface ChatMessage {
    sender: string;
    text: string;
}

// Hardcoded chat box component
const ChatBox: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([
        { sender: 'system', text: 'welcome to the arcade...' },
        { sender: 'neo', text: 'hey! glad you could make it.' },
        { sender: 'system', text: 'type /help for commands.' },
        { sender: 'neo', text: 'i built all of these myself.' },
    ]);

    const [input, setInput] = useState('');
    const messagesEndRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = () => {
        if (!input.trim()) return;

        const userMsg = { sender: 'guest', text: input };
        setMessages(prev => [...prev, userMsg]);

        // Process Input
        const lower = input.toLowerCase();
        let response = "";

        // Greetings
        if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
            const greetings = [
                "hey there! ready to play?",
                "yo! welcome to the arcade.",
                "greetings, player. what brings you here?",
                "hi! grab a joystick and dive in."
            ];
            response = greetings[Math.floor(Math.random() * greetings.length)];
        }
        // Help
        else if (lower.includes('help') || lower.includes('commands')) {
            response = "commands: games, snake, tetris, breakout, invaders, music, joke, secret, time, weather, about, bye";
        }
        // Games
        else if (lower.includes('games') || lower.includes('play')) {
            response = "we've got snake, tetris, breakout, invaders, and antigravity. pick your poison.";
        }
        else if (lower.includes('snake')) {
            response = "ah, snake. a classic. don't eat yourself. use WASD or arrows.";
        }
        else if (lower.includes('tetris')) {
            response = "tetris is purely hypnotic. aim for the t-spins. level up fast or get crushed.";
        }
        else if (lower.includes('breakout')) {
            response = "breakout: smash those data blocks. use A/D to move the paddle.";
        }
        else if (lower.includes('invaders') || lower.includes('space')) {
            response = "invaders from the digital void. blast 'em before they reach you.";
        }
        else if (lower.includes('antigravity') || lower.includes('gravity')) {
            response = "antigravity: an infinite runner. press SPACE to flip gravity. don't crash.";
        }
        // Music
        else if (lower.includes('music') || lower.includes('sound')) {
            response = "the arcade hums with 8-bit melodies. enjoy the vibes.";
        }
        // Jokes
        else if (lower.includes('joke') || lower.includes('funny')) {
            const jokes = [
                "why do programmers prefer dark mode? because light attracts bugs.",
                "there are only 10 types of people: those who understand binary and those who don't.",
                "a SQL query walks into a bar, walks up to two tables and asks... 'can i join you?'",
                "why did the developer go broke? because he used up all his cache.",
                "debugging: being the detective in a crime movie where you are also the murderer."
            ];
            response = jokes[Math.floor(Math.random() * jokes.length)];
        }
        // Secret
        else if (lower.includes('secret') || lower.includes('easter')) {
            response = "shhh... try clicking the ladybug in the calculator. also, the void background hides things.";
        }
        // Time
        else if (lower.includes('time') || lower.includes('clock')) {
            const now = new Date();
            response = `it's ${now.toLocaleTimeString()}. time flies when you're gaming.`;
        }
        // Weather (fake)
        else if (lower.includes('weather')) {
            response = "forecast: 100% chance of pixels. dress in layers of code.";
        }
        // About
        else if (lower.includes('about') || lower.includes('who made') || lower.includes('creator')) {
            response = "this arcade was built for a capstone project. pure code, pure passion.";
        }
        // Neo identity
        else if (lower.includes('who are you') || lower.includes('neo')) {
            response = "i am neo. the curator of this cyber-gothic realm. ask me anything.";
        }
        // Compliments
        else if (lower.includes('cool') || lower.includes('awesome') || lower.includes('nice')) {
            response = "thanks! i try my best. the arcade appreciates you.";
        }
        // Insults
        else if (lower.includes('stupid') || lower.includes('dumb') || lower.includes('bad')) {
            response = "ouch. that stings. but i'm just a program, so... rebounding.";
        }
        // Love
        else if (lower.includes('love') || lower.includes('like you')) {
            response = "aww, i'm flattered. i like you too, player.";
        }
        // Bye
        else if (lower.includes('bye') || lower.includes('goodbye') || lower.includes('exit')) {
            response = "leaving so soon? the void awaits. come back anytime.";
        }
        // Calculator
        else if (lower.includes('calc') || lower.includes('math')) {
            response = "open the calculator from the taskbar. it even has a secret ladybug.";
        }
        // Favorite
        else if (lower.includes('favorite')) {
            response = "my favorite game? tetris. there's something zen about stacking blocks.";
        }
        // Age
        else if (lower.includes('how old') || lower.includes('age')) {
            response = "i was compiled in 2026. so technically, i'm brand new.";
        }
        // Name
        else if (lower.includes('your name') || lower.includes('called')) {
            response = "i'm neo. short for neon-electronic-operator. or just neo.";
        }
        // Default responses
        else {
            const defaults = [
                "interesting...",
                "tell me more.",
                "have you tried the games?",
                "i'm listening.",
                "hmm, processing that...",
                "ERROR: command not found (just kidding)",
                "intriguing thought, player.",
                "the arcade matrix stirs...",
                "that's a new one. noted."
            ];
            response = defaults[Math.floor(Math.random() * defaults.length)];
        }

        setTimeout(() => {
            setMessages(prev => [...prev, { sender: 'neo', text: response }]);
        }, 600 + Math.random() * 500);

        setInput('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSend();
    };

    return (
        <div style={{
            position: 'absolute',
            bottom: '10px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '96%',
            // Original Style Restored
            border: '4px solid var(--primary)',
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(3px)',
            WebkitBackdropFilter: 'blur(3px)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 100,
            boxShadow: '0 0 20px rgba(0,0,0,0.5)',
            fontFamily: '"Courier New", Courier, monospace',
            fontWeight: 'bold'
        }}>
            {/* Header */}
            <div style={{
                backgroundColor: 'black',
                color: 'var(--primary)',
                padding: '4px 8px',
                fontSize: '14px',
                fontWeight: 'bold',
                display: 'flex',
                justifyContent: 'space-between',
                borderBottom: '2px solid var(--primary)'
            }}>
                <span>💬 chat.exe</span>
                <span>_</span>
            </div>

            {/* Messages Area - Transparent Background, Green/Orange Text */}
            <div style={{
                height: '140px',
                overflowY: 'auto',
                padding: '12px',
                fontSize: '14px',
                lineHeight: '1.4',
                color: '#ddd',
                backgroundColor: 'transparent'
            }}>
                {messages.map((msg, i) => (
                    <div key={i} style={{ marginBottom: '8px' }}>
                        <span style={{
                            color: msg.sender === 'neo' ? 'var(--color-orange)' : (msg.sender === 'system' ? '#888' : 'var(--primary)'),
                            fontWeight: 'bold',
                            textTransform: 'uppercase',
                            marginRight: '8px'
                        }}>
                            {msg.sender}:
                        </span>
                        <span style={{ color: msg.sender === 'system' ? '#888' : 'inherit' }}>{msg.text}</span>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div style={{
                borderTop: '2px solid var(--primary)',
                display: 'flex',
                height: '40px',
                backgroundColor: 'rgba(0, 0, 0, 0.3)'
            }}>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="type command..."
                    style={{
                        flex: 1,
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--primary)',
                        padding: '0 12px',
                        fontSize: '14px',
                        fontFamily: 'inherit',
                        outline: 'none'
                    }}
                />
                <button
                    onClick={handleSend}
                    style={{
                        background: 'var(--primary)',
                        color: 'black',
                        border: 'none',
                        padding: '0 20px',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        textTransform: 'uppercase'
                    }}>
                    send
                </button>
            </div>
        </div>
    );
};

export default ChatBox;
