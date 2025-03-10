import { EventService } from '../services/EventService';

export function sendEventDecorator(eventService: EventService, eventData: any) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;

        descriptor.value = async function (...args: any[]) {
            eventService.sendEvent({
                ...eventData,
                status: 'processing'
            });

            try {
                const result = await originalMethod.apply(this, args);

                eventService.sendEvent({
                    ...eventData,
                    status: 'completed'
                });

                return result;
            } catch (error) {
                eventService.sendEvent({
                    ...eventData,
                    status: 'failed',
                    error: (error as Error).message
                });
                throw error;
            }
        };

        return descriptor;
    };
}