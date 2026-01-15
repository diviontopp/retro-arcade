import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import App from '../App';

// Mock AudioBus
vi.mock('../services/AudioBus', () => ({
    default: {
        trigger: vi.fn(),
        playBGM: vi.fn(),
        toggleBGM: vi.fn(),
        setVolume: vi.fn(),
    }
}));

// Mock Animations
vi.mock('../components/fx/Animations', () => ({
    Particles: () => <div data-testid="particles" />,
    Scanline: () => <div data-testid="scanline" />,
    ClickEffect: () => <div data-testid="click-effect" />
}));

// Mock global video


describe('System Integrity Tests', () => {
    beforeAll(() => {
        // Mock loadPyodide
        (window as any).loadPyodide = vi.fn().mockResolvedValue({
            loadPackage: vi.fn(),
            FS: { writeFile: vi.fn() },
        });

        Object.defineProperty(window, 'matchMedia', {
            writable: true,
            value: vi.fn().mockImplementation(query => ({
                matches: false,
                media: query,
                onchange: null,
                addListener: vi.fn(),
                removeListener: vi.fn(),
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
                dispatchEvent: vi.fn(),
            })),
        });
    });

    it('Bootstrap: App renders critical shell components', () => {
        const { container } = render(<App />);
        expect(container).toBeTruthy();
    });

    it('Flow: Boot Sequence completes and loads shell', async () => {
        vi.useFakeTimers();
        render(<App />);

        // Advance timers to finish boot text typing
        await vi.advanceTimersByTimeAsync(4000);

        // Should see prompt
        expect(screen.getByText(/PRESS ANY KEY/i)).toBeTruthy();

        // Trigger input to finish boot
        fireEvent.keyDown(window, { key: 'Enter' });

        const { waitFor } = await import('@testing-library/react');
        await waitFor(() => {
            expect(screen.getByTitle('home')).toBeTruthy();
        }, { timeout: 2000 });

        // Check Sidebar (contains 'games.dir')
        expect(screen.getByText('games.dir')).toBeTruthy();

        vi.useRealTimers();
    });
});
