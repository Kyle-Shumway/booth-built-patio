import React from 'react';
import { useStore } from './store/useStore';
import Header from './components/Header';
import DesignCanvas from './components/DesignCanvas';
import Controls from './components/Controls';
import Constraints from './components/Constraints';
import PostConstraints from './components/PostConstraints';
import CostPanel from './components/CostPanel';
import Modal3D from './components/Modal3D';
import './App.css';

function App() {
  const show3D = useStore(state => state.show3D);

  return (
    <div className="app">
      <div className="container">
        <Header />
        
        <div className="main-content">
          <div className="design-area">
            <DesignCanvas />
            <div className="controls-section">
              <Controls />
              <PostConstraints />
              <Constraints />
            </div>
          </div>
          
          <CostPanel />
        </div>
      </div>
      
      {show3D && <Modal3D />}
    </div>
  );
}

export default App;