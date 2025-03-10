import { Page } from 'playwright';
import { OtpService } from './services/OtpService';

interface LogEntry {
    indexStep: number;
    time: string;
    action: string;
    screenshot?: string;
    status: string;
}

export class PerformActionOTP {
    private otpService: OtpService;

    constructor() {
        this.otpService = new OtpService();
    }

    async execute(page: Page, stepData: any, testData: any, sendEvent: any): Promise<{ stopTest: boolean }> {
        return new Promise(async (resolve) => {
            const startTime = performance.now();
            const selectors = stepData?.data?.selectors || [];
            const timeout = 70000;
            const username = testData.UsernameInput;
            const { selectorOtpChoose, locatorSelect } = this.extractSelectors(selectors);

            if (!selectorOtpChoose) return resolve({ stopTest: true });

            const logEntry: LogEntry = {
                indexStep: stepData.indexStep,
                action: "Entered OTP code",
                status: "processing",
                time: "0",
            };
            await sendEvent(logEntry);
            await page.waitForLoadState('networkidle',{timeout:50000})
            await page.waitForLoadState('domcontentloaded',{timeout:50000});
            await page.waitForLoadState('load',{timeout:50000});

            try {
                const selector = selectorOtpChoose.startsWith('#') ? selectorOtpChoose : `#${selectorOtpChoose}`;
                await page.waitForSelector(selector, { timeout, state: 'visible' });
                await page.getByTestId(selectorOtpChoose).click({ timeout, force: true });
                const now = new Date();
                let attempts = 0;
                const maxAttempts = 3;
                let otpAccepted = false;

                do {
                    const otpCode = await this.otpService.getOtpCode(username, now);
                    if (otpCode !== "There is no code") {
                        otpAccepted = true;
                        return resolve(await this.enterOtpCode(page, stepData, sendEvent, otpCode, locatorSelect, startTime));
                    }
    
                    console.warn("⚠️ Código incorrecto, reintentando en 4 segundos...");
                    attempts++;
                } while (attempts < maxAttempts && !otpAccepted);

            } catch (error) {
                console.error("❌ Error en PerformActionOTP:", error);
                const endTime = performance.now();
                const executionTime = (endTime - startTime).toFixed(2);
                return resolve(await this.handleError(page, stepData, sendEvent, executionTime));

            }
        });
    }

    private extractSelectors(selectors: any[]): { selectorOtpChoose: string; locatorSelect: string } {
        for (const { type, locator } of selectors) {
            if (type === "id") {
                return {
                    selectorOtpChoose: locator.replace("#", ""),
                    locatorSelect: locator.replace("0", "").replace("#", "")
                };
            }
        }
        return { selectorOtpChoose: "", locatorSelect: "" };
    }

    private async enterOtpCode(
        page: Page,
        stepData: any,
        sendEvent: any,
        otpCode: string,
        locatorSelect: string,
        startTime: any
    ): Promise<{ stopTest: boolean }> {
        const otpSplit = otpCode.split('');
        const otpFields = otpSplit.map((_, index) => `${locatorSelect}${index}`);

        for (let i = 0; i < otpSplit.length; i++) {
            try {
                await page.getByTestId(otpFields[i]).fill(otpSplit[i], { timeout: 35000, force: true });
            } catch (error) {
                const endTime = performance.now();
                const executionTime = (endTime - startTime).toFixed(2);
                return await this.handleError(page, stepData, sendEvent, executionTime);
            }
        }
        const endTime = performance.now();
        const executionTime = (endTime - startTime).toFixed(2);

        await this.logSuccess(page, stepData, sendEvent, executionTime);
        return { stopTest: false };
    }

    private async handleError(page: Page, stepData: any, sendEvent: any, executeTime: any): Promise<{ stopTest: boolean }> {
        await sendEvent({
            indexStep: stepData.indexStep,
            action: "Failed to retrieve OTP",
            status: "failed",
            time: executeTime,
            screenshot: (await page.screenshot({ fullPage: true })).toString('base64')
        });
        return { stopTest: true };
    }

    private async logSuccess(page: Page, stepData: any, sendEvent: any, time: any) {
        const logEntry: LogEntry = {
            indexStep: stepData.indexStep,
            action: "Entered OTP code successfully",
            status: "completed",
            time,
            screenshot: (await page.screenshot({ fullPage: true })).toString('base64')
        };
        await sendEvent(logEntry);
    }
}