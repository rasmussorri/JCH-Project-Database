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

    const events = ['mousedown', 'keypress', 'touchstart'];
    events.forEach(event => window.addEventListener(event, resetTimer));
    resetTimer();

    return () => {
      events.forEach(event => window.removeEventListener(event, resetTimer));
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [isCompatibilityMode, resetTimer]);

  // Bouncing animation - Use setInterval instead of RAF for lower frequency
  useEffect(() => {
    if (!isIdle || !isCompatibilityMode) {
      if (requestRef.current) clearInterval(requestRef.current);
      return;
    }

    requestRef.current = window.setInterval(() => {
      const { vx, vy } = velRef.current;
      let { x, y } = posRef.current;

      const width = 280;
      const height = 100;
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
    }, 32); // 32ms (~31fps) - The 'sweet spot' for smooth signage motion

    return () => {
      if (requestRef.current) clearInterval(requestRef.current);
    };
  }, [isIdle, isCompatibilityMode]);

  // Auto-scroll logic
  useEffect(() => {
    if (!isIdle || !isCompatibilityMode) {
      if (scrollRef.current) clearInterval(scrollRef.current);
      return;
    }

    scrollRef.current = window.setInterval(() => {
      const doc = document.documentElement;
      const body = document.body;
      const currentScroll = window.pageYOffset || doc.scrollTop || body.scrollTop || 0;
      const totalHeight = Math.max(body.scrollHeight, doc.scrollHeight, body.offsetHeight, doc.offsetHeight, body.clientHeight, doc.clientHeight);
      const viewportHeight = window.innerHeight || doc.clientHeight || body.clientHeight;
      const maxScroll = totalHeight - viewportHeight;
      
      if (maxScroll <= 0) return;

      if (currentScroll >= maxScroll - 10) {
        // Jump back to top immediately (smooth behavior often fails on Tizen)
        window.scrollTo(0, 0);
        doc.scrollTop = 0;
        body.scrollTop = 0;
      } else {
        const nextPos = currentScroll + 1;
        window.scrollTo(0, nextPos);
        if (doc.scrollTop !== nextPos) doc.scrollTop = nextPos;
        if (body.scrollTop !== nextPos) body.scrollTop = nextPos;
      }
    }, 85); // 15% faster than 100ms

    return () => {
      if (scrollRef.current) clearInterval(scrollRef.current);
    };
  }, [isIdle, isCompatibilityMode]);

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(isIdle);
  }, [isIdle]);

  if (!isCompatibilityMode || !isVisible) return null;

  return (
    <div 
      className="fixed z-[9999] pointer-events-none select-none flex items-center justify-center p-6 text-white font-bold"
      style={{
        width: '280px',
        height: '100px',
        backgroundColor: '#16a34a',
        border: '4px solid #86efac',
        borderRadius: '20px',
        left: pos.x + 'px',
        top: pos.y + 'px',
        fontSize: '24px',
        lineHeight: '1.2',
        textAlign: 'center'
      }}
    >
      This is a touch-screen
    </div>
  );
}
