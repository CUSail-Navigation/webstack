import Dial from './Dial';
import usePolling from '../hooks/usePolling';
import { getBoat } from '../api/boat';

// Polls GET /api/boat and renders the three gauges (heading, rudder, sail)
// plus a readout table for everything else the Boat document tracks.
export default function TelemetryPanel() {
  const { data: boat, error } = usePolling(getBoat, 1000);

  if (error) {
    return (
      <div className="panel">
        <h2>Telemetry</h2>
        <p className="empty-state">No boat data yet ({error.response?.status === 404 ? 'no boat record in the database' : error.message}).</p>
      </div>
    );
  }

  return (
    <div className="panel">
      <h2>Telemetry</h2>
      <div className="dial-row">
        <Dial label="Heading" value={boat?.heading} color="#3a7ca5" />
        <Dial label="Rudder" value={boat?.actualRudderAngle} color="#d64545" />
        <Dial label="Sail" value={boat?.actualSailAngle} color="#3a9d5d" />
      </div>
      <table className="stats-table">
        <tbody>
          <tr><td>Wind angle</td><td>{fmt(boat?.windAngle)}°</td></tr>
          <tr><td>Control mode</td><td>{boat?.controlMode ?? '—'}</td></tr>
          <tr><td>Tacking</td><td>{boat?.tacking ? 'Yes' : 'No'}</td></tr>
          <tr><td>Distance to dest</td><td>{fmt(boat?.distToDest)} m</td></tr>
          <tr><td>Target rudder / sail</td><td>{fmt(boat?.targetRudderAngle)}° / {fmt(boat?.targetSailAngle)}°</td></tr>
          <tr><td>Radio rudder / sail</td><td>{fmt(boat?.radioRudder)}° / {fmt(boat?.radioSail)}°</td></tr>
          <tr><td>Algo rudder / sail</td><td>{fmt(boat?.algoRudder)}° / {fmt(boat?.algoSail)}°</td></tr>
          <tr><td>Dropped packets</td><td>{boat?.droppedPackets ?? 0}</td></tr>
        </tbody>
      </table>
    </div>
  );
}

function fmt(n) {
  return Number.isFinite(n) ? n.toFixed(1) : '—';
}
