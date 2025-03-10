import { Page } from 'playwright';
import { ActionHandler } from '../interfaces';
import { logMethod } from '../decorators/logMethod';
import { performAssertAction } from '../performAssertAction';

export class AssertActionHandler implements ActionHandler {
    @logMethod
    async handle(page: Page, stepData: any, sendEvent: (data: any) => void): Promise<void> {
        const responseTest = await performAssertAction(page, stepData, sendEvent);
        if (responseTest.stopTest) {
            throw new Error('Test stopped due to error');
        }
    }
}