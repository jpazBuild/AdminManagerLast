import { Page } from 'playwright';
import { ActionHandler } from '../interfaces';
import { logMethod } from '../decorators/logMethod';
import { performAction } from '../performAction';

export class ChangeActionHandler implements ActionHandler {
    @logMethod
    async handle(page: Page, stepData: any, sendEvent: (data: any) => void): Promise<void> {
        const responseTest = await performAction(page, stepData, 'change', sendEvent);
        if (responseTest.stopTest) {
            throw new Error('Test stopped due to error');
        }
    }
}