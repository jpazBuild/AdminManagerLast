"use client";

type Props = {
  onSave: () => void | Promise<void>;
  onReset: () => void | Promise<void>;
  disabled?: boolean;
  showControls?: boolean; // controla visibilidad de Reset/Save
  className?: string;     // permite alinear con la card desde el page
};

export default function PageHeader({
  onSave,
  onReset,
  disabled,
  showControls = false,
  className = "",
}: Props) {
  return (
    <div className={`pt-6 ${className}`}>
      <div className="flex items-start md:items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-[32px] leading-9 font-bold text-[#0A2342]">Data packages</h1>
          <p className="text-[#7B8CA6] mt-1">Selected sets will be used in iterations.</p>
        </div>

        {showControls && (
          <div className="flex items-center gap-2">
            <button
              onClick={onReset}
              className="shrink-0 inline-flex items-center gap-2 border border-[#0A2342] text-[#0A2342] px-6 py-3 rounded-full font-semibold hover:bg-[#F5F8FB] transition-all disabled:opacity-60"
              disabled={disabled}
            >
              Reset changes
            </button>
            <button
              onClick={onSave}
              className="shrink-0 inline-flex items-center gap-2 bg-[#0A2342] text-white px-6 py-3 rounded-full font-semibold shadow hover:bg-[#18345A] transition-all disabled:opacity-60"
              disabled={disabled}
            >
              Save
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
