import 'leaflet/dist/leaflet.css';
import './App.css';
import StatusBar from './components/StatusBar';
import BoatMap from './components/BoatMap';
import TelemetryPanel from './components/TelemetryPanel';
import WaypointPanel from './components/WaypointPanel';
import BuoyPanel from './components/BuoyPanel';

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Sailbot Dashboard</h1>
        <StatusBar />
      </header>
      <main className="app-layout">
        <div className="app-main-column">
          <BoatMap />
          <TelemetryPanel />
        </div>
        <div className="app-side-column">
          <WaypointPanel />
          <BuoyPanel />
        </div>
      </main>
    </div>
  );
}

export default App;
