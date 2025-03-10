import { Request, Response } from "express";
import { TestData } from "../interfaces";
import { Browser, BrowserContext, chromium, webkit } from "playwright";
import { BrowserService } from "../services/BrowserService";
import { EventService } from "../services/EventService";
import { TestExecutor } from "../services/TestExecutor";
import { SSEResponseService } from "../services/SSEResponseService";
import { SSEHelper } from "../helpers/SSEHelper";

const sessions = new Map<string, Response>();

export class TestController {
    private browserService: BrowserService;

    constructor() {
        this.browserService = new BrowserService();
        this.executeTest = this.executeTest.bind(this);
    }

    public async executeTest(req: Request, res: Response): Promise<void> {
        const { isHeadless = true, testData, dataScenario }: TestData = req.body;
        const sessionId = Date.now().toString();
        sessions.set(sessionId, res);

        const sseResponseService = new SSEResponseService(res);
        const eventService = new EventService(sseResponseService);

        let browser: Browser | null = null;
        let browserContext: BrowserContext | null = null;

        try {
            const { browserInstance, context, page } = await this.initializeTest(isHeadless, dataScenario, eventService);
            browser = browserInstance;
            browserContext = context;

            const lastIndexStep = await this.runTest(page, dataScenario, testData, eventService);

            await this.finalizeTest(browser, browserContext, lastIndexStep, eventService);
        } catch (error:any) {
            console.error("❌ Error during test execution:", error);
            SSEHelper.sendTestFailed(eventService, error.message);
        } finally {
            await this.cleanUp(browser, browserContext, sseResponseService, sessionId);
        }
    }

    public async initializeTest(isHeadless: boolean, dataScenario: any, eventService: EventService) {
        SSEHelper.sendBrowserStart(eventService, isHeadless);

        const startTime = performance.now();
        const browser = isHeadless ? await webkit.launch({headless:isHeadless}) : await chromium.launch({headless:isHeadless});
        const context = await browser.newContext({
            permissions: ["geolocation", "notifications"], // 🔥 Eliminamos `clipboard-write`
        });
        const page = await context.newPage();        
        await this.browserService.navigateToUrl(page, dataScenario.contextGeneral.data.url);

        const endTime = performance.now();
        const executionTime = (endTime - startTime).toFixed(2);
        SSEHelper.sendBrowserStarted(eventService, isHeadless, executionTime);

        return { browserInstance: browser, context, page };
    }

    public async runTest(page: any, dataScenario: any, testData: any, eventService: EventService): Promise<number> {
        const testExecutor = new TestExecutor(eventService);
        return await testExecutor.executeTest(page, dataScenario, testData);
    }

    public async finalizeTest(browser: Browser, context: BrowserContext, lastIndexStep: number, eventService: EventService) {
        const startTime = performance.now();
        await context.close();
        await browser.close();
        const endTime = performance.now();
        const executionTime = (endTime - startTime).toFixed(2);
        SSEHelper.sendBrowserClosed(eventService, lastIndexStep, executionTime);
    }

    public async cleanUp(
        browser: Browser | null,
        context: BrowserContext | null,
        sseResponseService: SSEResponseService,
        sessionId: string
    ) {
        try {
            if (context) await context.close();
            if (browser) await browser.close();
        } catch (closeError) {
            console.warn("⚠️ Failed to close the browser:", closeError);
        }

        sseResponseService.endConnection();
        sessions.delete(sessionId);
    }
}
