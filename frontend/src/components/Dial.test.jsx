import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Dial from './Dial';

describe('heading dial', () => {
  it.each([[0, 90], [90, 0], [-90, 180], [-180, 270]])('renders %s degrees at screen rotation %s', (heading, rotation) => {
    const { container } = render(<Dial label="Heading" isHeading value={heading} />);
    expect(container.querySelector('line[transform]').getAttribute('transform')).toBe(`rotate(${rotation})`);
    expect(screen.getByText(`${heading.toFixed(1)}°`)).toBeInTheDocument();
  });
});
