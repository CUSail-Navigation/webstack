import usePolling from '../hooks/usePolling';
import { getRosStatus } from '../api/ros';

export default function StatusBar() {
  const { data: status, error } = usePolling(getRosStatus, 3000);
  const connected = !error && status?.connected;

  return (
    <div className="status-bar">
      <span className="status-dot" data-connected={connected} />
      <span>
        {connected
          ? `Connected to ${status.rosbridgeUrl}`
          : status
            ? `Disconnected (${status.rosbridgeUrl})`
            : 'Checking ROS connection…'}
      </span>
    </div>
  );
}
