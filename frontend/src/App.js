import './App.css';
import StatusBar from './components/StatusBar';
import BoatMap from './components/BoatMap';
import TelemetryPanel from './components/TelemetryPanel';
import WaypointPanel from './components/WaypointPanel';
import BuoyPanel from './components/BuoyPanel';
import ManualControlPanel from './components/ManualControlPanel';
import ModeSelector from './components/ModeSelector';
import ZoneConfigPanel from './components/ZoneConfigPanel';
import StationKeepingPanel from './components/StationKeepingPanel';
import CVPanel from './components/CVPanel';

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
          <StationKeepingPanel />
          <CVPanel />
        </div>
        <div className="app-side-column">
          <ModeSelector />
          <ManualControlPanel />
          <ZoneConfigPanel />
          <WaypointPanel />
          <BuoyPanel />
        </div>
      </main>
    </div>
  );
}

export default App;
