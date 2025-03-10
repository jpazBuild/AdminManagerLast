import { Page } from "playwright";

interface LogEntry {
    indexStep: number;
    action: string;
    screenshot: string;
    status: string;
    description?: string;
    time?: string;
}

export const performAssertAction = async (
    page: Page,
    stepData: any,
    sendEvent: (data: LogEntry) => void
) => {
    const startTime = performance.now();
    const selectors = stepData?.data?.selectors || [];
    const typeAssert = stepData?.typeAssert;
    const valueToAssert = stepData?.valueToAssert;
    let elementFound = false;
    let stopTest = false;
    const logEntry: LogEntry = {
        indexStep: 0,
        action: "a",
        status: "",
        screenshot: ""
    };
    logEntry.status = "processing"
    logEntry.indexStep = stepData.indexStep
    logEntry.action = `Assert ${typeAssert} with value: ${valueToAssert}`
    await sendEvent(logEntry);
    await page.waitForLoadState('domcontentloaded',{timeout:80000})
    await page.waitForLoadState('networkidle',{timeout:80000})
    await page.waitForLoadState('load',{timeout:80000})
    
    for (let i = 0; i < selectors.length; i++) {
        const { type, locator } = selectors[i];
        let playwrightLocator: string;
        let timeout = i === 0 ? 70000 :15000;
        
        try {
            switch (type) {
                case "xpath":
                    playwrightLocator = `xpath=${locator}`;
                    break;
                case "id":
                case "class":
                case "tag-attributes":
                    playwrightLocator = locator;
                    break;
                default:
                    console.warn(`Unknown selector type: ${type}`);
                    continue;
            }
            await page.waitForLoadState('domcontentloaded')
            const locatorInstance = page.locator(playwrightLocator).first();
            await locatorInstance.waitFor({ state: "visible", timeout });

            elementFound = true;

            switch (typeAssert) {
                case "Equals": {
                    const text = await locatorInstance.textContent();
                    if (!text) throw new Error(`No text found for selector: ${locator}`);

                    if (text.trim() !== valueToAssert) {
                        throw new Error(`Expected '${valueToAssert}' but found '${text.trim()}'`);
                    }
                    break;
                }
                case "Contains": {
                    const text = await locatorInstance.textContent();
                    if (!text) throw new Error(`No text found for selector: ${locator}`);

                    if (!text.trim().includes(valueToAssert)) {
                        throw new Error(`Text '${text.trim()}' does not contain '${valueToAssert}'`);
                    }
                    break;
                }
                case "IsVisible": {
                    if (!(await locatorInstance.isVisible())) {
                        throw new Error(`Element is not visible`);
                    }
                    break;
                }
                case "IsEnabled": {
                    if (!(await locatorInstance.isEnabled())) {
                        throw new Error(`Element is not enabled`);
                    }
                    break;
                }
                case "IsClickable": {
                    const isClickable = await locatorInstance.isEnabled() && await locatorInstance.isVisible();
                    if (!isClickable) throw new Error(`Element is not clickable`);
                    break;
                }
                default:
                    throw new Error(`Unknown assertion type: ${typeAssert}`);
            }

            const screenshot = await page.screenshot({ fullPage: true });
            const endTime = performance.now();
            const executionTime = (endTime - startTime).toFixed(2);

            sendEvent({
                indexStep: stepData.indexStep,
                action: `Assert ${typeAssert} with value: ${valueToAssert} on locator: ${locator}`,
                description: `Validation passed for ${typeAssert}`,
                status: "completed",
                screenshot: screenshot.toString("base64"),
                time: executionTime
            });

            break;

        } catch (error) {
            console.warn(`Assertion failed for selector: ${locator}. Error: ${(error as Error).message}`);

            const screenshot = await page.screenshot({ fullPage: true });
            const endTime = performance.now();
            const executionTime = (endTime - startTime).toFixed(2);

            sendEvent({
                indexStep: stepData.indexStep,
                action: `Assert ${typeAssert} failed on locator: ${locator}`,
                description: (error as Error).message,
                status: "failed",
                screenshot: screenshot.toString("base64"),
                time: executionTime
            });
        }
    }

    if (!elementFound) {
        console.warn(`Element could not be found using provided selectors for assert action.`);

        const screenshot = await page.screenshot({ fullPage: true });
        const endTime = performance.now();
        const executionTime = (endTime - startTime).toFixed(2);

        sendEvent({
            indexStep: stepData.indexStep,
            action: `Assert ${typeAssert} failed`,
            description: `Element not found or not enabled.`,
            status: "failed",
            screenshot: screenshot.toString("base64"),
            time: executionTime
        });
        stopTest = true;
        throw new Error(`Element could not be found using any of the provided selectors for assert action.`);
    }
    return { stopTest };
};