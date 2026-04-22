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
    }, 5000); // 5 seconds for testing
  }, []);

  useEffect(() => {
    if (!isCompatibilityMode) return;

    const events = ['mousedown', 'mousemove', 'keypress', 'touchstart'];
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

      const width = 280; // Match new width
      const height = 100; // Match new height
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;

      x += vx;
      y += vy;

      if (x <= 0 || x + width >= screenWidth) {
        velRef.current.vx *= -1;
        x = Math.max(0, Math.min(x, screenWidth - width));
      }
      if (y <= 0 || y + height >= screenHeight) {
        velRef.current.vy *= -1;
        y = Math.max(0, Math.min(y, screenHeight - height));
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
      // Compatibility for various browsers to get current scroll position
      const doc = document.documentElement;
      const body = document.body;
      const currentScroll = window.pageYOffset || doc.scrollTop || body.scrollTop || 0;
      const totalHeight = Math.max(body.scrollHeight, doc.scrollHeight, body.offsetHeight, doc.offsetHeight, body.clientHeight, doc.clientHeight);
      const viewportHeight = window.innerHeight || doc.clientHeight || body.clientHeight;
      const maxScroll = totalHeight - viewportHeight;
      
      if (maxScroll <= 0) return; // Nothing to scroll

      if (currentScroll >= maxScroll - 5) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        // Try multiple methods for broad compatibility
        const nextPos = currentScroll + 1;
        window.scrollTo(0, nextPos);
        if (doc.scrollTop !== nextPos) doc.scrollTop = nextPos;
        if (body.scrollTop !== nextPos) body.scrollTop = nextPos;
      }
    }, 100);

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
      className={`fixed z-[9999] pointer-events-none select-none flex items-center justify-center p-6 bg-green-600 border-2 border-green-400 rounded-2xl shadow-[0_0_40px_rgba(34,197,94,0.4)] text-white font-bold text-xl transition-all duration-1000 ease-in-out ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
      style={{
        width: '280px',
        height: '100px',
        left: 0,
        top: 0,
        transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
        willChange: 'transform',
      }}
    >
      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
          <span className="text-[10px] uppercase tracking-[0.2em] text-green-100 opacity-90">System Active</span>
        </div>
        <span className="text-xl tracking-tight text-center">This is a touch-screen</span>
      </div>
    </div>
  );
}
