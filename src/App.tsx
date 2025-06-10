import { useState, useEffect } from 'react';
import './App.css';
import Silk from './components/Silk';
import Aurora from './components/Aurora';
import AnimationOverlay from './components/AnimationOverlay';

function App() {
  const [background, setBackground] = useState<'silk' | 'aurora'>('silk');
  const [isMounted, setIsMounted] = useState(false);
  const [showAnimation, setShowAnimation] = useState(true);
  
  // Start with the content hidden until the animation completes
  useEffect(() => {
    // This effect is intentionally empty, just to ensure the initial state is correct
  }, []);

  // Handle animation completion
  const handleAnimationComplete = () => {
    setShowAnimation(false);
    // Small delay before showing the main content
    setTimeout(() => setIsMounted(true), 500);
  };

  const toggleBackground = () => {
    setBackground(prev => prev === 'silk' ? 'aurora' : 'silk');
  };

  return (
    <div className="app">
      {showAnimation && (
        <AnimationOverlay onComplete={handleAnimationComplete} />
      )}
      {isMounted && (
        <>
          {background === 'silk' ? (
            <Silk 
              speed={8}
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
              speed={2}
            />
          )}
        </>
      )}
      
      <div className="content">
        <h1>theDashboard</h1>
        <button 
          onClick={toggleBackground} 
          className="toggle-button"
        >
          {background === 'silk' ? 'Aurora' : 'Silk'} Background
        </button>
      </div>
    </div>
  );
}

export default App;
