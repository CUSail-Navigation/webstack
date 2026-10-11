import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import * as api from '../api/waypoints';
import useWaypoints from './useWaypoints';
import WaypointPanel from '../components/WaypointPanel';

beforeEach(() => {
  vi.spyOn(api, 'getWaypoints').mockResolvedValue([]);
  vi.spyOn(api, 'getWaypointStatus').mockResolvedValue({
    connected: true, stale: false, confirmedAt: new Date().toISOString(),
  });
});
afterEach(() => vi.restoreAllMocks());

test.each(['warning', 'failure'])('surfaces mutation %s and refreshes the queue', async (kind) => {
  const { result } = renderHook(useWaypoints);
  await waitFor(() => expect(result.current.disabled).toBe(false));
  const operation = kind === 'warning'
    ? vi.fn().mockResolvedValue({ warning: 'Cache save failed' })
    : vi.fn().mockRejectedValue({ response: { data: { error: 'Boat disconnected' } } });
  let accepted;
  await act(async () => { accepted = await result.current.mutate(operation); });
  expect(accepted).toBe(kind === 'warning');
  expect(result.current.error).toBe(kind === 'warning' ? 'Cache save failed' : 'Boat disconnected');
  expect(api.getWaypoints).toHaveBeenCalledTimes(2);
  expect(result.current.disabled).toBe(false);
});

test('does not submit another edit while an acknowledgement is pending', async () => {
  const { result } = renderHook(useWaypoints);
  await waitFor(() => expect(result.current.disabled).toBe(false));
  let acknowledge;
  const operation = vi.fn(() => new Promise((resolve) => { acknowledge = resolve; }));
  let pending;
  act(() => { pending = result.current.mutate(operation); });
  expect(result.current.disabled).toBe(true);
  await act(async () => { expect(await result.current.mutate(operation)).toBe(false); });
  expect(operation).toHaveBeenCalledTimes(1);
  await act(async () => { acknowledge({}); await pending; });
  expect(result.current.disabled).toBe(false);
});


test.each([false, true])('drag reorder is canceled when queue changed=%s', async (changed) => {
  const items = ['a', 'b', 'c'].map((_id, order) => ({
    _id, order, latitude: order, longitude: order,
  }));
  api.getWaypoints.mockResolvedValue(items);
  const reorder = vi.spyOn(api, 'reorderWaypoints').mockResolvedValue({});
  vi.useFakeTimers();
  try {
    await act(async () => { render(<WaypointPanel />); });
    expect(screen.getByRole('button', { name: 'Add' }).disabled).toBe(false);
    fireEvent.dragStart(screen.getAllByRole('listitem')[0]);
    if (changed) {
      api.getWaypoints.mockResolvedValue(items.slice(1));
      await act(async () => { await vi.advanceTimersByTimeAsync(2000); });
    }
    const rows = screen.getAllByRole('listitem');
    await act(async () => { fireEvent.drop(rows[rows.length - 1]); });
    if (changed) expect(reorder).not.toHaveBeenCalled();
    else expect(reorder).toHaveBeenCalledWith(['b', 'c', 'a']);
  } finally { vi.useRealTimers(); }
});
