"use client";
import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/sonner";

type Theme = "light" | "dark" | "system";

export default function ThemeToaster() {
    const [theme, setTheme] = useState<Theme>("system");

    const readTheme = () => {
        const v = localStorage.getItem("darkMode");
        if (v === "true") return "dark";
        if (v === "false") return "light";
        return "system";
    };

    useEffect(() => {
        setTheme(readTheme());

        const onStorage = (e: StorageEvent) => {
            if (e.key === "darkMode") setTheme(readTheme());
        };
        window.addEventListener("storage", onStorage);

        const onLocal = () => setTheme(readTheme());
        window.addEventListener("darkmode-changed", onLocal as EventListener);

        return () => {
            window.removeEventListener("storage", onStorage);
            window.removeEventListener("darkmode-changed", onLocal as EventListener);
        };
    }, []);

    return (
        <Toaster
            theme={theme}
            position="top-right"
            richColors
            closeButton
            duration={3500}
        />
    );
}
