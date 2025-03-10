import { Page } from 'playwright';
import { logMethod } from '../decorators/logMethod';
import { PerformActionOTP } from '../OtpActionPerformer';
import { ActionHandler } from '../interfaces';

export class OtpActionHandler implements ActionHandler {
    private performActionOTP: PerformActionOTP;

    constructor() {
        this.performActionOTP = new PerformActionOTP();
    }

    @logMethod
    async handle(page: Page, stepData: any, testData: any, sendEvent: (data: any) => void): Promise<void> {
        const responseTest = await this.performActionOTP.execute(page, stepData, testData, sendEvent);
        if (responseTest.stopTest) {
            throw new Error('Test stopped due to OTP retrieval error');
        }
    }
}
