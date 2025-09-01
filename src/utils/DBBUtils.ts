import { URL_API_ALB,defaultVPNTimeout} from "@/config";

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

export async function getTest(id: string, flatReusableSteps = true): Promise<any> {
    await checkConnection();
    const testHeaderResponse = await fetch(`${URL_API_ALB}getTestHeaders`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        mode: 'cors',
        body: JSON.stringify({ id }),
    });
    const testHeader = await testHeaderResponse.json();
    if (!testHeaderResponse.ok || !testHeader || !testHeader[0]?.id) throw new Error(`Test case (online) with ID ${id} not found`);
    return {
        ...testHeader[0],
        stepsData: (await Promise.all(testHeader[0].stepsIds.map(
            async (stepId: string): Promise<any> => {
                let reusableStep = {};
                if (!flatReusableSteps) {
                    const stepHeaderResponse = await fetch(`${URL_API_ALB}/getReusableStepsHeaders`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        mode: 'cors',
                        body: JSON.stringify({ id: stepId, onlyReusables: true }),
                    });
                    const stepHeader = await stepHeaderResponse.json();
                    if (!stepHeaderResponse.ok || !stepHeader || !Array.isArray(stepHeader)) throw new Error(`Step header with ID ${stepId} not found`);
                    if (stepHeader.length > 0) reusableStep = stepHeader[0];
                }
                const stepIndexesResponse = await fetch(`${URL_API_ALB}/getTestSteps`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    mode: 'cors',
                    body: JSON.stringify({ id: stepId, getIndexOnly: true }),
                });
                const stepIndexes = (await stepIndexesResponse.json()).stepsData;
                if (!stepIndexesResponse.ok || !stepIndexes || !Array.isArray(stepIndexes)) throw new Error(`Step with ID ${stepId} not founzsd`);
                const stepsData = (await Promise.all(stepIndexes.map(
                    async (index: number): Promise<any> => {
                        const stepResponse = await fetch(`${URL_API_ALB}/getTestSteps`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            mode: 'cors',
                            body: JSON.stringify({ id: stepId, index, includeStepsData: true, includeImages: true, testCaseId: id }),
                        });
                        const step = (await stepResponse.json()).stepsData;
                        if (!stepResponse.ok || !step || !Array.isArray(step) || !step[0]?.action) throw new Error(`StepData with StepID ${stepId} and index ${index} not found`);
                        return step[0];
                    }
                )));
                return flatReusableSteps || Object.keys(reusableStep).length <= 3 ? stepsData : [{ ...reusableStep, stepsData }];
            }
        ))).flat().map((step: any, index: number): any => ({ ...step, indexStep: index + 1 })),
    };
}

export async function updateTest(id: string, stepsData: any[] = [], updatedBy: string = "Default User", deleteS3Images: boolean = false, temp: boolean = false): Promise<any> {
    await checkConnection();

    console.log("updateTest", { id, stepsData, updatedBy, deleteS3Images, temp });
    
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
    const updatedTest = (await updateTestResponse.json()).find((base: any): boolean => base.type === "TESTCASE");
    if (!updateTestResponse.ok || !updatedTest || !updatedTest.id || !updatedTest.stepsIds || !Array.isArray(updatedTest.stepsIds)) {
        throw new Error(`Error updating test with ID ${id}`);
    }
    return {
        ...updatedTest,
        stepsData: await Promise.all(stepBlocks.map(
            ({ stepsData }: { update: {} | string; stepsData: any[]; }, blockIndex: number): Promise<any[]> => Promise.all(stepsData.map(
                async (stepData: any, index: number): Promise<any> => {
                    const updateStepResponse = await fetch(`${URL_API_ALB}addTestStep`, {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        mode: 'cors',
                        body: JSON.stringify({
                            id: updatedTest.stepsIds[blockIndex],
                            index: (index + blockIndex).toString().padStart(8, "0"),
                            stepData,
                            deleteS3Images,
                            temp,
                            testCaseId: id,
                        }),
                    });
                    const updatedStep = await updateStepResponse.json();
                    if (!updateStepResponse.ok || !updatedStep || !updatedStep.id) {
                        throw new Error(`Error updating step block with ID ${updatedTest.stepsIds[blockIndex]} and step index ${index}`);
                    }
                    return updatedStep;
                }
            ))
        )),
    };
}

export async function getReusableSteps(id: string): Promise<any> {
    await checkConnection();
    const stepHeaderResponse = await fetch(`${URL_API_ALB}getReusableStepsHeaders`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        mode: 'cors',
        body: JSON.stringify({ id, onlyReusables: true }),
    });
    const stepHeader = await stepHeaderResponse.json();
    if (!stepHeaderResponse.ok || !stepHeader || !Array.isArray(stepHeader)) throw new Error(`Step header with ID ${id} not found`);
    const reusableStepsIndexesResponse = await fetch(`${URL_API_ALB}/reusableSteps`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        mode: 'cors',
        body: JSON.stringify({ id, getIndexOnly: true }),
    });
    const stepIndexes = (await reusableStepsIndexesResponse.json()).stepsData;
    if (!reusableStepsIndexesResponse.ok || !stepIndexes || !Array.isArray(stepIndexes)) throw new Error(`Reusable steps indexes with ID ${id} not found`);
    return {
        ...stepHeader[0],
        stepsData: (await Promise.all(stepIndexes.map(
            async (index: string): Promise<any> => {
                const stepResponse = await fetch(`${URL_API_ALB}/reusableSteps`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    mode: 'cors',
                    body: JSON.stringify({ id, index, includeStepsData: true, includeImages: true }),
                });
                const step = (await stepResponse.json()).stepsData;
                if (!stepResponse.ok || !step || !Array.isArray(step) || !step[0]?.action) throw new Error(`StepData with StepID ${id} and index ${index} not found`);
                return step[0];
            }
        ))).flat(),
    };
}

export async function updateReusableSteps(id: string, stepsData: any[] = [], updatedBy: string = "Default User", deleteS3Images: boolean = false, temp: boolean = false): Promise<any> {
    await checkConnection();
    if (stepsData.some((stepData: any): boolean => typeof stepData === "string" || stepData instanceof String)) {
        throw new Error("Invalid stepData");
    }
    const updateReusableStepsResponse = await fetch(`${URL_API_ALB}reusableSteps`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        mode: 'cors',
        body: JSON.stringify({
            id,
            stepsData: [{}],
            updatedBy,
            deleteS3Images,
            temp
        }),
    });
    const updatedReusableSteps = (await updateReusableStepsResponse.json()).filter((item: any) => item.type === "STEPS")?.[0];
    if (!updateReusableStepsResponse.ok || !updatedReusableSteps || !updatedReusableSteps.id) {
        throw new Error(`Error updating reusable steps with ID ${id}`);
    }
    return {
        ...updatedReusableSteps,
        stepsData: await Promise.all(stepsData.map(
            async (stepData: any, index: number): Promise<any> => {
                const updateStepResponse = await fetch(`${URL_API_ALB}addReusableStep`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    mode: 'cors',
                    body: JSON.stringify({
                        id,
                        index: index.toString().padStart(8, "0"),
                        stepData,
                        deleteS3Images,
                        temp,
                    }),
                });
                const updatedStep = await updateStepResponse.json();
                if (!updateStepResponse.ok || !updatedStep || !updatedStep.id) {
                    throw new Error(`Error updating reusable step with ID ${id} and index ${index}`);
                }
                return updatedStep;
            })
        ),
    };
}

export async function getApisScripts(id: string): Promise<any> {
    await checkConnection();
    const apisScriptsHeaderResponse = await fetch(`${URL_API_ALB}getApisScriptsHeaders`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        mode: 'cors',
        body: JSON.stringify({ id }),
    });
    const apisScriptsHeader = await apisScriptsHeaderResponse.json();
    if (!apisScriptsHeaderResponse.ok || !apisScriptsHeader || !apisScriptsHeader[0]?.id) throw new Error(`APIs Scripts with ID ${id} not found`);
    const apisScriptsIndexesResponse = await fetch(`${URL_API_ALB}getApisScriptsItems`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        mode: 'cors',
        body: JSON.stringify({ id, getIndexOnly: true }),
    });
    const apisScriptsIndexes = (await apisScriptsIndexesResponse.json()) ?? [];
    if (!apisScriptsIndexesResponse.ok || !apisScriptsIndexes) throw new Error(`apisScriptsIndexes with ID ${id} not found`);
    let env: any = undefined;
    if (apisScriptsHeader[0].envId) {
        const envResponse = await fetch(`${URL_API_ALB}/envs`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            mode: 'cors',
            body: JSON.stringify({ id: apisScriptsHeader[0].envId, onlyReusables: false }),
        });
        ({ env } = (await envResponse.json())[0] ?? {});
        if (!envResponse.ok || !env) throw new Error(`Environment with ID ${apisScriptsHeader[0].envId} not found`);
    }
    let collectionRest: any = undefined;
    if (apisScriptsHeader[0].collectionIds.length) {
        const collectionHeaderResponse = await fetch(`${URL_API_ALB}getCollectionHeaders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            mode: 'cors',
            body: JSON.stringify({ id: apisScriptsHeader[0].collectionIds[0], onlyReusables: false }),
        });
        ({ collectionRest } = (await collectionHeaderResponse.json())[0] ?? {});
        if (!collectionHeaderResponse.ok || !collectionRest) throw new Error(`Collection with ID ${apisScriptsHeader[0].collectionIds[0]} not found`);
    }
    return {
        ...apisScriptsHeader[0],
        [apisScriptsHeader[0].action === "runApis" ? "apis" : "scripts"]: (await Promise.all(apisScriptsIndexes.map(
            async (index: number): Promise<any> => {
                const apiScriptResponse = await fetch(`${URL_API_ALB}getApisScriptsItems`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    mode: 'cors',
                    body: JSON.stringify({ id, index }),
                });
                const apiScript = (await apiScriptResponse.json())[0];
                if (!apiScriptResponse.ok || !apiScript) throw new Error(`apisScriptsItem with ID ${id} and index ${index} not found`);
                return apiScript;
            }
        ))).flat(),
        ...(env !== undefined && { env }),
        [apisScriptsHeader[0].action === "runApis" ? "collection" : "scriptCollection"]: {
            ...collectionRest,
            item: (await Promise.all(apisScriptsHeader[0].collectionIds.map(
                async (collectionId: string): Promise<any> => {
                    const itemIndexesResponse = await fetch(`${URL_API_ALB}collections`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        mode: 'cors',
                        body: JSON.stringify({ id: collectionId, getIndexOnly: true }),
                    });
                    const itemIndexes = (await itemIndexesResponse.json()).item;
                    if (!itemIndexesResponse.ok || !itemIndexes || !Array.isArray(itemIndexes)) throw new Error(`Collection with ID ${collectionId} not found`);
                    return (await Promise.all(itemIndexes.map(
                        async (index: number): Promise<any> => {
                            const itemResponse = await fetch(`${URL_API_ALB}collections`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                mode: 'cors',
                                body: JSON.stringify({ id: collectionId, index }),
                            });
                            const item = (await itemResponse.json()).item;
                            if (!itemResponse.ok || !item || !Array.isArray(item)) throw new Error(`Collection with ID ${collectionId} and index ${index} not found`);
                            return item[0];
                        }
                    )));
                }
            ))).flat(),
        },
    };
}

export async function updateApisScripts(id: string, action: string, apis: any[], scripts: any[], collection: any, scriptCollection: any, updatedBy: string = "Default User", temp: boolean = false): Promise<any> {
    if (
        (!["runApis", "runScripts"].includes(action))
        || (action === "runApis" && ((!apis || scripts || scriptCollection) && (scripts || !collection || scriptCollection)))
        || (action === "runScripts" && ((!scripts || apis || collection) && (apis || !scriptCollection || collection)))
    ) {
        throw new Error("Invalid parameters");
    }
    await checkConnection();
    const { item = [], ...collectionRest } = collection ?? scriptCollection ?? {};
    const collectionBlocks: { update: {} | string; collectionItem: any[]; }[] = [];
    item.forEach(
        (collectionItem: any): void => {
            if (typeof collectionItem === 'string' || collectionItem instanceof String) {
                collectionBlocks.push({ update: collectionItem, collectionItem: [] });
            } else {
                if (
                    collectionBlocks.length === 0
                    || typeof collectionBlocks[collectionBlocks.length - 1].update === 'string'
                    || collectionBlocks[collectionBlocks.length - 1].update instanceof String
                ) {
                    collectionBlocks.push({ update: {}, collectionItem: [] });
                }
                collectionBlocks[collectionBlocks.length - 1].collectionItem!.push(collectionItem);
            }
        }
    );
    const updateApisScriptsResponse = await fetch(`${URL_API_ALB}apisScripts`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        mode: 'cors',
        body: JSON.stringify({
            id,
            action,
            ...((apis ?? scripts).length > 0 && {
                [action === "runApis" ? "apis" : "scripts"]: [],
            }),
            ...(collectionBlocks.length > 0 && {
                [action === "runApis" ? "collection" : "scriptCollection"]: {
                    ...collectionRest,
                    item: collectionBlocks.map(
                        (collectionBlock: { update: {} | string; collectionItem: any[]; }): {} | string => collectionBlock.update
                    ),
                },
            }),
            updatedBy,
            temp
        }),
    });
    const updatedApisScripts = (await updateApisScriptsResponse.json()).find((base: any): boolean => base.type === "APISSCRIPTS");
    if (!updateApisScriptsResponse.ok || !updatedApisScripts || !updatedApisScripts.id || !updatedApisScripts.collectionIds || !Array.isArray(updatedApisScripts.collectionIds)) {
        throw new Error(`APIs Scripts with ID ${id} not found`);
    }
    return {
        ...updatedApisScripts,
        [action === "runApis" ? "apis" : "scripts"]: await Promise.all((apis ?? scripts).map(
            async (apiScriptItem: any, index: number): Promise<any> => {
                const updateApiScriptResponse = await fetch(`${URL_API_ALB}addApiScriptItem`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    mode: 'cors',
                    body: JSON.stringify({
                        id,
                        index: index.toString().padStart(8, "0"),
                        apiScriptItem,
                        temp,
                    }),
                });
                const updatedApiScript = await updateApiScriptResponse.json();
                if (!updateApiScriptResponse.ok || !updatedApiScript || !updatedApiScript.id) {
                    throw new Error(`Error updating API script with ID ${id} and index ${index}`);
                }
                return updatedApiScript;
            }
        )),
        [action === "runApis" ? "collection" : "scriptCollection"]: {
            item: await Promise.all(collectionBlocks.map(
                ({ collectionItem }: { update: {} | string; collectionItem: any[]; }, blockIndex: number): Promise<any[]> => Promise.all(collectionItem.map(
                    async (collectionItem: any, index: number): Promise<any> => {
                        const updateCollectionItemResponse = await fetch(`${URL_API_ALB}addCollectionItem`, {
                            method: 'PATCH',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            mode: 'cors',
                            body: JSON.stringify({
                                id: updatedApisScripts.collectionIds[blockIndex],
                                index: (index + blockIndex).toString().padStart(8, "0"),
                                collectionItem,
                                temp,
                            }),
                        });
                        const updatedCollectionItem = await updateCollectionItemResponse.json();
                        if (!updateCollectionItemResponse.ok || !updatedCollectionItem || !updatedCollectionItem.id) {
                            throw new Error(`Error updating collection item with ID ${updatedApisScripts.collectionIds[blockIndex]} and item index ${index}`);
                        }
                        return updatedCollectionItem;
                    }
                ))
            )),
        },
    };
}

export async function getCollection(id: string): Promise<any> {
    await checkConnection();
    const collectionHeaderResponse = await fetch(`${URL_API_ALB}getCollectionHeaders`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        mode: 'cors',
        body: JSON.stringify({ id, onlyReusables: true }),
    });
    const collectionHeader = await collectionHeaderResponse.json();
    if (!collectionHeaderResponse.ok || !collectionHeader || !Array.isArray(collectionHeader)) throw new Error(`Collection header with ID ${id} not found`);
    const collectionIndexesResponse = await fetch(`${URL_API_ALB}collections`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        mode: 'cors',
        body: JSON.stringify({ id, getIndexOnly: true }),
    });
    const collectionIndexes = (await collectionIndexesResponse.json()).item;
    if (!collectionIndexesResponse.ok || !collectionIndexes || !Array.isArray(collectionIndexes)) throw new Error(`Collection indexes with ID ${id} not found`);
    const { collectionRest, ...collectionHeaderRest }: any = collectionHeader[0];
    return {
        ...collectionHeaderRest,
        ...collectionRest,
        item: (await Promise.all(collectionIndexes.map(
            async (index: string): Promise<any> => {
                const collectionResponse = await fetch(`${URL_API_ALB}collections`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    mode: 'cors',
                    body: JSON.stringify({ id, index, includeStepsData: true, includeImages: true }),
                });
                const item = (await collectionResponse.json()).item;
                if (!collectionResponse.ok || !item || !Array.isArray(item)) throw new Error(`StepData with StepID ${id} and index ${index} not found`);
                return item[0];
            }
        ))).flat(),
    };
}

export async function updateCollection(id: string, { item, ...collectionRest }: any, updatedBy: string = "Default User", temp: boolean = false): Promise<any> {
    await checkConnection();
    if (item.some((item: any): boolean => typeof item === "string" || item instanceof String)) {
        throw new Error("Invalid collection item");
    }
    const updateCollectionResponse = await fetch(`${URL_API_ALB}collections`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        mode: 'cors',
        body: JSON.stringify({
            id,
            collection: {
                ...collectionRest,
                item: [{}],
            },
            updatedBy,
            temp
        }),
    });
    const updatedCollection = (await updateCollectionResponse.json()).filter((item: any) => item.type === "COLLECTION")?.[0];
    if (!updateCollectionResponse.ok || !updatedCollection || !updatedCollection.id) {
        throw new Error(`Error updating reusable steps with ID ${id}`);
    }
    return {
        ...updatedCollection,
        item: await Promise.all(item.map(
            async (collectionItem: any, index: number): Promise<any> => {
                const updateCollectionItemResponse = await fetch(`${URL_API_ALB}addCollectionItem`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    mode: 'cors',
                    body: JSON.stringify({
                        id,
                        index: index.toString().padStart(8, "0"),
                        collectionItem,
                        temp,
                    }),
                });
                const updatedCollectionItem = await updateCollectionItemResponse.json();
                if (!updateCollectionItemResponse.ok || !updatedCollectionItem || !updatedCollectionItem.id) {
                    throw new Error(`Error updating reusable step with ID ${id} and index ${index}`);
                }
                return updatedCollectionItem;
            })
        ),
    };
}

export async function getEnv(envId: string): Promise<any> {
    await checkConnection();
    const envResponse = await fetch(`${URL_API_ALB}envs`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        mode: 'cors',
        body: JSON.stringify({ id: envId }),
    });
    const env = await envResponse.json();
    if (!envResponse.ok || !env) throw new Error(`Environment with ID ${envId} not found`);
    return env;
}
