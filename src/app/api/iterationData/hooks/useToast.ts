"use client";
import { useRef, useState } from "react";

export function useToast() {
  const [toast, setToast] = useState<{visible: boolean; msg: string; variant: "success"|"error"}>({
    visible: false, msg: "", variant: "success"
  });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = (msg: string, variant: "success"|"error" = "success", ms = 3000) => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ visible: true, msg, variant });
    timer.current = setTimeout(() => setToast(t => ({ ...t, visible: false })), ms);
  };

  const hide = () => setToast(t => ({ ...t, visible: false }));

  return { toast, show, hide };
}
