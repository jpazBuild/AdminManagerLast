

const TabBtn: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({
    active,
    onClick,
    children,
}) => (
    <button
        onClick={onClick}
        className={`px-3 py-2 text-sm rounded-md ${active ? "bg-primary/10 text-primary/90" : "text-slate-600 hover:bg-slate-100"
            }`}
    >
        {children}
    </button>
);

export default TabBtn;