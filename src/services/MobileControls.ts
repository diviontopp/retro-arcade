// Touch/Swipe handler for mobile game controls
// This creates virtual arrow key events from swipe gestures

let touchStartX = 0;
let touchStartY = 0;
let touchStartTime = 0;

const SWIPE_THRESHOLD = 30; // Minimum distance for swipe
const TAP_THRESHOLD = 10; // Max distance for tap
const SWIPE_TIME_LIMIT = 300; // Max time for swipe in ms

export function initMobileControls() {
    if (typeof window === 'undefined') return;

    // Only init on touch devices
    if (!('ontouchstart' in window)) return;

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: false });
}

export function removeMobileControls() {
    document.removeEventListener('touchstart', handleTouchStart);
    document.removeEventListener('touchend', handleTouchEnd);
}

function handleTouchStart(e: TouchEvent) {
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    touchStartTime = Date.now();
}

function handleTouchEnd(e: TouchEvent) {
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartX;
    const deltaY = touch.clientY - touchStartY;
    const deltaTime = Date.now() - touchStartTime;

    // Ignore if too slow
    if (deltaTime > SWIPE_TIME_LIMIT) return;

    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    // Check if it's a tap (for space key - jump/action)
    if (absX < TAP_THRESHOLD && absY < TAP_THRESHOLD) {
        simulateKeyPress(' '); // Space for jump/action
        e.preventDefault();
        return;
    }

    // Check for swipe
    if (absX < SWIPE_THRESHOLD && absY < SWIPE_THRESHOLD) return;

    // Determine swipe direction
    if (absX > absY) {
        // Horizontal swipe
        if (deltaX > 0) {
            simulateKeyPress('ArrowRight');
        } else {
            simulateKeyPress('ArrowLeft');
        }
    } else {
        // Vertical swipe
        if (deltaY > 0) {
            simulateKeyPress('ArrowDown');
        } else {
            simulateKeyPress('ArrowUp');
        }
    }

    e.preventDefault();
}

function simulateKeyPress(key: string) {
    // Create and dispatch keydown event
    const keydownEvent = new KeyboardEvent('keydown', {
        key: key,
        code: getKeyCode(key),
        keyCode: getKeyCodeNumber(key),
        which: getKeyCodeNumber(key),
        bubbles: true,
        cancelable: true
    });
    document.dispatchEvent(keydownEvent);

    // Create and dispatch keyup event after a short delay
    setTimeout(() => {
        const keyupEvent = new KeyboardEvent('keyup', {
            key: key,
            code: getKeyCode(key),
            keyCode: getKeyCodeNumber(key),
            which: getKeyCodeNumber(key),
            bubbles: true,
            cancelable: true
        });
        document.dispatchEvent(keyupEvent);
    }, 50);
}

function getKeyCode(key: string): string {
    const codes: Record<string, string> = {
        'ArrowUp': 'ArrowUp',
        'ArrowDown': 'ArrowDown',
        'ArrowLeft': 'ArrowLeft',
        'ArrowRight': 'ArrowRight',
        ' ': 'Space'
    };
    return codes[key] || key;
}

function getKeyCodeNumber(key: string): number {
    const codes: Record<string, number> = {
        'ArrowUp': 38,
        'ArrowDown': 40,
        'ArrowLeft': 37,
        'ArrowRight': 39,
        ' ': 32
    };
    return codes[key] || 0;
}

export default { initMobileControls, removeMobileControls };
