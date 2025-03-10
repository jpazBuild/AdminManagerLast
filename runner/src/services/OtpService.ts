import { headersAutomation } from '../headers';
import axios from 'axios';

export class OtpService {
    async getOtpCode(username: string, now: Date): Promise<string> {
        const sources = ['EMAIL', 'PHONE'];
        const maxRetries = 6; // 🔄 6 intentos (3 por cada tipo)

        const nowPlusFiveHours = new Date(now.getTime());
        const formattedTime = nowPlusFiveHours.toISOString();

        let attempt = 0;

        return new Promise((resolve) => {
            const tryFetching = async () => {
                if (attempt >= maxRetries) {
                    console.warn("❌ No se recibió un código OTP válido después de varios intentos.");
                    return resolve("There is no code");
                }

                const type = sources[attempt % sources.length]; // Alternar entre EMAIL y PHONE
                try {
                    const otpData = await this.fetchOtp(username, type);
                    if (this.isValidOtp(otpData.code, otpData.createdAt, formattedTime)) {
                        return resolve(otpData.code);
                    } else {
                        console.warn(`⚠️ Código OTP inválido o expirado (${type}). Reintentando en 4 segundos...`);
                        attempt++;
                        setTimeout(tryFetching, 1000); // Espera 4s antes de intentar nuevamente
                    }
                } catch (error) {
                    console.error(`❌ Error obteniendo OTP (${type}):`, error);
                    attempt++;
                    setTimeout(tryFetching, 1000);
                }
            };

            tryFetching();
        });
    }

    private async fetchOtp(username: string, type: string): Promise<{ code: string; createdAt: string }> {
        try {
            const response = await axios.post(
                process.env.service_automation_api || '',
                {
                    query: `query Query($input:getOTPByUsernameAutomationInput!) {
                        getOTPByUsernameAutomation(input: $input) {
                            code
                            createdAt
                        }
                    }`,
                    variables: { input: { profile: 'PERSONAL', type, username } }
                },
                { headers: headersAutomation }
            );

            const otpData = response.data?.data?.getOTPByUsernameAutomation || {};
            return { code: otpData.code || "There is no code", createdAt: otpData.createdAt || "" };
        } catch (error) {
            console.error(`❌ Error obteniendo OTP (${type}):`, error);
            return { code: "There is no code", createdAt: "" };
        }
    }

    private isValidOtp(code: string, createdAt: string, now: string): boolean {
        if (!code || code === "There is no code" || !createdAt) return false;

        const createdAtDate = new Date(createdAt).getTime();
        const nowDate = new Date(now).getTime();
        const timeDiff = Math.abs((createdAtDate - nowDate) / 1000);
        return timeDiff <= 15;
    }
}
