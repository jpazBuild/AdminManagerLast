import { useMemo, useCallback } from "react";

type Header = { id: string };

export function useBulkVisibleSelection(
  searchResults: Header[],
  selectedCaseIdsForAdd: string[],
  setSelectedCaseIdsForAdd: (updater: (prev: string[]) => string[]) => void
) {
  const visibleIds = useMemo(() => (searchResults || []).map(r => String(r.id)), [searchResults]);

  const allVisibleSelected = useMemo(() => {
    if (!visibleIds.length) return false;
    return visibleIds.every(id => selectedCaseIdsForAdd.includes(id));
  }, [visibleIds, selectedCaseIdsForAdd]);

  const someVisibleSelected = useMemo(() => {
    if (!visibleIds.length) return false;
    const count = visibleIds.filter(id => selectedCaseIdsForAdd.includes(id)).length;
    return count > 0 && count < visibleIds.length;
  }, [visibleIds, selectedCaseIdsForAdd]);

  const toggleAllVisible = useCallback(() => {
    if (!visibleIds.length) return;
    if (allVisibleSelected) {
      setSelectedCaseIdsForAdd(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      setSelectedCaseIdsForAdd(prev => {
        const set = new Set(prev);
        visibleIds.forEach(id => set.add(id));
        return Array.from(set);
      });
    }
  }, [visibleIds, allVisibleSelected, setSelectedCaseIdsForAdd]);

  return { visibleIds, allVisibleSelected, someVisibleSelected, toggleAllVisible };
}
