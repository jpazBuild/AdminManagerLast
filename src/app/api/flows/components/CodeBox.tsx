

const CodeBox: React.FC<{ value: string }> = ({ value }) => (
    <textarea
        readOnly
        value={value}
        className="w-full h-64 rounded-md border border-primary/20 bg-slate-50 px-3 py-2 font-mono text-[12px] leading-5"
    />
);
export default CodeBox;