import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { URL_API_ALB } from "@/config";
import { checkConnection } from "@/utils/DBBUtils";
import { toast } from "sonner";

export type Tag = {
    id: string;
    name: string;
};

type UseTagsResult = {
    tags: Tag[];
    isLoadingTags: boolean;
    error: string | null;
    refresh: () => Promise<void>;
};

const useTags = (): UseTagsResult => {
    const [tags, setTags] = useState<Tag[]>([]);
    const [isLoadingTags, setIsLoadingTags] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    const refresh = useCallback(async () => {
        setIsLoadingTags(true);
        setError(null);

        try {
            await checkConnection();

            const res = await axios.post(`${URL_API_ALB}tags`, {});

            if (res?.data?.error) {
                throw new Error(res.data.error);
            }

            const list = Array.isArray(res?.data) ? (res.data as Tag[]) : [];
            if (mountedRef.current) setTags(list);
        } catch (err: any) {
            const msg =
                err?.message ||
                "Error fetching tags";

            if (mountedRef.current) {
                setTags([]);
                setError(msg);
            }

            toast.error(msg);
        } finally {
            if (mountedRef.current) setIsLoadingTags(false);
        }
    }, []);

    useEffect(() => {
        void refresh();
    }, [refresh]);

    return { tags, isLoadingTags, error, refresh };
};

export default useTags;
