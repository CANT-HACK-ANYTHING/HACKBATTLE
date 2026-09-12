import React from 'react';
import { DemoProvider } from './context/DemoContext';
import { SpatialCanvas } from './components/spatial/SpatialCanvas';

function App() {
  return (
    <DemoProvider>
      <SpatialCanvas />
    </DemoProvider>
  );
}

export default App;
