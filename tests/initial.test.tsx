import { render, screen } from './utils/testUtils';
import React from 'react';

describe('Initial Test Setup', () => {
  it('renders a simple element', () => {
    render(<div>Test</div>);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
