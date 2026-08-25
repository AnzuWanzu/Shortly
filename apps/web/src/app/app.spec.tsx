import { render, screen } from '@testing-library/react';

import App from './app';

describe('App', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<App />);
    expect(baseElement).toBeTruthy();
  });

  it('should identify the application', () => {
    render(<App />);

    expect(
      screen.getByRole('heading', { name: 'Shortly' }),
    ).toBeTruthy();
  });
});
