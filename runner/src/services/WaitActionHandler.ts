import { Page } from 'playwright';
import { ActionHandler } from '../interfaces';
import { logMethod } from '../decorators/logMethod';

export class WaitActionHandler implements ActionHandler {
    @logMethod
    async handle(page: Page, stepData: any, sendEvent: (data: any) => void): Promise<void> {
        const waitTime = stepData.value;

        if (typeof waitTime !== 'number' || waitTime <= 0) {
            throw new Error(`Invalid wait time: ${waitTime}`);
        }

        const startTime = performance.now();

        await page.waitForTimeout(waitTime);

        const endTime = performance.now();
        const executionTime = (endTime - startTime).toFixed(2);

        sendEvent({
            indexStep: stepData.indexStep,
            action: `Waited for ${waitTime} ms`,
            description: `Expected wait: ${waitTime} ms, Actual wait: ${executionTime} ms`,
            time:`${executionTime}`,
            status: 'completed',
            actualExecutionTime: `${executionTime} ms`,
            error: null
        });
    }
}
