export type EnvRow = {
    id: string;
    key: string;
    value: string;
    enabled: boolean;
    _orig: { key: string; value: string; enabled: boolean; type?: string };
    _type?: string;
};