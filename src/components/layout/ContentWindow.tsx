import React from 'react';

// Main content window - the "about" page like insect.christmas
const ContentWindow: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
    return (
        <div style={{
            border: '4px solid var(--primary)',
            backgroundColor: 'rgba(0,0,0,0.8)',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            overflow: 'hidden'
        }}>
            {/* Window header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '4px solid var(--primary)',
                padding: '4px 8px',
                backgroundColor: 'var(--primary)',
                color: 'black'
            }}>
                <span>ʚïɞ cyber.arcade/</span>
                <button style={{
                    background: 'red',
                    color: 'white',
                    border: 'none',
                    padding: '2px 6px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                }}>✖</button>
            </div>

            {/* Content */}
            <div style={{
                flex: 1,
                overflow: 'auto',
                padding: '15px'
            }}>
                {children || <DefaultContent />}
            </div>
        </div>
    );
};

// Default "about" content
const DefaultContent: React.FC = () => (
    <div>
        {/* Header */}
        <h2 style={{ color: 'slateblue', marginBottom: '15px' }}>about:</h2>

        {/* Welcome */}
        <p style={{ marginBottom: '15px' }}>
            welcome to the <span style={{ color: 'coral' }}>cyber gothic arcade</span>.
            <br />
            this is a digital restoration project featuring retro games and utilities.
        </p>

        {/* Category list with emojis */}
        <div style={{ marginBottom: '20px' }}>
            <div style={{ marginBottom: '8px' }}>🎮 <span style={{ color: 'coral' }}>games</span> - classic arcade experiences</div>
            <div style={{ marginBottom: '8px' }}>🎵 <span style={{ color: 'coral' }}>music</span> - chiptune soundtracks</div>
            <div style={{ marginBottom: '8px' }}>📼 <span style={{ color: 'coral' }}>video</span> - retro animations</div>
            <div style={{ marginBottom: '8px' }}>🧮 <span style={{ color: 'coral' }}>utilities</span> - calculator, notepad, etc</div>
            <div style={{ marginBottom: '8px' }}>🌐 <span style={{ color: 'coral' }}>links</span> - external resources</div>
        </div>

        {/* Links row */}
        <div style={{
            display: 'flex',
            gap: '10px',
            flexWrap: 'wrap',
            marginBottom: '20px'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: 'slateblue', fontWeight: 'bold', fontSize: '26px' }}>github :</span>
                <a href="https://github.com/diviontopp/arcade" target="_blank" rel="noopener noreferrer" style={{
                    color: 'coral',
                    cursor: 'pointer',
                    textDecoration: 'none'
                }}>
                    https://github.com/diviontopp/arcade
                </a>
            </div>
        </div>

        {/* Credits */}
        <div style={{ marginBottom: '20px' }}>
            <h3 style={{ color: 'slateblue', fontSize: '26px', marginBottom: '10px' }}>credits:</h3>
            <div style={{
                color: 'var(--primary)',
                fontSize: '18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                paddingLeft: '10px'
            }}>
                <div>Divyaansh</div>
                <div>Suman</div>
                <div>Melvin</div>
                <div>Antony</div>
            </div>
        </div>

        {/* Project info */}
        <div style={{
            borderTop: '2px dashed var(--primary)',
            paddingTop: '15px',
            fontSize: '12px',
            color: 'slateblue'
        }}>
            <p>project: university archives restoration</p>
            <p>status: development build v0.1</p>
            <p>aesthetic: late 90s / early 2000s web</p>
        </div>

        {/* ASCII art divider */}
        <pre style={{
            marginTop: '20px',
            fontSize: '10px',
            color: 'var(--primary)',
            opacity: 0.5
        }}>
            {`
░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
░░ CYBER GOTHIC ARCADE - RESTORATION PROJECT ░░
░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
`}
        </pre>
    </div>
);

export default ContentWindow;
