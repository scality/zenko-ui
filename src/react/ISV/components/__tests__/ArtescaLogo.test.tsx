import { render } from '@testing-library/react';
import { ArtescaLogo } from '../ArtescaLogo';

describe('ArtescaLogo', () => {
  it('should render the svg element', () => {
    render(<ArtescaLogo />);
    const svgElement = document.querySelector('svg');
    expect(svgElement).toBeInTheDocument();
    expect(svgElement).toHaveAttribute('width', '30');
    expect(svgElement).toHaveAttribute('height', '24');
  });

  it('should have the correct path with Artesca logo colors', () => {
    render(<ArtescaLogo />);
    const pathElement = document.querySelector('path');
    expect(pathElement).toBeInTheDocument();
    expect(pathElement).toHaveAttribute('fill', '#0AADA6');
  });
});
