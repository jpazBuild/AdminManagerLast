import { Browser, Page } from 'playwright';
import { ActionHandler } from '../interfaces';
import { NavigateActionHandler } from './NavigateActionHandler';
import { ClickActionHandler } from './ClickActionHandler';
import { ChangeActionHandler } from './ChangeActionHandler';
import { logMethod } from '../decorators/logMethod';
import { EventService } from './EventService';
import { ChangeWithEnterActionHandler } from './ChangeWithEnterActionHandler';
import { OtpActionHandler } from './OtpActionHandler';
import { WaitActionHandler } from './WaitActionHandler';
import { AssertActionHandler } from './AssertActionHandler';

export class TestExecutor {
    private actionHandlers: Record<string, ActionHandler> = {
        navigate: new NavigateActionHandler(),
        click: new ClickActionHandler(),
        change: new ChangeActionHandler(),
        changeWithEnter:new ChangeWithEnterActionHandler(),
        OTP:new OtpActionHandler(),
        wait: new WaitActionHandler(),
        assert:new AssertActionHandler()
    };

    constructor(private eventService: EventService) {}

    @logMethod
    async executeTest(page: Page, dataScenario: any, testData: any): Promise<number> {
        return dataScenario.jsonSteps.reduce(async (prevIndexStepPromise: any, step: any) => {
            const lastIndexStep = await prevIndexStepPromise;
            const handler = this.actionHandlers[step.action];
            await page.waitForLoadState('domcontentloaded',{timeout:50000})
            await page.waitForLoadState('networkidle',{timeout:50000})
            if (!handler) {
                this.eventService.sendEvent({
                    indexStep: step.indexStep,
                    action:`Acción no reconocida: ${step.action}`,
                    description: `Acción no reconocida: ${step.action}`,
                    status: 'failed',
                    error: 'Acción no implementada'
                });
                return lastIndexStep;
            }

            const updatedStep = this.replaceStepValues(step, testData);
            const startTime = performance.now();

            try {
                if (step.action === "OTP") {
                    await handler.handle(page, updatedStep,testData, this.eventService.sendEvent.bind(this.eventService));
                } else {
                    await handler.handle(page, updatedStep, this.eventService.sendEvent.bind(this.eventService));
                }
                return updatedStep.indexStep;
            } catch (error) {
                const endTime = performance.now();
                const executionTime = (endTime - startTime).toFixed(2);
                await this.handleError(page, updatedStep,executionTime, error as Error);
                return updatedStep.indexStep;
            }
        }, Promise.resolve(0));
    }

    private async handleError(page: Page, step: any,time:string, error: Error): Promise<void> {
        const screenshot = await page.screenshot({ fullPage: true });
        const base64Screenshot = screenshot.toString('base64');
        this.eventService.sendEvent({
            indexStep: step.indexStep,
            action:`Executed action: ${step.action}`,
            time,
            description: `Executed action: ${step.action}`,
            status: 'failed',
            screenshot: base64Screenshot,
            error: error.message
        });
    }

    private replacePlaceholders(value: string | undefined, testData: Record<string, any>): string | undefined {
        if (!value) return value;
        return value.replace(/<([^>]+)>/g, (_, key) => testData[key] ?? value);
    }
    
    private getDynamicFields = (jsonTest: any) => {
        const valueAsString = typeof jsonTest === "string" ? jsonTest : JSON.stringify(jsonTest);
        const matchFields = valueAsString.match(/<([^>]+)>/g)?.map(t => t.replace(/[<>]/g, '')) || [];
        return matchFields;
    };


    private replaceStepValues(step: any, testData: any): any {
        const valuesToReplace = this.getDynamicFields(step)
        return {
            ...step,
            data: {
                ...step.data,
                attributes: {
                    ...step.data?.attributes,
                    value: this.replacePlaceholders(step.data?.attributes?.value, testData)
                }
            }
        };
    }
}