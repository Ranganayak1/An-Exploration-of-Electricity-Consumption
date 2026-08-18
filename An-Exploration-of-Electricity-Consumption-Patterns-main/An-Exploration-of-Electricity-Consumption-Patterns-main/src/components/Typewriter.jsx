import { useEffect, useState } from 'react';

export default function Typewriter({ texts = [], speed = 60, pause = 1200, className = '' }) {
  const [index, setIndex] = useState(0);
  const [display, setDisplay] = useState('');
  const [phase, setPhase] = useState('typing');

  useEffect(() => {
    let mounted = true;
    let timer;

    const current = texts[index] || '';

    if (phase === 'typing') {
      if (display.length < current.length) {
        timer = setTimeout(() => {
          if (!mounted) return;
          setDisplay(current.slice(0, display.length + 1));
        }, speed);
      } else {
        timer = setTimeout(() => { if (mounted) setPhase('pause'); }, pause);
      }
    }

    if (phase === 'deleting') {
      if (display.length > 0) {
        timer = setTimeout(() => { if (mounted) setDisplay(display.slice(0, -1)); }, speed / 2);
      } else {
        setPhase('typing');
        setIndex((i) => (i + 1) % texts.length);
      }
    }

    if (phase === 'pause') {
      timer = setTimeout(() => { if (mounted) setPhase('deleting'); }, 700);
    }

    return () => { mounted = false; clearTimeout(timer); };
  }, [display, phase, index, texts, speed, pause]);

  return <span className={`typewriter ${className}`}>{display}</span>;
}
