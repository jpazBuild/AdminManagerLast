import { EventData } from '../interfaces';
import { SSEResponseService } from './SSEResponseService';

export class EventService {
    constructor(private sseResponseService: SSEResponseService) {}

    public sendEvent(data: EventData): void {
        this.sseResponseService.sendEvent(data);
    }
    public sendBrowserCloseEvent(indexStep: number): void {
        this.sendEvent({
            indexStep,
            action:'Closing browser',
            description: 'Closing browser',
            status: 'completed'
        });
    }
}