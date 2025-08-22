import { URL_API_ALB } from "@/config";

const defaultVPNTimeout = 20000;


export async function checkConnection(): Promise<void> {
    const controller = new AbortController();
    const healthPromise = new Promise((resolve, reject) => {
        const checkHealth = async () => {
            try {
                const response = await fetch(`${URL_API_ALB}health`, {
                    method: 'GET',
                    signal: controller.signal,
                    mode: 'cors',
                })
                if (response.ok) {
                    resolve({ success: 'ok' });
                } else {
                    reject({ error: `Health check failed with status ${response.status}` });
                }
            } catch (error: any) {
                reject({ error: `${error.message?.toString() || 'Health check failed'} Make sure to connect to the VPN` });
            }
        };
        checkHealth();
    });
    const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => {
            controller.abort();
            reject({ error: 'Timeout connecting to lambda endpoint, make sure to connect to the VPN' });
        }, defaultVPNTimeout)
    );
    try {
        await Promise.race([healthPromise, timeoutPromise]);
    } catch (error: any) {
        throw new Error(`Could not download test from ${URL_API_ALB}, error: ${error.error || error.message}`);
    }
}

export async function updateTest(id: string, stepsData: any[] = [], updatedBy: string = "Default User", deleteS3Images: boolean = false, temp: boolean = false): Promise<any> {
    await checkConnection();
    const stepBlocks: { update: {} | string; stepsData: any[]; }[] = [];
    stepsData.forEach(
        (stepData: any): void => {
            if (typeof stepData === 'string' || stepData instanceof String) {
                stepBlocks.push({ update: stepData, stepsData: [] });
            } else {
                if (
                    stepBlocks.length === 0
                    || typeof stepBlocks[stepBlocks.length - 1].update === 'string'
                    || stepBlocks[stepBlocks.length - 1].update instanceof String
                ) {
                    stepBlocks.push({ update: {}, stepsData: [] });
                }
                stepBlocks[stepBlocks.length - 1].stepsData!.push(stepData);
            }
        }
    );

    console.log(" stepBlocks:", stepBlocks);
    
    const updateTestResponse = await fetch(`${URL_API_ALB}tests`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        mode: 'cors',
        body: JSON.stringify({
            id,
            stepsData: stepBlocks.map(
                (stepBlock: { update: {} | string; stepsData: any[]; }): {} | string => stepBlock.update
            ),
            updatedBy,
            deleteS3Images,
            temp
        }),
    });
    const updatedTest = await updateTestResponse.json();
    if (!updateTestResponse.ok || !updatedTest || !updatedTest[0]?.id || !updatedTest[0]?.stepsIds || !Array.isArray(updatedTest[0]?.stepsIds)) {
        throw new Error(`Error updating test with ID ${id}`);
    }
    const updatedStepsData: any[][] = await Promise.all(stepBlocks.map(
        ({ stepsData }: { update: {} | string; stepsData: any[]; }, blockIndex: number): Promise<any[]> => Promise.all(stepsData.map(
            async (stepData: any, index: number): Promise<any> => {
                const payload = JSON.stringify({
                        id: stepsData[blockIndex].stepsId,
                        index: (index + blockIndex).toString().padStart(8, "0"),
                        stepData,
                        deleteS3Images,
                        temp,
                        testCaseId: updatedTest[0].id,
                    })

                console.log("Updating step block with payload:", payload);
                
                // const updateStepResponse = await fetch(`${URL_API_ALB}addTestStep`, {
                //     method: 'PATCH',
                //     headers: {
                //         'Content-Type': 'application/json',
                //     },
                    
                //     mode: 'cors',
                //     body: ,
                // });
                // const updatedStep = await updateStepResponse.json();
                // if (!updateStepResponse.ok || !updatedStep || !updatedStep.id) {
                //     throw new Error(`Error updating step block with ID ${stepData.stepsIds[blockIndex]} and step index ${index}`);
                // }
                // return updatedStep;
            }
        ))
    ));
    // return { ...updatedTest, stepsData: updatedStepsData };
}
