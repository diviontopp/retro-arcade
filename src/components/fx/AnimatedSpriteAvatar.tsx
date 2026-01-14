import React, { useState, useEffect } from 'react';

// Dynamic animated avatar that cycles between two states
const AnimatedSpriteAvatar: React.FC = () => {
    const avatars = [
        '/avatar/avatar_main.gif',
        '/avatar/avatar_alt.gif',
        '/avatar/avatar_extra_1.gif',
        '/avatar/avatar_extra_2.gif'
    ];
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % avatars.length);
        }, 20000);

        return () => clearInterval(interval);
    }, []);

    const currentGif = avatars[currentIndex];

    return (
        <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            position: 'relative'
        }}>
            {/* Avatar image */}
            <div
                className="neo-avatar"
                style={{
                    width: '100%',
                    height: '100%',
                    backgroundImage: `url(${currentGif})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center -60px', // Shift up to crop top watermark
                    backgroundRepeat: 'no-repeat',
                    imageRendering: 'pixelated',
                    transition: 'background-image 0.2s ease-in-out',
                    // Normal blend since container is black
                    mixBlendMode: 'normal',
                    // Tune levels to ensure video background is pure black
                    filter: 'brightness(0.95) contrast(1.05)'
                }}
            />
        </div>
    );
};

export default AnimatedSpriteAvatar;
