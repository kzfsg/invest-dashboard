import { useState, useEffect } from 'react';
import './App.css';
import Silk from './components/Silk';
import Aurora from './components/Aurora';

function App() {
  const [background, setBackground] = useState<'silk' | 'aurora'>('silk');
  const [isMounted, setIsMounted] = useState(false);

  // Add a small delay to ensure the components are properly mounted
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const toggleBackground = () => {
    setBackground(prev => prev === 'silk' ? 'aurora' : 'silk');
  };

  return (
    <div className="app">
      {isMounted && (
        <>
          {background === 'silk' ? (
            <Silk 
              speed={5}
              scale={1}
              color="#7B7481"
              noiseIntensity={1.5}
              rotation={0}
            />
          ) : (
            <Aurora
              colorStops={["#3A29FF", "#FF94B4", "#FF3232"]}
              blend={0.5}
              amplitude={1.0}
              speed={0.5}
            />
          )}
        </>
      )}
      
      <div className="content">
        <h1>Background Toggle Demo</h1>
        <button 
          onClick={toggleBackground} 
          className="toggle-button"
        >
          Switch to {background === 'silk' ? 'Aurora' : 'Silk'} Background
        </button>
      </div>
    </div>
  );
}

export default App;
