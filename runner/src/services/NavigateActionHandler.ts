import { Page } from 'playwright';
import { ActionHandler } from '../interfaces';
import { logMethod } from '../decorators/logMethod';

export class NavigateActionHandler implements ActionHandler {
    @logMethod
    async handle(page: Page, stepData: any, sendEvent: (data: any) => void): Promise<void> {
        if (stepData.url) {
            await page.goto(stepData.url, { timeout: 50000 });
            sendEvent({
                indexStep: stepData.indexStep,
                description: `Navegando a ${stepData.url}`,
                status: 'completed',
                result: 'Navegación exitosa'
            });
        }
    }
}