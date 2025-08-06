import { URL_API_ALB } from "@/config";

const defaultVPNTimeout = 20000;


export async function checkConnection(): Promise<void> {
    const controller = new AbortController();
    const healthPromise = new Promise((resolve, reject) => {
        const checkHealth = async () => {
            try {
                const response = await fetch(`${URL_API_ALB}health`, {
                    method: 'GET',
                    signal: controller.signal,
                    mode: 'cors',
                })
                if (response.ok) {
                    resolve({ success: 'ok' });
                } else {
                    reject({ error: `Health check failed with status ${response.status}` });
                }
            } catch (error: any) {
                reject({ error: `${error.message?.toString() || 'Health check failed'} Make sure to connect to the VPN` });
            }
        };
        checkHealth();
    });
    const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => {
            controller.abort();
            reject({ error: 'Timeout connecting to lambda endpoint, make sure to connect to the VPN' });
        }, defaultVPNTimeout)
    );
    try {
        await Promise.race([healthPromise, timeoutPromise]);
    } catch (error: any) {
        throw new Error(`Could not download test from ${URL_API_ALB}, error: ${error.error || error.message}`);
    }
}


