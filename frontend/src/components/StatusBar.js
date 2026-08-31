import { useState } from 'react';
import usePolling from '../hooks/usePolling';
import { getRosStatus, connectRos } from '../api/ros';

export default function StatusBar() {
  const { data: status, error } = usePolling(getRosStatus, 3000);
  const [url, setUrl] = useState('');
  const [pending, setPending] = useState(false);
  const connected = !error && status?.connected;

  const handleConnect = async (e) => {
    e.preventDefault();
    if (!url) return;
    setPending(true);
    try {
      await connectRos(url);
    } finally {
      setPending(false);
    }
  };

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
      <form className="ros-url-form" onSubmit={handleConnect}>
        <input
          type="url"
          placeholder="ws://localhost:9090"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button type="submit" disabled={pending}>Connect</button>
      </form>
    </div>
  );
}
