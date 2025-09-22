import React from 'react';
import { render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Footer } from './Footer';

describe('Footer', () => {
  it('renders brand heading and year', () => {
    render(<Footer />);
    const footer = screen.getByRole('contentinfo');
    // Brand heading exists
    expect(within(footer).getByRole('heading', { name: /Financial Analysis/i })).toBeInTheDocument();
    // Copyright contains the current year
    const year = new Date().getFullYear();
    expect(within(footer).getByText(new RegExp(String(year)))).toBeInTheDocument();
  });
});
