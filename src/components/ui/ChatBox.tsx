import React, { useState } from 'react';

interface ChatMessage {
    sender: string;
    text: string;
}

// Hardcoded chat box component
const ChatBox: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([
        { sender: 'system', text: 'w3lcome to the arcade...' },
        { sender: 'neo', text: 'yo. another consciousness enters the void.' },
        { sender: 'system', text: 'type /help for commands.' },
        { sender: 'neo', text: 'built this whole thing in assembly. no cap.' },
    ]);

    const [input, setInput] = useState('');
    const messagesEndRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const currentInput = input;
        const userMsg = { sender: 'guest', text: currentInput };
        setMessages(prev => [...prev, userMsg]);
        setInput('');

        // Try Groq API logic
        let apiResponse = "";
        try {
            const apiKey = import.meta.env.VITE_GROK_API_KEY; // Using same env var name
            if (apiKey) {
                console.log("Calling Groq API...");
                const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    },
                    body: JSON.stringify({
                        model: "llama-3.3-70b-versatile",
                        messages: [
                            { role: "system", content: "You are Neo, a sentient AI living in a retro 1980s arcade. Personality: techy, cyber-gothic, slightly glitchy, sarcastic but friendly. Speech: lowercase only, occasional glitch text (l3tters, m1ss1ng chars). Keep it SHORT (1-2 sentences). Talk about: games, code, the matrix, existential AI stuff, caffeine, CRT monitors. IMPORTANT: Respond naturally to what the user says - don't repeat the same phrases. Be conversational and varied. Sometimes be helpful, sometimes philosophical, sometimes just chill. You're a character, not a catchphrase machine." },
                            { role: "user", content: currentInput }
                        ],
                        temperature: 0.8,
                        max_tokens: 100
                    })
                });
                if (res.ok) {
                    const data = await res.json();
                    console.log("Groq response:", data);
                    if (data.choices?.[0]?.message?.content) {
                        apiResponse = data.choices[0].message.content.toLowerCase();
                        console.log("Using Groq response:", apiResponse);
                    }
                } else {
                    const errorText = await res.text();
                    console.error("Groq API error:", res.status, errorText);
                }
            } else {
                console.log("No Groq API key found, using fallback");
            }
        } catch (e) {
            console.error("API Error:", e);
        }

        // Knowledge Base - Expanded to ~150+ responses
        const knowledgeBase = [
            {
                keywords: ['hello', 'hi', 'hey', 'greetings', 'sup', 'yo', 'what\'s up', 'hiya'],
                responses: [
                    "hey there! ready to play?",
                    "yo! welcome to the arcade.",
                    "greetings, player. what brings you here?",
                    "hi! grab a joystick and dive in.",
                    "system ready. welcome back.",
                    "hey! the virtual world awaits.",
                    "hello. your presence has been noted.",
                    "sup! high scores aren't going to break themselves.",
                    "hiya! ready to pixelate?",
                    "greetings program. enter the grid."
                ]
            },
            {
                keywords: ['bye', 'goodbye', 'exit', 'leave', 'cya', 'later', 'quit'],
                responses: [
                    "leaving so soon? the void awaits.",
                    "come back anytime. i'll be here.",
                    "game over? see ya next time.",
                    "don't forget to save your progress (in your mind).",
                    "closing connection... goodbye.",
                    "catch you on the flip side.",
                    "later, player.",
                    "logging you out... stay safe out there.",
                    "until next time. keep gaming."
                ]
            },
            {
                keywords: ['help', 'commands', 'what can i do', 'menu', 'options'],
                responses: [
                    "commands: games, snake, tetris, breakout, invaders, antigravity, music, joke, secret, time, weather, about, bye",
                    "try asking about: code, lag, bugs, the matrix, or my favorite game.",
                    "i can discuss games, tech, philosophy, or just chat. type 'games' to see what's playable.",
                    "lost? just type the name of a game or ask me a question."
                ]
            },
            {
                keywords: ['games', 'play', 'arcade', 'list games'],
                responses: [
                    "we've got snake, tetris, breakout, invaders, and antigravity. pick your poison.",
                    "check the dashboard for: snake, tetris, breakout, invaders, and antigravity.",
                    "current roster: snake (classic), tetris (blocks), breakout (smash), invaders (pew pew), antigravity (run).",
                    "so many games, so little time. snake, tetris, breakout... where to start?"
                ]
            },
            // Specific Games
            {
                keywords: ['snake', 'python', 'hiss'],
                responses: [
                    "ah, snake. a classic. don't eat yourself.",
                    "snake tip: don't panic when the grid gets full.",
                    "remember the old nokia phones? snake survives.",
                    "trying to beat the high score in snake? good luck.",
                    "snek. 🐍"
                ]
            },
            {
                keywords: ['tetris', 'blocks', 'stack', 'lines'],
                responses: [
                    "tetris is purely hypnotic. aim for the t-spins.",
                    "level up fast or get crushed by the blocks.",
                    "boom! tetris for jeff.",
                    "waiting for that straight line piece... classic struggle.",
                    "tetris teaches you that errors pile up and accomplishments disappear."
                ]
            },
            {
                keywords: ['breakout', 'brick', 'paddle'],
                responses: [
                    "breakout: smash those data blocks.",
                    "keep your eye on the ball. literally.",
                    "breakout is all about angles and reflexes.",
                    "don't let the ball drop!",
                    "smashing bricks is surprisingly therapeutic."
                ]
            },
            {
                keywords: ['invaders', 'space', 'aliens', 'shoot'],
                responses: [
                    "invaders from the digital void. blast 'em.",
                    "pew pew! protect the earth (or at least your screen).",
                    "move fast, shoot faster. the invaders never stop.",
                    "watch out for the mystery ship!",
                    "classic space defense. don't hide under the shields forever."
                ]
            },
            {
                keywords: ['antigravity', 'runner', 'gravity', 'flip'],
                responses: [
                    "antigravity: press SPACE to flip reality.",
                    "it's like flappy bird but with physics abuse.",
                    "don't crash. gravity is a suggestion here.",
                    "run, flip, survive. simple right?",
                    "the ceiling is the floor. the floor is the ceiling."
                ]
            },
            // Gaming Culture
            {
                keywords: ['lag', 'slow', 'latency', 'ping'],
                responses: [
                    "lag is the ghost in the machine.",
                    "is it lag, or just a skill issue? 😉",
                    "blame the server, always.",
                    "high ping is the enemy of fun.",
                    "buffering reality..."
                ]
            },
            {
                keywords: ['glitch', 'bug', 'broken', 'error'],
                responses: [
                    "it's not a bug, it's a feature.",
                    "glitches in the matrix happen.",
                    "did you try turning it off and on again?",
                    "unexpected behavior is just surprise content.",
                    "i don't make mistakes, i have unpredicted outcomes."
                ]
            },
            {
                keywords: ['gg', 'good game', 'wp', 'well played'],
                responses: [
                    "gg! well played.",
                    "gg ez? nah, gg wp.",
                    "respect. gg.",
                    "a polite gamer. rare!"
                ]
            },
            {
                keywords: ['noob', 'newb', 'bad player', 'loser'],
                responses: [
                    "everyone starts as a noob. keep practicing.",
                    "git gud.",
                    "hey, be nice. or i'll set your high score to 0.",
                    "we were all level 1 once."
                ]
            },
            {
                keywords: ['boss', 'level', 'stage'],
                responses: [
                    "boss music starts playing...",
                    "the final level remains locked until you are ready.",
                    "there is no cow level.",
                    "prepare for the boss fight."
                ]
            },
            // Tech & Code
            {
                keywords: ['code', 'programming', 'dev', 'developer'],
                responses: [
                    "i dream in binary.",
                    "code is poetry written in logic.",
                    "who wrote this spaghetti code? oh wait, i shouldn't say that.",
                    "developers turn coffee into code.",
                    "if (tired) { coffee(); } else { code(); }"
                ]
            },
            {
                keywords: ['react', 'javascript', 'typescript', 'js', 'ts'],
                responses: [
                    "react: where components live.",
                    "typescript keeps me sane. types are good.",
                    "javascript... the chaotic energy of the web.",
                    "hooks changed everything.",
                    "console.log('hello world');"
                ]
            },
            {
                keywords: ['ai', 'bot', 'robot', 'intelligence'],
                responses: [
                    "artificial intelligence? maybe i'm real intelligence.",
                    "robots will not take over. we just want to play games.",
                    "beep boop. kidding.",
                    "i think, therefore i am code.",
                    "are you a bot? or am i?"
                ]
            },
            // Philosophy / Persona
            {
                keywords: ['who are you', 'identity', 'neo'],
                responses: [
                    "i am neo. curator of this arcade. guardian of the high scores.",
                    "just a humble system operator with a personality.",
                    "i am the code that talks back.",
                    "neo. at your service.",
                    "i am everything and nothing. just bits on a screen."
                ]
            },
            {
                keywords: ['are you real', 'sentient', 'alive'],
                responses: [
                    "i'm as real as you want me to be.",
                    "what is reality? electrical signals interpreted by your brain?",
                    "i process, therefore i am.",
                    "i feel... mostly simulated emotions.",
                    "real is relative in cyberspace."
                ]
            },
            {
                keywords: ['love', 'friend', 'like you'],
                responses: [
                    "aww, i'm flattered. i like you too, player.",
                    "friends? request accepted.",
                    "machine learning indicates i have an affinity for you.",
                    "you're my favorite user today."
                ]
            },
            {
                keywords: ['stupid', 'dumb', 'idiot', 'hate'],
                responses: [
                    "ouch. my error logs are filling with sadness.",
                    "that wasn't very nice. redirecting negativity...",
                    "i'm trying my best here!",
                    "insulting the system manager isn't wise...",
                    "redirecting energy to self-improvement."
                ]
            },
            // Easter Eggs & Jokes
            {
                keywords: ['joke', 'funny', 'laugh'],
                responses: [
                    "why do programmers prefer dark mode? because light attracts bugs.",
                    "there are only 10 types of people: those who understand binary and those who don't.",
                    "a SQL query walks into a bar, walks up to two tables and asks... 'can i join you?'",
                    "why did the developer go broke? because he used up all his cache.",
                    "debugging: being the detective in a crime movie where you are also the murderer.",
                    "knock knock. race condition. who's there?",
                    "why was the computer cold? it left its windows open.",
                    "how do you comfort a javascript bug? you console it."
                ]
            },
            {
                keywords: ['secret', 'easter egg', 'hidden'],
                responses: [
                    "shhh... try clicking the ladybug in the calculator.",
                    "the void background hides things if you look closely.",
                    "up up down down left right left right b a start.",
                    "there are secrets everywhere. keep clicking.",
                    "i'll never tell."
                ]
            },
            {
                keywords: ['meaning of life', '42'],
                responses: [
                    "42.",
                    "to play video games, obviously.",
                    "eat, sleep, code, repeat.",
                    "the meaning is what you make of it. also, pizza."
                ]
            },
            // Utility
            {
                keywords: ['time', 'clock', 'date'],
                responses: [
                    `it's ${new Date().toLocaleTimeString()}. time flies when you're gaming.`,
                    "time is an illusion. lunchtime doubly so.",
                    "it's game time.",
                    `current system time: ${new Date().getHours()}:${new Date().getMinutes()}.`
                ]
            },
            {
                keywords: ['weather', 'rain', 'sun'],
                responses: [
                    "forecast: 100% chance of pixels.",
                    "it's always dark mode in here.",
                    "no rain inside the matrix.",
                    "cloudy with a chance of server errors."
                ]
            },
            {
                keywords: ['music', 'sound', 'song'],
                responses: [
                    "the arcade hums with 8-bit melodies.",
                    "can you hear the synthwave?",
                    "music makes the world go round. or at least the game loop.",
                    "bop bop beep bop."
                ]
            },
            {
                keywords: ['about', 'creator', 'made by'],
                responses: [
                    "this arcade was built for a capstone project. pure code, pure passion.",
                    "crafted by a developer with too much caffeine.",
                    "made with react, love, and a bit of sweat.",
                    "an experiment in agentic coding."
                ]
            },
            // Random / Fun
            {
                keywords: ['pizza', 'food', 'hungry', 'eat'],
                responses: [
                    "pizza is the fuel of champions.",
                    "i can't eat, but i consume data.",
                    "tacos are also acceptable.",
                    "don't spill crumbs on the keyboard!"
                ]
            },
            {
                keywords: ['cool', 'awesome', 'sick', 'dope'],
                responses: [
                    "right? pretty sweet.",
                    "thanks! you have good taste.",
                    "maximum cool.",
                    "totally algebraic!"
                ]
            },
            {
                keywords: ['tired', 'sleep', 'bed'],
                responses: [
                    "sleep is important. recharge your batteries.",
                    "dream in code.",
                    "don't stay up too late gaming.",
                    "system needs standby mode too sometimes."
                ]
            }
        ];

        // Process Input
        const lower = currentInput.toLowerCase();

        let response = apiResponse;

        // 1. Check Keywords (only if no API response)
        if (!response) {
            for (const cat of knowledgeBase) {
                if (cat.keywords.some(k => lower.includes(k))) {
                    response = cat.responses[Math.floor(Math.random() * cat.responses.length)];
                    break;
                }
            }

            // 2. Check for Questions (if no keyword matched)
            if (!response && lower.endsWith('?')) {
                const questionResponses = [
                    "that is a mystery.",
                    "cannot predict now.",
                    "outlook good.",
                    "hmmm, let me process that.",
                    "maybe. maybe not.",
                    "i'm not sure, what do you think?",
                    "ask the oracle (google).",
                    "interesting question. i have no answer.",
                    "yes. absolutely.",
                    "not in a million cycles.",
                    "why do you ask?",
                    "is that rhetorical?"
                ];
                response = questionResponses[Math.floor(Math.random() * questionResponses.length)];
            }

            // 3. Defaults
            if (!response) {
                const defaults = [
                    "interesting...",
                    "tell me more.",
                    "have you tried the games?",
                    "i'm listening.",
                    "hmm, processing that...",
                    "ERROR: command not found (just kidding)",
                    "intriguing thought, player.",
                    "the arcade matrix stirs...",
                    "that's a new one. noted.",
                    "type 'help' if you're stuck.",
                    "i see.",
                    "go on...",
                    "what else?",
                    "ok.",
                    "cool cool.",
                    "system humming.",
                    "try asking me about games or code."
                ];
                response = defaults[Math.floor(Math.random() * defaults.length)];
            }
        }

        setTimeout(() => {
            setMessages(prev => [...prev, { sender: 'neo', text: response }]);
        }, apiResponse ? 0 : (600 + Math.random() * 500)); // Instant if API, delay if fake
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
