import { render, screen, within } from '@testing-library/react';
import { vi } from 'vitest';
import App from './App';
import * as waypoints from './api/waypoints';

afterEach(() => vi.restoreAllMocks());

test('renders dashboard header', () => {
  render(<App />);
  expect(screen.getByText(/webstack dashboard/i)).toBeInTheDocument();
});

test.each([false, true])('waypoint controls reflect stale=%s while showing the saved queue', async (stale) => {
  vi.spyOn(waypoints, 'getWaypoints').mockResolvedValue([
    { _id: 'a', latitude: 42, longitude: -71, order: 0 },
  ]);
  vi.spyOn(waypoints, 'getWaypointStatus').mockResolvedValue({
    connected: !stale, stale, confirmedAt: new Date().toISOString(),
  });
  render(<App />);
  const panel = within(screen.getByRole('heading', { name: 'Waypoints' }).parentElement);
  expect(await panel.findByText('42.000000, -71.000000')).toBeInTheDocument();
  expect(panel.getByRole('status')).toHaveTextContent(stale ? 'stale / offline' : 'up to date');
  for (const name of ['Add', 'Delete', 'Clear all']) {
    expect(panel.getByRole('button', { name }).disabled).toBe(stale);
  }
});
