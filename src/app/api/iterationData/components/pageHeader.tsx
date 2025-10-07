"use client";
type Props = { onSave: () => void; disabled?: boolean; };
export default function PageHeader({ onSave, disabled }: Props) {
  return (
    <div className="px-4 pt-6">
      <div className="flex items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[32px] leading-9 font-bold text-[#0A2342]">Data packages</h1>
          <p className="text-[#7B8CA6] mt-1">Selected sets will be used in iterations.</p>
        </div>
        <button
          onClick={onSave}
          className="shrink-0 inline-flex items-center gap-2 bg-[#0A2342] text-white px-6 py-3 rounded-full font-semibold shadow hover:bg-[#18345A] transition-all disabled:opacity-60"
          disabled={disabled}
        >
          Save
        </button>
      </div>
    </div>
  );
}
