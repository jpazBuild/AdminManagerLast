import { Copy } from "lucide-react";
import React from "react";

type Props = {
  darkMode?: boolean;
};

export default function EmptyStateSelectAnimation({ darkMode = false }: Props) {
  const panelBg = darkMode ? "bg-gray-800" : "bg-white";
  const panelBorder = darkMode ? "border-white/15" : "border-slate-300";
  const titleColor = darkMode ? "text-white" : "text-slate-800";
  const subColor = darkMode ? "text-white/60" : "text-slate-500";
  const chipLight = darkMode ? "bg-white/10 text-white" : "bg-primary text-white";
  const chipMid = darkMode ? "bg-white/15 text-white" : "bg-primary/80 text-white";
  const chipSoft = darkMode ? "bg-white/20 text-white" : "bg-primary/50 text-white";
  const chipOutline = darkMode ? "bg-white/5 text-primary" : "bg-primary/20 text-primary";
  const iconColor = darkMode ? "text-white/60" : "text-slate-400";
  const monoColor = darkMode ? "text-white/80" : "text-slate-600";
  const svgBg = darkMode ? "#0F1318" : "#F1F5F9";
  const svgCardFill = darkMode ? "#0B0E11" : "#FFFFFF";
  const svgCardStroke = darkMode ? "#293241" : "#CBD5E1";
  const svgLine = darkMode ? "#3B82F6" : "#3B82F6";
  const svgGray = darkMode ? "#334155" : "#E5E7EB";
  const tickVar = darkMode ? "#E5E7EB" : "#021d3d";
  const rippleVar = darkMode ? "rgba(59,130,246,1)" : "rgba(2,29,61,1)";

  return (
    <div className="flex flex-col items-center justify-center mt-20 gap-4 text-center">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 120" className="w-40 h-28" aria-hidden="true">
        <defs>
          <linearGradient id="grad" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#93C5FD" />
            <stop offset="100%" stopColor="#60A5FA" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="160" height="120" rx="12" fill={svgBg} />
        <rect x="34" y="22" width="70" height="86" rx="8" fill={svgCardFill} stroke={svgCardStroke} />
        <rect x="44" y="36" width="50" height="6" rx="3" fill={svgGray} />
        <rect x="44" y="50" width="42" height="6" rx="3" fill={svgGray} />
        <rect x="44" y="64" width="48" height="6" rx="3" fill={svgGray} />
        <rect x="44" y="78" width="32" height="6" rx="3" fill={svgGray} />
        <circle cx="106" cy="74" r="18" fill="url(#grad)" opacity="0.25" />
        <circle cx="104" cy="72" r="12" fill="none" stroke="#60A5FA" strokeWidth="3" />
        <line x1="112" y1="80" x2="122" y2="90" stroke={svgLine} strokeWidth="4" strokeLinecap="round" />
      </svg>

      <h3 className={`text-lg font-semibold ${titleColor}`}>No tests selected</h3>
      <p className={`text-sm ${subColor} max-w-md`}>Please select test cases from the list to view their reports here.</p>

      <div className="w-full flex justify-center">
        <div className={`relative w-[880px] max-w-full rounded-xl border ${panelBorder} ${panelBg} p-4 shadow-sm overflow-hidden`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="relative">
                <div className={`h-5 w-5 rounded-md border-2 ${darkMode ? "border-white/40 bg-transparent" : "border-slate-400 bg-white"} checkbox-anim`} />
              </div>

              <div className="min-w-0 flex flex-col">
                <div className={`text-[15px] font-medium self-start flex gap-2 items-center ${darkMode ? "text-white/90" : "text-slate-700"}`}>
                  Example Test Case Name
                  <Copy className={`w-4 h-4 cursor-pointer ${iconColor}`} />
                </div>
                <div className={`mt-2 flex items-center gap-2 text-xs ${subColor}`}>
                  <span className="select-none">Id:</span>
                  <span className={`font-mono ${monoColor}`}>232323-2343243-34343-34344-343434</span>
                  <Copy className={`w-4 h-4 cursor-pointer ${iconColor}`} />
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <span className={`px-3 py-1.5 rounded-full text-[11px] font-semibold ${chipLight}`}>Example tag</span>
                  <span className={`px-3 py-1.5 rounded-full text-[11px] font-semibold ${chipMid}`}>Example Group</span>
                  <span className={`px-3 py-1.5 rounded-full text-[11px] font-semibold ${chipSoft}`}>Example Module</span>
                  <span className={`px-3 py-1.5 rounded-full text-[11px] font-semibold ${chipOutline}`}>Example Submodule</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 shrink-0">
              <div className="text-right flex flex-col gap-2">
                <div className={`text-[12px] ${subColor}`}>Automation</div>
                <div className={`text-[13px] font-medium ${darkMode ? "text-white/90" : "text-slate-700"}`}>10/10/2025, 10:10</div>
              </div>
            </div>
          </div>

          <div className="pointer-events-none absolute top-0 left-0 w-full h-full">
            <div className="cursor-anim" />
          </div>
        </div>
      </div>

      <style jsx>{`
        :global(.checkbox-anim),
        :global(.run-press),
        :global(.cursor-anim) {
          --dur: 5.5s;
          --tick: ${tickVar};
          --ripple: ${rippleVar};
        }

        .cursor-anim {
          position: absolute;
          width: 22px;
          height: 28px;
          background: no-repeat center/contain
            url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 32'><path d='M3 2 L21 15 L12 17 L14 28 L10 28 L8 16 L3 2 Z' fill='${darkMode ? "%23fff" : "%23000"}' opacity='0.2'/></svg>");
          transform-origin: 6px 4px;
          animation: cursorPath var(--dur) ease-in-out infinite;
          filter: drop-shadow(0 2px 2px rgba(0,0,0,.25));
        }

        @keyframes cursorPath {
          0%   { transform: translate(760px, -40px) scale(1); opacity: 0; }
          10%  { transform: translate(28px, 22px) scale(1);    opacity: 1; }
          14%  { transform: translate(28px, 22px) scale(0.96) rotate(-4deg); }
          18%  { transform: translate(28px, 22px) scale(1) rotate(0deg); }
          42%  { transform: translate(740px, 58px) scale(1); }
          46%  { transform: translate(740px, 58px) scale(0.95) rotate(-3deg); }
          50%  { transform: translate(740px, 58px) scale(1) rotate(0deg); }
          100% { transform: translate(760px, -40px) scale(1); opacity: 0; }
        }

        .checkbox-anim {
          position: relative;
          overflow: hidden;
          animation: cbPulse var(--dur) ease-in-out infinite;
          border-radius: 4px;
        }
        .checkbox-anim::before {
          content: "";
          position: absolute;
          inset: 0;
          background: ${darkMode ? "#2563EB" : "#021d3d"};
          transform: scale(0);
          border-radius: 4px;
          animation: cbFill var(--dur) ease-in-out infinite;
        }
        .checkbox-anim::after {
          content: "";
          position: absolute;
          left: 50%;
          top: 50%;
          width: 8px;
          height: 14px;
          border-right: 3px solid var(--tick);
          border-bottom: 3px solid var(--tick);
          transform-origin: 0 100%;
          transform: translate(-50%, -50%) rotate(40deg) scale(0);
          animation: cbTick var(--dur) ease-in-out infinite;
        }

        @keyframes cbFill {
          0%, 9%   { transform: scale(0); }
          10%, 18% { transform: scale(1); }
          60%, 100%{ transform: scale(1); }
        }
        @keyframes cbTick {
          0%, 9%   { transform: translate(-50%, -50%) rotate(40deg) scale(0); }
          12%, 18% { transform: translate(-50%, -50%) rotate(40deg) scale(1); }
          60%, 100%{ transform: translate(-50%, -50%) rotate(40deg) scale(1); }
        }
        @keyframes cbPulse {
          10% { box-shadow: 0 0 0 0 rgba(59,130,246,.35); }
          18% { box-shadow: 0 0 0 12px rgba(59,130,246,0); }
        }

        .run-press { position: relative; overflow: hidden; animation: runPress var(--dur) ease-in-out infinite; }
        .run-press::after {
          content: "";
          position: absolute;
          left: 50%;
          top: 50%;
          width: 10px;
          height: 10px;
          border-radius: 9999px;
          background: var(--ripple);
          transform: translate(-50%, -50%) scale(0);
          animation: runRipple var(--dur) ease-out infinite;
        }

        @keyframes runPress {
          0%, 40% { transform: scale(1); }
          46%     { transform: scale(.97); filter: brightness(1.05); }
          52%     { transform: scale(1);   filter: none; }
        }
        @keyframes runRipple {
          0%, 44%  { transform: translate(-50%, -50%) scale(0); opacity: 0; }
          46%      { transform: translate(-50%, -50%) scale(0.6); opacity: .45; }
          52%      { transform: translate(-50%, -50%) scale(8);   opacity: 0; }
          60%,100% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
