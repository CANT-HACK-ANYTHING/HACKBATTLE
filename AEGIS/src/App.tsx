import { useEffect } from 'react';
import { useAppStore } from './store/appStore';
import { TopBar } from './components/TopBar';
import { Sidebar } from './components/Sidebar';
import { SpatialCanvas } from './components/SpatialCanvas';
import { InspectorPanel } from './components/InspectorPanel';
import { NewAgentModal } from './components/NewAgentModal';
import { ApprovalModal } from './components/ApprovalModal';

export function App() {
  const { loadAgents, loadApprovals } = useAppStore();

  useEffect(() => {
    loadAgents();
    loadApprovals();
  }, [loadAgents, loadApprovals]);

  return (
    <div className="app">
      {/* 1. Global Futuristic Top Bar */}
      <TopBar />

      {/* 2. Main Body Layout */}
      <div className="body">
        {/* Left Workflow & Runtime Sidebar */}
        <Sidebar />

        {/* Central Spatial Multi-Agent Canvas */}
        <SpatialCanvas />

        {/* Right Context Inspector Drawer */}
        <InspectorPanel />
      </div>

      {/* 3. Modals & Overlays */}
      <NewAgentModal />
      <ApprovalModal />
    </div>
  );
}

export default App;
