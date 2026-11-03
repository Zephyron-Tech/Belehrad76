"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Tichá smyčka s plakátem. Při omezení pohybu se nespustí sama; tlačítko ji vždy zastaví nebo pustí
 * (pohyb delší než 5 s musí jít zastavit).
 */
export function LoopVideo({ sources, poster, label, className = "" }: { sources: { src: string; type: string }[]; poster: string; label: string; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const v = ref.current;
    if (!v || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    v.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  }, []);

  const toggle = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) v.play().then(() => setPlaying(true)).catch(() => {});
    else {
      v.pause();
      setPlaying(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <video ref={ref} muted loop playsInline preload="metadata" poster={poster} aria-label={label} className="h-full w-full object-cover">
        {sources.map((s) => (
          <source key={s.src} src={s.src} type={s.type} />
        ))}
      </video>
      <button type="button" onClick={toggle} className="btn btn-ink absolute bottom-3 left-3 min-h-11 px-4 text-[1rem]">
        {playing ? "Zastavit video" : "Přehrát video"}
      </button>
    </div>
  );
}
