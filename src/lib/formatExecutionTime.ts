export const formatExecutionTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return minutes > 0
        ? `${minutes} min ${seconds} sec`
        : `${seconds} sec`;
};