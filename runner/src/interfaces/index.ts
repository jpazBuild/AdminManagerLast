import { Page, Browser } from 'playwright';
import { Request, Response } from 'express';

export interface TestStep {
    action: 'navigate' | 'click' | 'change';
    context: {
        url: string;
    };
    data?: any;
}

export interface LogEntry {
    indexStep: number;
    action: string;
    screenshot: string;
    status: string;
}

export interface ActionHandler {
    handle(page: Page, stepData: any, sendEvent: (data: any) => void,testData?:any): Promise<void>;
}

export interface TestData {
    isHeadless?: boolean;
    testData: any;
    dataScenario: any;
}

export interface EventData {
    indexStep: number;
    action:string;
    description: string;
    status: string;
    time?:string;
    screenshot?:string;
    metadata?: any;
    error?: string;
}

export interface BrowserService {
    launchBrowser(isHeadless: boolean): Promise<Browser>;
    navigateToUrl(page: Page, url: string): Promise<void>;
}

export interface EventService {
    sendEvent(data: EventData): void;
}