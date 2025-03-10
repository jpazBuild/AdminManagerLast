import { Logger } from "pino";

const logger: Logger = require("pino")();

export function logMethod(target: any, propertyKey: string, descriptor: PropertyDescriptor): PropertyDescriptor {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
        logger.info({ method: propertyKey, args }, `Calling ${propertyKey} with arguments`);
        try {
            const result = await originalMethod.apply(this, args);
            logger.info({ method: propertyKey }, `Method ${propertyKey} executed successfully`);
            return result;
        } catch (error) {
            logger.error({ method: propertyKey, error }, `Error in ${propertyKey}`);
            throw error;
        }
    };

    return descriptor;
}
