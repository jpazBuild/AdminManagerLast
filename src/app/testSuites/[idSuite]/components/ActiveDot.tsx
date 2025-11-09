

const ActiveDot = ({ on, isDark }: { on: boolean; isDark: boolean }) =>
    on ? (
        <span
            className={[
                "absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full",
                "ring-2",
                isDark ? "bg-emerald-400 ring-gray-900" : "bg-emerald-500 ring-white",
            ].join(" ")}
        />
    ) : null;

export default ActiveDot;