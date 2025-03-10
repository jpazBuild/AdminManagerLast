import { Response } from 'express';

export class SSEResponseService {
    private res: Response;

    constructor(res: Response) {
        this.res = res;
        this.setupSSEHeaders();
    }

    private setupSSEHeaders(): void {
        this.res.setHeader('Content-Type', 'text/event-stream');
        this.res.setHeader('Cache-Control', 'no-cache');
        this.res.setHeader('Connection', 'keep-alive');
        this.res.flushHeaders();
    }

    public sendEvent(data: any): void {
        try {
            const message = `data: ${JSON.stringify(data)}\n\n`;
            this.res.write(message, 'utf8');
        } catch (error) {
            console.error('Error sending SSE event:', error);
        }
    }

    public endConnection(): void {
        this.res.end();
    }
}