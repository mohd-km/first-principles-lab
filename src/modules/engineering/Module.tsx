import { useEffect, useRef } from 'react';
import './styles.css';
import { mountEngineering } from './main.js';

export default function Engineering() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const destroy = mountEngineering(el) as () => void;
    return destroy;
  }, []);
  return <div className="page-shell"><div ref={ref} /></div>;
}
