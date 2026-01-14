import React from 'react';
import AnimatedSpriteAvatar from '../fx/AnimatedSpriteAvatar';

// Male avatar panel - right side character display
const AvatarPanel: React.FC = () => {
    return (
        <div style={{
            // borderLeft handled by App.tsx container
            backgroundColor: 'transparent',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-end', // Align bottom
            padding: '0', // Remove padding to max size
            position: 'relative',
            minWidth: '350px',
            height: '100%', // Fill full height so video goes behind chatbox
            overflow: 'hidden'
        }}>
            {/* Green Header Line */}
            <div style={{
                width: '100%',
                height: '4px',
                backgroundColor: 'var(--primary)',
                marginBottom: '5px',
                marginTop: '0px'    // Aligned with main window header
            }}></div>

            {/* Animated Gaming Avatar */}
            <div style={{ width: '100%', flex: 1, minHeight: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                <AnimatedSpriteAvatar />
            </div>
        </div>
    );
};

export default AvatarPanel;
