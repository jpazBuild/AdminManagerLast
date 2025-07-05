import { FaChevronDown, FaChevronUp } from "react-icons/fa";

interface ExpandablePanelProps {
    title: string;
    panelKey: string;
    openPanels: { [key: string]: boolean };
    togglePanel: (key: string) => void;
    children: React.ReactNode;
    className?: string;
}

const ExpandablePanel = ({
    title,
    panelKey,
    openPanels,
    togglePanel,
    children,
    className = "p-2 bg-white rounded-md",
}: ExpandablePanelProps) => {
    return (
        <div className={className}>
            <div
                className="flex border-l-6 p-1 rounded-md items-center justify-between cursor-pointer select-none mb-2"
                onClick={() => togglePanel(panelKey)}
            >
                <span className="text-primary font-semibold mr-1">{title}</span>
                {openPanels[panelKey] ? (
                    <FaChevronUp className="text-primary" />
                ) : (
                    <FaChevronDown className="text-primary" />
                )}
            </div>
            {openPanels[panelKey] && children}
        </div>
    );
}

export default ExpandablePanel;