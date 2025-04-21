import { Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button"; // Asegúrate que esté usando tu diseño base
import { useState } from "react";

const DeleteButton = ({ onClick }: { onClick: () => void }) => {
    const [confirming, setConfirming] = useState(false);

    return confirming ? (
        <div className="flex gap-1">
            <Button
                size="icon"
                variant="destructive"
                className="w-6 h-6 p-1 bg-primary/20 hover:bg-primary/20 text-primary/90 transition"
                onClick={() => {
                    onClick();
                    setConfirming(false);
                }}
                title="Confirm delete"
            >
                <Check className="w-4 h-4" />
            </Button>
            <Button
                size="icon"
                variant="ghost"
                className="w-6 h-6 p-1 text-muted-foreground hover:bg-primary/10 hover:text-primary/90 transition"
                onClick={() => setConfirming(false)}
                title="Cancel"
            >
                ✕
            </Button>
        </div>
    ) : (
        <Button
            size="icon"
            variant="ghost"
            className="w-6 h-6 p-1 hover:bg-primary/10 hover:text-primary/90 transition"
            onClick={() => setConfirming(true)}
            title="Delete step"
        >
            <Trash2 className="w-4 h-4" />
        </Button>
    );
};

export default DeleteButton;
