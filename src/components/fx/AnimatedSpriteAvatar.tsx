import React from 'react';

// Neo Avatar - static pixel art character display
const AnimatedSpriteAvatar: React.FC = () => {
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
                    backgroundImage: 'url(/neo_avatar.png)',
                    backgroundSize: 'contain',
                    backgroundPosition: 'center bottom',
                    backgroundRepeat: 'no-repeat',
                    imageRendering: 'pixelated',
                }}
            />

        </div>
    );
};

export default AnimatedSpriteAvatar;
