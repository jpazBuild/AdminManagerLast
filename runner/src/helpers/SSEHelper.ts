import { EventService } from '../services/EventService';

export class SSEHelper {
    static sendEvent(eventService: EventService,action:string, description: string, status: 'processing' | 'completed' | 'failed', indexStep: number = 0, metadata: any = {},time?:string, error: string = '') {
        eventService.sendEvent({
            indexStep,
            action,
            description,
            status,
            time,
            metadata,
            ...(error && { error })
        });
    }

    static sendBrowserStart(eventService: EventService, isHeadless: boolean) {
        this.sendEvent(eventService,'Starting browser', 'Starting browser', 'processing', 0, { isHeadless });
    }

    static sendBrowserStarted(eventService: EventService, isHeadless: boolean,time:any) {
        this.sendEvent(eventService,'Starting browser', 'Starting browser', 'completed', 0, { isHeadless },time);
    }

    static sendTestCompleted(eventService: EventService, lastIndexStep: number) {
        this.sendEvent(eventService,'Test execution completed', 'Test execution completed', 'completed', lastIndexStep + 1);
    }

    static sendTestFailed(eventService: EventService, error: string) {
        this.sendEvent(eventService,'Test execution failed', 'Test execution failed', 'failed', -1, {}, error);
    }

    static sendBrowserClosed(eventService: EventService, lastIndexStep: number,time:any) {
        this.sendEvent(eventService,'Closing browser', 'Closing browser', 'completed', lastIndexStep + 1,"",time);
    }
}