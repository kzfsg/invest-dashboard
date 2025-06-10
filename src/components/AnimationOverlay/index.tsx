import { useEffect, useState } from 'react';
import './styles.css';

interface AnimationOverlayProps {
  onComplete: () => void;
}

const AnimationOverlay = ({ onComplete }: AnimationOverlayProps) => {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Start fade out after a delay
    const fadeOutTimer = setTimeout(() => {
      setFadeOut(true);
      
      // Notify parent component when animation is complete
      const completeTimer = setTimeout(() => {
        onComplete();
      }, 1000);
      
      return () => clearTimeout(completeTimer);
    }, 2000);
    
    return () => clearTimeout(fadeOutTimer);
  }, [onComplete]);

  return (
    <div className={`animation-overlay ${fadeOut ? 'fade-out' : ''}`}>
      <div className="welcome-text">theDashboard</div>
    </div>
  );
};

export default AnimationOverlay;
