"use client";

import React, { useEffect, useLayoutEffect, useRef, useState, useCallback } from "react";
import ButtonTab from "./ButtonTab";

type UnderlineTabsProps = {
  tabs: string[];
  value: string;
  onChange: (v: string) => void;
  className?: string;
  indicatorWidthPx?: number;
};

export const UnderlineTabs: React.FC<UnderlineTabsProps> = ({
  tabs,
  value,
  onChange,
  className = "",
  indicatorWidthPx,
}) => {
  const headerRef = useRef<HTMLDivElement | null>(null);
  const trackRef  = useRef<HTMLDivElement | null>(null);
  const btnRefs   = useRef<(HTMLButtonElement | null)[]>([]);
  const [pos, setPos] = useState<{ left: number; width: number }>({ left: 0, width: 0 });

  // ✅ ref callback que NO devuelve nada
  const setBtnRef = useCallback(
    (i: number): React.RefCallback<HTMLButtonElement> =>
      (el: HTMLButtonElement | null) => {
        btnRefs.current[i] = el; // <- sin return
      },
    []
  );

  const recalc = () => {
    const track = trackRef.current;
    const idx = tabs.indexOf(value);
    const btn = btnRefs.current[idx];
    if (!track || idx < 0 || !btn) return;

    const trackRect = track.getBoundingClientRect();
    const btnRect   = btn.getBoundingClientRect();

    const naturalWidth = btnRect.width;
    const width = indicatorWidthPx ?? Math.max(24, Math.min(naturalWidth, 200));
    const center = btnRect.left + naturalWidth / 2;
    const left   = center - width / 2 - trackRect.left;

    setPos({ left: Math.max(0, left), width: Math.min(width, trackRect.width) });
  };

  useLayoutEffect(() => { recalc(); }, [value, tabs.join("|")]);

  useEffect(() => {
    const ro = new ResizeObserver(() => recalc());
    if (headerRef.current) ro.observe(headerRef.current);
    if (trackRef.current)  ro.observe(trackRef.current);
    btnRefs.current.forEach((b) => b && ro.observe(b));
    const onResize = () => recalc();
    window.addEventListener("resize", onResize);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div className={`w-full ${className} pb-4`}>
      <div ref={headerRef} className="flex gap-10 justify-start w-full">
        {tabs.map((t, i) => (
        //   <button
        //     key={t}
        //     ref={setBtnRef(i)}
        //     type="button"
        //     role="tab"
        //     aria-selected={value === t}
        //     onClick={() => onChange(t)}
        //     className={[
        //       "pb-2 text-lg transition-colors",
        //       value === t ? "text-[#0f2647] font-semibold" : "text-slate-500 hover:text-slate-700",
        //     ].join(" ")}
        //   >
        //     {t}
        //   </button>

        <ButtonTab
            key={t}
            label={t}
            value={t}
            isActive={value === t}
            onClick={onChange}
            className="!bg-transparent"
            underlineWidthClass="w-20 !bg-[#3b5af1]"
          />
        ))}
      </div>

      <div ref={trackRef} className="relative mt-1 h-1 w-full rounded bg-slate-100">
        <div
          className="absolute top-0 h-1 rounded bg-[#3b5af1] transition-all duration-300"
          
        />
      </div>
    </div>
  );
};
