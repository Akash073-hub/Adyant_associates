import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the access choices on the start page', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /how would you like to continue/i })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /student login/i })).toHaveAttribute('href', '/student-login');
  expect(screen.getByRole('link', { name: /admin login/i })).toHaveAttribute('href', '/admin-login');
});
