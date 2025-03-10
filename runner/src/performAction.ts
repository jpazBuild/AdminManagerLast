import { Page } from 'playwright';
import { EventService } from './services/EventService';

interface LogEntry {
    indexStep: number;
    action: string;
    screenshot: string;
    status: string;
    description?:string;
    time?:string;
}

export const performAction = async (
    page: Page,
    stepData: any,
    actionType: 'click' | 'change' | 'changeWithEnter',
    sendEvent: any
) => {
    const startTime = performance.now();
    const selectors = stepData?.data?.selectors || [];
    let value: string | undefined;
    let stopTest = false;
    const logEntry: LogEntry = {
        indexStep: 0,
        action: actionType,
        status: "",
        screenshot: ""
    };
    value = stepData?.data?.attributes?.value;
    let elementFound = false;
    let timeout: number;
    logEntry.status = "processing"
    logEntry.indexStep = stepData.indexStep
    logEntry.action = `Clicked in the element ${selectors[0].locator}`
    await sendEvent(logEntry);
    await page.waitForLoadState('domcontentloaded',{timeout:80000})
    await page.waitForLoadState('networkidle',{timeout:80000})
    await page.waitForLoadState('load',{timeout:80000})


    for (let i = 0; i < selectors.length; i++) {
        const { type, locator } = await selectors[i];
        let playwrightLocator: string;
        timeout = i === 0 ? 80000 : 15000;
        try {
            switch (type) {
                case 'xpath':
                    playwrightLocator = `xpath=${locator}`;
                    break;
                case 'id':
                case 'class':
                case 'tag-attributes':
                    playwrightLocator = locator;
                    break;
                default:
                    continue;
            }
            let isEnabled = false;
            try {
                await page.locator(playwrightLocator).waitFor({ state: 'visible', timeout });
                isEnabled = true;
            } catch (error) {
                isEnabled = false;
            }

            if (isEnabled) {
                

                if (actionType === 'click') {
                    const screenshot = await page.screenshot({ fullPage: true });
                    const locator = page.locator(playwrightLocator);
                    // await locator.scrollIntoViewIfNeeded();
                    await locator.click({ timeout, force: true });
                    await page.waitForTimeout(4000)
                    const endTime = performance.now();
                    const executionTime = (endTime - startTime).toFixed(2);

                    logEntry.action = `Clicked on the element with locator: ${locator}`;
                    const base64Screenshot = screenshot.toString('base64');
                    logEntry.screenshot = base64Screenshot;
                    logEntry.status = "completed";
                    logEntry.time = executionTime;
                    logEntry.indexStep = stepData.indexStep;
                    await sendEvent(logEntry);
                } else if ((actionType === 'change' || actionType === 'changeWithEnter') && value !== undefined) {
                    logEntry.screenshot = (await page.screenshot({ fullPage: true })).toString('base64');
                    await page.locator(playwrightLocator).fill(value, { timeout, force: true });
                    if (actionType === 'changeWithEnter') {
                        await page.locator(playwrightLocator).press('Enter', { timeout });
                    }
                    const endTime = performance.now();
                    const executionTime = (endTime - startTime).toFixed(2);
                    logEntry.action = `Filled the field with locator: ${locator} with value: ${value}`;
                    logEntry.status = "completed";
                    logEntry.indexStep = stepData.indexStep;
                    logEntry.time = executionTime;
                    await sendEvent(logEntry);
                }

                elementFound = true;
                break;
            }
        } catch (error) {
            const endTime = performance.now();
            const executionTime = (endTime - startTime).toFixed(2);
            const screenshot = await page.screenshot({ fullPage: true });
            const base64Screenshot = screenshot.toString('base64');
            const logEntry: LogEntry = {
                indexStep: stepData.indexStep,
                action: `Error with selector ${locator}: ${(error as Error).message}`,
                status: "failed",
                screenshot: base64Screenshot,
                time:executionTime
            };
            sendEvent(logEntry);
        }
    }

    if (!elementFound) {
        const endTime = performance.now();
        const executionTime = (endTime - startTime).toFixed(2);
        const screenshot = await page.screenshot({ fullPage: true });
        const base64Screenshot = screenshot.toString('base64');
        const logEntry: LogEntry = {
            indexStep: stepData.indexStep,
            action: `Failed to perform ${actionType}. Element not found or not enabled.`,
            status: "failed",
            screenshot: base64Screenshot,
            time:executionTime
        };
        sendEvent(logEntry);
        stopTest = true;
    }

    return { stopTest };
};