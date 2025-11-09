import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";
import { URL_API_ALB } from "@/config";

type Suite = { id: string; name?: string; description?: string } | null;

export function useSuiteMeta(suiteDetails: Suite) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [descDraft, setDescDraft] = useState("");
  const [savingMeta, setSavingMeta] = useState(false);

  useEffect(() => {
    if (suiteDetails) {
      setTitleDraft(suiteDetails.name || "");
      setDescDraft(suiteDetails.description || "");
    }
  }, [suiteDetails?.id]);

  const saveMeta = useCallback(async (partial: { name?: string; description?: string }) => {
    if (!suiteDetails?.id) return;
    setSavingMeta(true);
    try {
      await axios.patch(`${URL_API_ALB}testSuite`, {
        id: suiteDetails.id,
        ...partial,
        updatedBy: "jpaz",
      });
      toast.success("Suite actualizada.");
      if (partial.name !== undefined) setEditingTitle(false);
      if (partial.description !== undefined) setEditingDesc(false);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "No se pudo actualizar la suite.");
    } finally {
      setSavingMeta(false);
    }
  }, [suiteDetails?.id]);

  const commitTitle = useCallback(() => {
    const v = titleDraft.trim();
    if (!v || v === (suiteDetails?.name || "")) {
      setEditingTitle(false);
      setTitleDraft(suiteDetails?.name || "");
      return;
    }
    saveMeta({ name: v });
  }, [titleDraft, suiteDetails?.name, saveMeta]);

  const commitDesc = useCallback(() => {
    const v = descDraft.trim();
    if (v === (suiteDetails?.description || "")) {
      setEditingDesc(false);
      setDescDraft(suiteDetails?.description || "");
      return;
    }
    saveMeta({ description: v });
  }, [descDraft, suiteDetails?.description, saveMeta]);

  return {
    editingTitle, setEditingTitle,
    editingDesc, setEditingDesc,
    titleDraft, setTitleDraft,
    descDraft, setDescDraft,
    savingMeta,
    commitTitle, commitDesc,
  };
}
