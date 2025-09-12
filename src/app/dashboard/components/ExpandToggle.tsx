import { Button } from "@/components/ui/button";
import { Expand, Shrink } from "lucide-react";

const ExpandToggle = ({
  isDarkMode,
  allExpanded,
  onExpandAll,
  onCollapseAll,
}: {
  isDarkMode: boolean;
  allExpanded: boolean;
  onExpandAll: () => void;
  onCollapseAll: () => void;
}) =>{
  const base = isDarkMode
    ? "bg-gray-800 text-white hover:bg-gray-700"
    : "bg-white text-primary/90 border border-primary/20 hover:bg-primary/10";

  return (
    <Button
      size="sm"
      className={base}
      onClick={allExpanded ? onCollapseAll : onExpandAll}
      aria-pressed={allExpanded}
      title={allExpanded ? "Collapse all" : "Expand all"}
    >
      {allExpanded ? (
        <>
          <Shrink className="h-4 w-4 mr-2" /> Collapse all
        </>
      ) : (
        <>
          <Expand className="h-4 w-4 mr-2" /> Expand all
        </>
      )}
    </Button>
  );
}


export default ExpandToggle;