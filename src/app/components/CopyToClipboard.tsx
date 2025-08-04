import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button"; // Asegúrate que este Button es tu botón estilizado

const CopyToClipboard = ({ text,isDarkMode=false }: { text: string,isDarkMode: boolean }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async (e: React.MouseEvent) => {
        e.stopPropagation();
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    return (
        <Button asChild
            variant="ghost"
            size="icon"
            className="w-6 h-6 p-1 cursor-pointer hover:bg-accent/30 transition"
            onClick={handleCopy}
            title="Copy ID"
        >
            {copied ? (
                <Check className={`w-4 h-4 ${isDarkMode ? "text-white/90":"text-primary/90"}`} />
            ) : (
                <Copy className={`w-4 h-4 ${isDarkMode ? "text-white/90 hover:text-white/80":"text-primary/70 hover:text-primary/80"}`} />
            )}
        </Button>
    );
};

export default CopyToClipboard;