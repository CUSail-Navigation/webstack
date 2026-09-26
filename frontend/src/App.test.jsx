import { render, screen } from '@testing-library/react';
import App from './App';

test('renders dashboard header', () => {
  render(<App />);
  expect(screen.getByText(/webstack dashboard/i)).toBeInTheDocument();
});
