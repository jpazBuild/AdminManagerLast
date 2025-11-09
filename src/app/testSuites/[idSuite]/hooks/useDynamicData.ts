import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { URL_API_ALB } from "@/config";

type TestHeaderLite = { id: string; name?: string };

type UseDynamicDataParams = {
  dataBufById: Record<string, Record<string, any>>;
  setDataBufById: React.Dispatch<
    React.SetStateAction<Record<string, Record<string, any>>>
  >;
};

export function useDynamicData({ dataBufById, setDataBufById }: UseDynamicDataParams) {
  const [dynamicDataHeaders, setDynamicDataHeaders] = useState<any[]>([]);
  const [selectedDynamicDataId, setSelectedDynamicDataId] = useState<string>("");
  const [testData, setTestData] = useState<{ data?: Record<string, Record<string, any>> }>({});
  const [ddCount, setDdCount] = useState(0);
  const [savingDDById, setSavingDDById] = useState<Record<string, boolean>>({});

  const fetchEnvironments = useCallback(async () => {
    try {
      const list = await axios.post(`${URL_API_ALB}getDynamicDataHeaders`, {});
      setDynamicDataHeaders(list?.data || []);
    } catch {
      setDynamicDataHeaders([]);
    }
  }, []);

  useEffect(() => {
    fetchEnvironments();
  }, [fetchEnvironments]);

  useEffect(() => {
    const loadDD = async () => {
      if (!selectedDynamicDataId) {
        setTestData({});
        setDdCount(0);
        return;
      }
      try {
        const res = await axios.post(`${URL_API_ALB}dynamicData`, { id: selectedDynamicDataId });
        const arr = res?.data?.dynamicData;
        if (!Array.isArray(arr)) {
          toast.error("Dynamic data invalid.");
          setTestData({});
          setDdCount(0);
          return;
        }
        const byId: Record<string, Record<string, any>> = {};
        for (const it of arr) {
          if (it?.id && it?.input && typeof it.input === "object") {
            byId[String(it.id)] = it.input;
          }
        }
        setTestData({ data: byId });
        setDdCount(Object.keys(byId).length);
        toast.success(`Dynamic Data loaded (${Object.keys(byId).length} inputs).`);
      } catch (e: any) {
        toast.error(e?.response?.data?.message || "Can't load Dynamic Data.");
        setTestData({});
        setDdCount(0);
      }
    };
    loadDD();
  }, [selectedDynamicDataId]);

  const handleSaveDynamicData = useCallback(
    async (testId: string, test?: TestHeaderLite) => {
      if (!selectedDynamicDataId) {
        toast.error("Select a Dynamic Data set first.");
        return;
      }

      try {
        setSavingDDById(prev => ({ ...prev, [testId]: true }));

        const getRes = await axios.post(`${URL_API_ALB}dynamicData`, { id: selectedDynamicDataId });
        const current = getRes?.data;

        const ddHeader = {
          id: current?.id ?? selectedDynamicDataId,
          groupName: current?.groupName ?? undefined,
          name: current?.name ?? undefined,
          description: current?.description ?? undefined,
          tagIds: current?.tagIds ?? [],
          tagNames: current?.tagNames ?? [],
          dynamicData: Array.isArray(current?.dynamicData) ? current.dynamicData.slice() : [],
          updatedBy: current?.createdByName ?? "jpaz",
        };

        const latestInput = dataBufById?.[testId] ? { ...dataBufById[testId] } : {};

        const idx = ddHeader.dynamicData.findIndex((it: any) => String(it?.id) === String(testId));
        if (idx >= 0) {
          ddHeader.dynamicData[idx] = {
            ...ddHeader.dynamicData[idx],
            id: testId,
            input: latestInput,
            testCaseName: ddHeader.dynamicData[idx]?.testCaseName ?? test?.name ?? undefined,
            createdBy: ddHeader.dynamicData[idx]?.createdBy ?? "jpaz",
          };
        } else {
          ddHeader.dynamicData.push({
            id: testId,
            input: latestInput,
            order: ddHeader.dynamicData.length,
            testCaseName: test?.name ?? "",
            createdBy: ddHeader?.updatedBy ?? "jpaz",
          });
        }

        await axios.patch(`${URL_API_ALB}dynamicData`, ddHeader);
        toast.success("Dynamic Data guardado.");

        try {
          const res = await axios.post(`${URL_API_ALB}dynamicData`, { id: selectedDynamicDataId });
          const arr = res?.data?.dynamicData;
          const byId: Record<string, Record<string, any>> = {};
          if (Array.isArray(arr)) {
            for (const it of arr) {
              if (it?.id && it?.input && typeof it.input === "object") {
                byId[String(it.id)] = it.input;
              }
            }
          }
          setTestData({ data: byId });
          setDdCount(Object.keys(byId).length);

          setDataBufById(prev => ({ ...prev, [testId]: latestInput }));
        } catch {
          toast.error("Cant refresh Dynamic Data after save.");
        }
      } catch (e: any) {
        toast.error(e?.response?.data?.message || "Can't save Dynamic Data.");
      } finally {
        setSavingDDById(prev => ({ ...prev, [testId]: false }));
      }
    },
    [selectedDynamicDataId, dataBufById, setDataBufById]
  );

  return {
    dynamicDataHeaders,
    selectedDynamicDataId,
    setSelectedDynamicDataId,
    testData,
    ddCount,

    handleSaveDynamicData,
    savingDDById,
  };
}
