import { useEffect, useRef, useState } from 'react';
import './GlitchText.css';

interface GlitchTextProps {
  children: React.ReactNode;
  speed?: number;
  enableShadows?: boolean;
  className?: string;
  playOnce?: boolean;
}

const GlitchText = ({
  children,
  speed = 1,
  enableShadows = true,
  className = '',
  playOnce = false,
}: GlitchTextProps) => {
  const [isVisible, setIsVisible] = useState(!playOnce);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const inlineStyles = {
    '--after-duration': `${speed * 3}s`,
    '--before-duration': `${speed * 2}s`,
    '--after-shadow': enableShadows ? '-5px 0 red' : 'none',
    '--before-shadow': enableShadows ? '5px 0 cyan' : 'none',
  } as React.CSSProperties;

  useEffect(() => {
    if (playOnce) {
      // Start animation after a small delay to ensure the component is mounted
      const timer = window.setTimeout(() => {
        setIsVisible(true);
        setIsAnimating(true);
        
        // Set timeout to hide the component after animation completes
        animationTimeoutRef.current = window.setTimeout(() => {
          setIsVisible(false);
          setIsAnimating(false);
        }, speed * 3000); // Adjust timing based on your animation duration
      }, 500);

      return () => {
        clearTimeout(timer);
        if (animationTimeoutRef.current) {
          clearTimeout(animationTimeoutRef.current);
        }
      };
    }
  }, [playOnce, speed]);

  if (!isVisible) return null;

  return (
    <div
      className={`glitch ${isAnimating ? 'glitch-animate' : ''} ${className}`}
      style={inlineStyles}
      data-text={children}
    >
      {children}
    </div>
  );
};

export default GlitchText;
