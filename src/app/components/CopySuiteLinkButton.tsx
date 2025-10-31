import { Link2Icon, Check, Loader2 } from "lucide-react";
import { useState } from "react";

const CopySuiteLinkButton = ({
  isDarkMode,
  suiteId,
}: {
  isDarkMode: boolean;
  suiteId: string;
}) => {
  const [copyState, setCopyState] = useState<"idle" | "copying" | "done">("idle");

  const handleCopy = async () => {
    try {
      setCopyState("copying");
      await navigator.clipboard.writeText(`${window.location.origin}/testSuites/${suiteId}`);
      setCopyState("done");
      setTimeout(() => setCopyState("idle"), 2000);
    } catch {
      setCopyState("idle");
    }
  };

  const baseCls = `px-3 py-2 rounded-md font-semibold flex items-center gap-2 transition-all duration-200 ${
    isDarkMode ? "bg-gray-700 hover:bg-gray-600 text-white" : "bg-gray-200 hover:bg-gray-300 text-primary"
  }`;

  return (
    <button
      onClick={handleCopy}
      disabled={copyState === "copying"}
      className={`${baseCls} ${copyState === "copying" ? "opacity-80 cursor-wait" : ""}`}
      aria-live="polite"
    >
      {copyState === "idle" && <Link2Icon className={isDarkMode ? "text-white" : "text-primary"} />}
      {copyState === "copying" && <Loader2 className="animate-spin" />}
      {copyState === "done" && <Check className={isDarkMode ? "text-green-400" : "text-green-600"} />}
      <span className="text-sm">
        {copyState === "idle" && "Copy link"}
        {copyState === "copying" && "Copying…"}
        {copyState === "done" && "Copied!"}
      </span>
    </button>
  );
};

export default CopySuiteLinkButton;
