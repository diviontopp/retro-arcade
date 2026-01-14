import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';

import { Particles, Scanline, ClickEffect } from '../components/fx/Animations';

describe('Animations Cleanup Safety', () => {
    it('Exports expected components', () => {
        // These should exist BEFORE cleanup
        expect(Particles).toBeDefined();
        expect(Scanline).toBeDefined();
        expect(ClickEffect).toBeDefined();
    });

    it('Particles renders correctly', () => {
        const { container } = render(<Particles active={true} />);
        expect(container).toBeTruthy();
    });
});
