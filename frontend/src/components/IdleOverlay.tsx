import { useEffect, useState, useRef, useCallback } from 'react';

interface IdleOverlayProps {
  isCompatibilityMode: boolean;
}

export function IdleOverlay({ isCompatibilityMode }: IdleOverlayProps) {
  const [isIdle, setIsIdle] = useState(false);
  const [pos, setPos] = useState({ x: 100, y: 100 });
  const velRef = useRef({ vx: 2, vy: 2 });
  const posRef = useRef({ x: 100, y: 100 });
  const timerRef = useRef<number | null>(null);
  const requestRef = useRef<number | null>(null);
  const scrollRef = useRef<number | null>(null);

  const resetTimer = useCallback(() => {
    setIsIdle(false);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      setIsIdle(true);
    }, 60000); // 1 minute
  }, []);

  useEffect(() => {
    if (!isCompatibilityMode) return;

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => window.addEventListener(event, resetTimer));
    resetTimer();

    return () => {
      events.forEach(event => window.removeEventListener(event, resetTimer));
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [isCompatibilityMode, resetTimer]);

  // Bouncing animation
  useEffect(() => {
    if (!isIdle || !isCompatibilityMode) {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      return;
    }

    const animate = () => {
      const { vx, vy } = velRef.current;
      let { x, y } = posRef.current;

      const width = 240; // Approx width of label
      const height = 80; // Approx height of label
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;

      x += vx;
      y += vy;

      if (x <= 0 || x + width >= screenWidth) {
        velRef.current.vx *= -1;
      }
      if (y <= 0 || y + height >= screenHeight) {
        velRef.current.vy *= -1;
      }

      posRef.current = { x, y };
      setPos({ x, y });
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isIdle, isCompatibilityMode]);

  // Auto-scroll logic
  useEffect(() => {
    if (!isIdle || !isCompatibilityMode) {
      if (scrollRef.current) clearInterval(scrollRef.current);
      return;
    }

    scrollRef.current = window.setInterval(() => {
      const scrollStep = 1;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      
      if (window.scrollY >= maxScroll - 2) {
        // When reaching bottom, wait a bit then jump to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        // Use behavior: 'auto' for performance on low-end hardware
        window.scrollBy({ top: scrollStep, behavior: 'auto' });
      }
    }, 100); // 10px per second - very slow roll

    return () => {
      if (scrollRef.current) clearInterval(scrollRef.current);
    };
  }, [isIdle, isCompatibilityMode]);

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isIdle) {
      // Small delay to trigger transition after mounting if we were to mount/unmount
      // But we'll just keep it mounted when compat mode is on
      const t = setTimeout(() => setIsVisible(true), 10);
      return () => clearTimeout(t);
    } else {
      setIsVisible(false);
    }
  }, [isIdle]);

  if (!isCompatibilityMode) return null;

  return (
    <div 
      className={`fixed z-[9999] pointer-events-none select-none flex items-center justify-center p-6 bg-cyan-500/20 backdrop-blur-xl border border-cyan-500/40 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.2)] text-white font-bold text-xl transition-all duration-1000 ease-in-out ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
      style={{
        width: '240px',
        height: '80px',
        left: 0,
        top: 0,
        transform: `translate(${pos.x}px, ${pos.y}px) ${isVisible ? '' : 'scale(0.95)'}`,
      }}
    >
      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-[10px] uppercase tracking-[0.2em] text-cyan-300 opacity-90">System Active</span>
        </div>
        <span className="text-lg tracking-tight">Touch Screen</span>
      </div>
    </div>
  );
}
