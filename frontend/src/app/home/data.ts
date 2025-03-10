// data.ts
import { Module, Submodule, Tag, TestCase } from "./types";

export const mockModules: Module[] = [
    { id: "1", name: "Transfer" },
    { id: "2", name: "Move money" },
    { id: "3", name: "Collect" },
    { id: "4", name: "Profile" },
];

export const mockSubmodules: Submodule[] = [
    { id: "1", name: "Add accounts", moduleName: "Transfer" },
    { id: "2", name: "Transfer I-E", moduleName: "Transfer" },
    { id: "3", name: "Send money to ach recipient", moduleName: "2" },
    { id: "4", name: "Send money to International recipient", moduleName: "2" },
    { id: "5", name: "Collect ACH", moduleName: "3" },
];

export const mockTags: Tag[] = [
    { id: "1", name: "Regression" },
    { id: "2", name: "Transfer" },
    { id: "3", name: "Smoke" },
];

export const mockTestCases: TestCase[] = [
    {
        id: "1",
        name: "Transfer to Internal to Internal",
        module: "Transfer",
        submodule: ["Add Acounts"],
        tags: ["Regression"],
        contextGeneral: {
            "action": "navigate",
            "data": {
                "pageSize": {
                    "height": 956,
                    "width": 1532
                },
                "timestamp": "2025-01-31 11:14:03",
                "url": "https://auth.wp.blossombeta.com/phone-verification-code?rememberDevice=false&session=90fc0cc0-1f16-4e9c-9a65-24761e4401ad&switch-profile=true&redirect=https%3A%2F%2Fmember.wp.blossombeta.com&role=MEMBER",
                "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36"
            }
        },
        jsonSteps: [
            {
                "action": "change",
                "context": {
                    "origin": "https://auth.wp.blossombeta.com",
                    "titlePage": "Wasatch Peaks Credit Union - Auth",
                    "url": "https://auth.wp.blossombeta.com/phone-verification-code?rememberDevice=false&session=90fc0cc0-1f16-4e9c-9a65-24761e4401ad&switch-profile=true&redirect=https%3A%2F%2Fmember.wp.blossombeta.com&role=MEMBER",
                    "window": {
                        "height": 1195,
                        "width": 1915
                    }
                },
                "data": {
                    "attributes": {
                        "aria-label": "Using your @you",
                        "autocomplete": "username",
                        "class": "customInputDate border focus:outline-none  undefined focus:ring-1 focus:ring-primary-600  bg-transparent p-1  w-full rounded-lg pl-8 pr-2 [object Object] py-2 text-sm color-blue placeholder-gray-500\t focus:border-transparent",
                        "data-default": "defaultValue",
                        "data-testid": "usernameInput",
                        "id": "usernameInput",
                        "placeholder": "Username",
                        "type": "text",
                        "value": "<UsernameInput>",
                        "width": "100"
                    },
                    "coordinates": {
                        "x": 0,
                        "y": 0
                    },
                    "selectors": [
                        {
                            "locator": "#usernameInput",
                            "type": "id"
                        },
                        {
                            "locator": "[data-testid=\"usernameInput\"]",
                            "type": "data-testid"
                        },
                        {
                            "locator": "//*[@data-testid='usernameInput']",
                            "type": "xpath"
                        },
                        {
                            "locator": "customInputDate border focus:outline-none  undefined focus:ring-1 focus:ring-primary-600  bg-transparent p-1  w-full rounded-lg pl-8 pr-2 [object Object] py-2 text-sm color-blue placeholder-gray-500\t focus:border-transparent",
                            "type": "class"
                        },
                        {
                            "locator": "/html/body/div/div/div/div[2]/div/div/div[5]/div/input",
                            "type": "xpath"
                        }
                    ],
                    "text": "",
                    "timeStamp": 5999.5999999996275
                },
                "indexStep": 1
            },
            {
                "action": "click",
                "context": {
                    "origin": "https://auth.wp.blossombeta.com",
                    "titlePage": "Wasatch Peaks Credit Union - Auth",
                    "url": "https://auth.wp.blossombeta.com/phone-verification-code?rememberDevice=false&session=90fc0cc0-1f16-4e9c-9a65-24761e4401ad&switch-profile=true&redirect=https%3A%2F%2Fmember.wp.blossombeta.com&role=MEMBER",
                    "window": {
                        "height": 1195,
                        "width": 1915
                    }
                },
                "data": {
                    "attributes": {
                        "aria-label": "Continue",
                        "class": "text-sm px-4 font-medium w-full border border-transparent bg-primary-600 text-white hover:bg-primary-700 px-2 py-2.5 rounded-lg focus:outline-none text-sm py-2.5 border-none justify-center items-center flex",
                        "data-default": "defaultValue",
                        "data-testid": "btn-sign-in-username",
                        "id": "btn-zoomOut-button-sign-in-username",
                        "type": "submit"
                    },
                    "coordinates": {
                        "x": 930,
                        "y": 560
                    },
                    "selectors": [
                        {
                            "locator": "#btn-zoomOut-button-sign-in-username",
                            "type": "id"
                        },
                        {
                            "locator": "[data-testid=\"btn-sign-in-username\"]",
                            "type": "data-testid"
                        },
                        {
                            "locator": "//*[@data-testid='btn-sign-in-username']",
                            "type": "xpath"
                        },
                        {
                            "locator": "text-sm px-4 font-medium w-full border border-transparent bg-primary-600 text-white hover:bg-primary-700 px-2 py-2.5 rounded-lg focus:outline-none text-sm py-2.5 border-none justify-center items-center flex",
                            "type": "class"
                        },
                        {
                            "locator": "/html/body/div/div/div/div[2]/div/div/div[5]/button",
                            "type": "xpath"
                        }
                    ],
                    "text": "Continue",
                    "timeStamp": 6444.5999999996275
                },
                "indexStep": 2
            },
            {
                "action": "change",
                "context": {
                    "origin": "https://auth.wp.blossombeta.com",
                    "titlePage": "Wasatch Peaks Credit Union - Auth",
                    "url": "https://auth.wp.blossombeta.com/phone-verification-code?rememberDevice=false&session=90fc0cc0-1f16-4e9c-9a65-24761e4401ad&switch-profile=true&redirect=https%3A%2F%2Fmember.wp.blossombeta.com&role=MEMBER",
                    "window": {
                        "height": 1195,
                        "width": 1915
                    }
                },
                "data": {
                    "attributes": {
                        "aria-label": "password",
                        "class": "customInputDate border focus:outline-none  undefined focus:ring-1 focus:ring-primary-600  bg-transparent p-1  w-full rounded-lg pl-8 pr-9 [object Object] py-2 text-sm focus:border-transparent",
                        "data-default": "defaultValue",
                        "data-testid": "passwordInput",
                        "id": "passwordInput",
                        "name": "password",
                        "placeholder": "Your password",
                        "type": "password",
                        "value": "<PasswordInput>",
                        "width": "100"
                    },
                    "coordinates": {
                        "x": 0,
                        "y": 0
                    },
                    "selectors": [
                        {
                            "locator": "#passwordInput",
                            "type": "id"
                        },
                        {
                            "locator": "[data-testid=\"passwordInput\"]",
                            "type": "data-testid"
                        },
                        {
                            "locator": "//*[@data-testid='passwordInput']",
                            "type": "xpath"
                        },
                        {
                            "locator": "customInputDate border focus:outline-none  undefined focus:ring-1 focus:ring-primary-600  bg-transparent p-1  w-full rounded-lg pl-8 pr-9 [object Object] py-2 text-sm focus:border-transparent",
                            "type": "class"
                        },
                        {
                            "locator": "/html/body/div/div/div/div[2]/div/div/div[3]/form/div[2]/input",
                            "type": "xpath"
                        }
                    ],
                    "text": "",
                    "timeStamp": 15731.799999999814
                },
                "indexStep": 3
            },
            {
                "action": "click",
                "context": {
                    "origin": "https://auth.wp.blossombeta.com",
                    "titlePage": "Wasatch Peaks Credit Union - Auth",
                    "url": "https://auth.wp.blossombeta.com/phone-verification-code?rememberDevice=false&session=90fc0cc0-1f16-4e9c-9a65-24761e4401ad&switch-profile=true&redirect=https%3A%2F%2Fmember.wp.blossombeta.com&role=MEMBER",
                    "window": {
                        "height": 1195,
                        "width": 1915
                    }
                },
                "data": {
                    "attributes": {
                        "aria-label": "Sign in",
                        "class": "text-sm px-4 font-medium w-full border border-transparent bg-primary-600 text-white hover:bg-primary-700 px-2 py-2.5 rounded-lg focus:outline-none flex justify-center py-2 text-base text-center md:text-sm",
                        "data-default": "defaultValue",
                        "data-testid": "btn-sign-in-password",
                        "id": "btn-zoomOut-button-sign-in-password",
                        "type": "button"
                    },
                    "coordinates": {
                        "x": 957,
                        "y": 551
                    },
                    "selectors": [
                        {
                            "locator": "#btn-zoomOut-button-sign-in-password",
                            "type": "id"
                        },
                        {
                            "locator": "[data-testid=\"btn-sign-in-password\"]",
                            "type": "data-testid"
                        },
                        {
                            "locator": "//*[@data-testid='btn-sign-in-password']",
                            "type": "xpath"
                        },
                        {
                            "locator": "text-sm px-4 font-medium w-full border border-transparent bg-primary-600 text-white hover:bg-primary-700 px-2 py-2.5 rounded-lg focus:outline-none flex justify-center py-2 text-base text-center md:text-sm",
                            "type": "class"
                        },
                        {
                            "locator": "/html/body/div/div/div/div[2]/div/div/div[3]/div[2]/button",
                            "type": "xpath"
                        }
                    ],
                    "text": "Sign in",
                    "timeStamp": 15800.599999999627
                },
                "indexStep": 4
            }
        ]
    },
    {
        id: "2",
        name: "Límites de transferencia internacional",
        module: "Transfer",
        submodule: ["Transfer ach"],
        tags: ["Regression"],
        contextGeneral: {
            "action": "navigate",
            "data": {
                "pageSize": {
                    "height": 956,
                    "width": 1532
                },
                "timestamp": "2025-01-31 11:14:03",
                "url": "https://auth.wp.blossombeta.com/phone-verification-code?rememberDevice=false&session=90fc0cc0-1f16-4e9c-9a65-24761e4401ad&switch-profile=true&redirect=https%3A%2F%2Fmember.wp.blossombeta.com&role=MEMBER",
                "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36"
            }
        },
        jsonSteps: [
            {
                "action": "change",
                "context": {
                    "origin": "https://auth.wp.blossombeta.com",
                    "titlePage": "Wasatch Peaks Credit Union - Auth",
                    "url": "https://auth.wp.blossombeta.com/phone-verification-code?rememberDevice=false&session=90fc0cc0-1f16-4e9c-9a65-24761e4401ad&switch-profile=true&redirect=https%3A%2F%2Fmember.wp.blossombeta.com&role=MEMBER",
                    "window": {
                        "height": 1195,
                        "width": 1915
                    }
                },
                "data": {
                    "attributes": {
                        "aria-label": "Using your @you",
                        "autocomplete": "username",
                        "class": "customInputDate border focus:outline-none  undefined focus:ring-1 focus:ring-primary-600  bg-transparent p-1  w-full rounded-lg pl-8 pr-2 [object Object] py-2 text-sm color-blue placeholder-gray-500\t focus:border-transparent",
                        "data-default": "defaultValue",
                        "data-testid": "usernameInput",
                        "id": "usernameInput",
                        "placeholder": "Username",
                        "type": "text",
                        "value": "<UsernameInput>",
                        "width": "100"
                    },
                    "coordinates": {
                        "x": 0,
                        "y": 0
                    },
                    "selectors": [
                        {
                            "locator": "#usernameInput",
                            "type": "id"
                        },
                        {
                            "locator": "[data-testid=\"usernameInput\"]",
                            "type": "data-testid"
                        },
                        {
                            "locator": "//*[@data-testid='usernameInput']",
                            "type": "xpath"
                        },
                        {
                            "locator": "customInputDate border focus:outline-none  undefined focus:ring-1 focus:ring-primary-600  bg-transparent p-1  w-full rounded-lg pl-8 pr-2 [object Object] py-2 text-sm color-blue placeholder-gray-500\t focus:border-transparent",
                            "type": "class"
                        },
                        {
                            "locator": "/html/body/div/div/div/div[2]/div/div/div[5]/div/input",
                            "type": "xpath"
                        }
                    ],
                    "text": "",
                    "timeStamp": 5999.5999999996275
                },
                "indexStep": 1
            },
            {
                "action": "click",
                "context": {
                    "origin": "https://auth.wp.blossombeta.com",
                    "titlePage": "Wasatch Peaks Credit Union - Auth",
                    "url": "https://auth.wp.blossombeta.com/phone-verification-code?rememberDevice=false&session=90fc0cc0-1f16-4e9c-9a65-24761e4401ad&switch-profile=true&redirect=https%3A%2F%2Fmember.wp.blossombeta.com&role=MEMBER",
                    "window": {
                        "height": 1195,
                        "width": 1915
                    }
                },
                "data": {
                    "attributes": {
                        "aria-label": "Continue",
                        "class": "text-sm px-4 font-medium w-full border border-transparent bg-primary-600 text-white hover:bg-primary-700 px-2 py-2.5 rounded-lg focus:outline-none text-sm py-2.5 border-none justify-center items-center flex",
                        "data-default": "defaultValue",
                        "data-testid": "btn-sign-in-username",
                        "id": "btn-zoomOut-button-sign-in-username",
                        "type": "submit"
                    },
                    "coordinates": {
                        "x": 930,
                        "y": 560
                    },
                    "selectors": [
                        {
                            "locator": "#btn-zoomOut-button-sign-in-username",
                            "type": "id"
                        },
                        {
                            "locator": "[data-testid=\"btn-sign-in-username\"]",
                            "type": "data-testid"
                        },
                        {
                            "locator": "//*[@data-testid='btn-sign-in-username']",
                            "type": "xpath"
                        },
                        {
                            "locator": "text-sm px-4 font-medium w-full border border-transparent bg-primary-600 text-white hover:bg-primary-700 px-2 py-2.5 rounded-lg focus:outline-none text-sm py-2.5 border-none justify-center items-center flex",
                            "type": "class"
                        },
                        {
                            "locator": "/html/body/div/div/div/div[2]/div/div/div[5]/button",
                            "type": "xpath"
                        }
                    ],
                    "text": "Continue",
                    "timeStamp": 6444.5999999996275
                },
                "indexStep": 2
            },
            {
                "action": "change",
                "context": {
                    "origin": "https://auth.wp.blossombeta.com",
                    "titlePage": "Wasatch Peaks Credit Union - Auth",
                    "url": "https://auth.wp.blossombeta.com/phone-verification-code?rememberDevice=false&session=90fc0cc0-1f16-4e9c-9a65-24761e4401ad&switch-profile=true&redirect=https%3A%2F%2Fmember.wp.blossombeta.com&role=MEMBER",
                    "window": {
                        "height": 1195,
                        "width": 1915
                    }
                },
                "data": {
                    "attributes": {
                        "aria-label": "password",
                        "class": "customInputDate border focus:outline-none  undefined focus:ring-1 focus:ring-primary-600  bg-transparent p-1  w-full rounded-lg pl-8 pr-9 [object Object] py-2 text-sm focus:border-transparent",
                        "data-default": "defaultValue",
                        "data-testid": "passwordInput",
                        "id": "passwordInput",
                        "name": "password",
                        "placeholder": "Your password",
                        "type": "password",
                        "value": "<PasswordInput>",
                        "width": "100"
                    },
                    "coordinates": {
                        "x": 0,
                        "y": 0
                    },
                    "selectors": [
                        {
                            "locator": "#passwordInput",
                            "type": "id"
                        },
                        {
                            "locator": "[data-testid=\"passwordInput\"]",
                            "type": "data-testid"
                        },
                        {
                            "locator": "//*[@data-testid='passwordInput']",
                            "type": "xpath"
                        },
                        {
                            "locator": "customInputDate border focus:outline-none  undefined focus:ring-1 focus:ring-primary-600  bg-transparent p-1  w-full rounded-lg pl-8 pr-9 [object Object] py-2 text-sm focus:border-transparent",
                            "type": "class"
                        },
                        {
                            "locator": "/html/body/div/div/div/div[2]/div/div/div[3]/form/div[2]/input",
                            "type": "xpath"
                        }
                    ],
                    "text": "",
                    "timeStamp": 15731.799999999814
                },
                "indexStep": 3
            },
            {
                "action": "click",
                "context": {
                    "origin": "https://auth.wp.blossombeta.com",
                    "titlePage": "Wasatch Peaks Credit Union - Auth",
                    "url": "https://auth.wp.blossombeta.com/phone-verification-code?rememberDevice=false&session=90fc0cc0-1f16-4e9c-9a65-24761e4401ad&switch-profile=true&redirect=https%3A%2F%2Fmember.wp.blossombeta.com&role=MEMBER",
                    "window": {
                        "height": 1195,
                        "width": 1915
                    }
                },
                "data": {
                    "attributes": {
                        "aria-label": "Sign in",
                        "class": "text-sm px-4 font-medium w-full border border-transparent bg-primary-600 text-white hover:bg-primary-700 px-2 py-2.5 rounded-lg focus:outline-none flex justify-center py-2 text-base text-center md:text-sm",
                        "data-default": "defaultValue",
                        "data-testid": "btn-sign-in-password",
                        "id": "btn-zoomOut-button-sign-in-password",
                        "type": "button"
                    },
                    "coordinates": {
                        "x": 957,
                        "y": 551
                    },
                    "selectors": [
                        {
                            "locator": "#btn-zoomOut-button-sign-in-password",
                            "type": "id"
                        },
                        {
                            "locator": "[data-testid=\"btn-sign-in-password\"]",
                            "type": "data-testid"
                        },
                        {
                            "locator": "//*[@data-testid='btn-sign-in-password']",
                            "type": "xpath"
                        },
                        {
                            "locator": "text-sm px-4 font-medium w-full border border-transparent bg-primary-600 text-white hover:bg-primary-700 px-2 py-2.5 rounded-lg focus:outline-none flex justify-center py-2 text-base text-center md:text-sm",
                            "type": "class"
                        },
                        {
                            "locator": "/html/body/div/div/div/div[2]/div/div/div[3]/div[2]/button",
                            "type": "xpath"
                        }
                    ],
                    "text": "Sign in",
                    "timeStamp": 15800.599999999627
                },
                "indexStep": 4
            }
        ]
    },
    {
        id: "3",
        name: "Transfer to Internal to Internal 2",
        module: "Transfer",
        submodule: ["Add Acounts"],
        tags: ["Regression"],
        contextGeneral: {
            "action": "navigate",
            "data": {
                "pageSize": {
                    "height": 956,
                    "width": 1532
                },
                "timestamp": "2025-01-31 11:14:03",
                "url": "https://auth.wp.blossombeta.com/phone-verification-code?rememberDevice=false&session=90fc0cc0-1f16-4e9c-9a65-24761e4401ad&switch-profile=true&redirect=https%3A%2F%2Fmember.wp.blossombeta.com&role=MEMBER",
                "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36"
            }
        },
        jsonSteps: [
            {
                "action": "change",
                "context": {
                    "origin": "https://auth.wp.blossombeta.com",
                    "titlePage": "Wasatch Peaks Credit Union - Auth",
                    "url": "https://auth.wp.blossombeta.com/phone-verification-code?rememberDevice=false&session=90fc0cc0-1f16-4e9c-9a65-24761e4401ad&switch-profile=true&redirect=https%3A%2F%2Fmember.wp.blossombeta.com&role=MEMBER",
                    "window": {
                        "height": 1195,
                        "width": 1915
                    }
                },
                "data": {
                    "attributes": {
                        "aria-label": "Using your @you",
                        "autocomplete": "username",
                        "class": "customInputDate border focus:outline-none  undefined focus:ring-1 focus:ring-primary-600  bg-transparent p-1  w-full rounded-lg pl-8 pr-2 [object Object] py-2 text-sm color-blue placeholder-gray-500\t focus:border-transparent",
                        "data-default": "defaultValue",
                        "data-testid": "usernameInput",
                        "id": "usernameInput",
                        "placeholder": "Username",
                        "type": "text",
                        "value": "<UsernameInput>",
                        "width": "100"
                    },
                    "coordinates": {
                        "x": 0,
                        "y": 0
                    },
                    "selectors": [
                        {
                            "locator": "#usernameInput",
                            "type": "id"
                        },
                        {
                            "locator": "[data-testid=\"usernameInput\"]",
                            "type": "data-testid"
                        },
                        {
                            "locator": "//*[@data-testid='usernameInput']",
                            "type": "xpath"
                        },
                        {
                            "locator": "customInputDate border focus:outline-none  undefined focus:ring-1 focus:ring-primary-600  bg-transparent p-1  w-full rounded-lg pl-8 pr-2 [object Object] py-2 text-sm color-blue placeholder-gray-500\t focus:border-transparent",
                            "type": "class"
                        },
                        {
                            "locator": "/html/body/div/div/div/div[2]/div/div/div[5]/div/input",
                            "type": "xpath"
                        }
                    ],
                    "text": "",
                    "timeStamp": 5999.5999999996275
                },
                "indexStep": 1
            },
            {
                "action": "click",
                "context": {
                    "origin": "https://auth.wp.blossombeta.com",
                    "titlePage": "Wasatch Peaks Credit Union - Auth",
                    "url": "https://auth.wp.blossombeta.com/phone-verification-code?rememberDevice=false&session=90fc0cc0-1f16-4e9c-9a65-24761e4401ad&switch-profile=true&redirect=https%3A%2F%2Fmember.wp.blossombeta.com&role=MEMBER",
                    "window": {
                        "height": 1195,
                        "width": 1915
                    }
                },
                "data": {
                    "attributes": {
                        "aria-label": "Continue",
                        "class": "text-sm px-4 font-medium w-full border border-transparent bg-primary-600 text-white hover:bg-primary-700 px-2 py-2.5 rounded-lg focus:outline-none text-sm py-2.5 border-none justify-center items-center flex",
                        "data-default": "defaultValue",
                        "data-testid": "btn-sign-in-username",
                        "id": "btn-zoomOut-button-sign-in-username",
                        "type": "submit"
                    },
                    "coordinates": {
                        "x": 930,
                        "y": 560
                    },
                    "selectors": [
                        {
                            "locator": "#btn-zoomOut-button-sign-in-username",
                            "type": "id"
                        },
                        {
                            "locator": "[data-testid=\"btn-sign-in-username\"]",
                            "type": "data-testid"
                        },
                        {
                            "locator": "//*[@data-testid='btn-sign-in-username']",
                            "type": "xpath"
                        },
                        {
                            "locator": "text-sm px-4 font-medium w-full border border-transparent bg-primary-600 text-white hover:bg-primary-700 px-2 py-2.5 rounded-lg focus:outline-none text-sm py-2.5 border-none justify-center items-center flex",
                            "type": "class"
                        },
                        {
                            "locator": "/html/body/div/div/div/div[2]/div/div/div[5]/button",
                            "type": "xpath"
                        }
                    ],
                    "text": "Continue",
                    "timeStamp": 6444.5999999996275
                },
                "indexStep": 2
            },
            {
                "action": "change",
                "context": {
                    "origin": "https://auth.wp.blossombeta.com",
                    "titlePage": "Wasatch Peaks Credit Union - Auth",
                    "url": "https://auth.wp.blossombeta.com/phone-verification-code?rememberDevice=false&session=90fc0cc0-1f16-4e9c-9a65-24761e4401ad&switch-profile=true&redirect=https%3A%2F%2Fmember.wp.blossombeta.com&role=MEMBER",
                    "window": {
                        "height": 1195,
                        "width": 1915
                    }
                },
                "data": {
                    "attributes": {
                        "aria-label": "password",
                        "class": "customInputDate border focus:outline-none  undefined focus:ring-1 focus:ring-primary-600  bg-transparent p-1  w-full rounded-lg pl-8 pr-9 [object Object] py-2 text-sm focus:border-transparent",
                        "data-default": "defaultValue",
                        "data-testid": "passwordInput",
                        "id": "passwordInput",
                        "name": "password",
                        "placeholder": "Your password",
                        "type": "password",
                        "value": "<PasswordInput>",
                        "width": "100"
                    },
                    "coordinates": {
                        "x": 0,
                        "y": 0
                    },
                    "selectors": [
                        {
                            "locator": "#passwordInput",
                            "type": "id"
                        },
                        {
                            "locator": "[data-testid=\"passwordInput\"]",
                            "type": "data-testid"
                        },
                        {
                            "locator": "//*[@data-testid='passwordInput']",
                            "type": "xpath"
                        },
                        {
                            "locator": "customInputDate border focus:outline-none  undefined focus:ring-1 focus:ring-primary-600  bg-transparent p-1  w-full rounded-lg pl-8 pr-9 [object Object] py-2 text-sm focus:border-transparent",
                            "type": "class"
                        },
                        {
                            "locator": "/html/body/div/div/div/div[2]/div/div/div[3]/form/div[2]/input",
                            "type": "xpath"
                        }
                    ],
                    "text": "",
                    "timeStamp": 15731.799999999814
                },
                "indexStep": 3
            },
            {
                "action": "click",
                "context": {
                    "origin": "https://auth.wp.blossombeta.com",
                    "titlePage": "Wasatch Peaks Credit Union - Auth",
                    "url": "https://auth.wp.blossombeta.com/phone-verification-code?rememberDevice=false&session=90fc0cc0-1f16-4e9c-9a65-24761e4401ad&switch-profile=true&redirect=https%3A%2F%2Fmember.wp.blossombeta.com&role=MEMBER",
                    "window": {
                        "height": 1195,
                        "width": 1915
                    }
                },
                "data": {
                    "attributes": {
                        "aria-label": "Sign in",
                        "class": "text-sm px-4 font-medium w-full border border-transparent bg-primary-600 text-white hover:bg-primary-700 px-2 py-2.5 rounded-lg focus:outline-none flex justify-center py-2 text-base text-center md:text-sm",
                        "data-default": "defaultValue",
                        "data-testid": "btn-sign-in-password",
                        "id": "btn-zoomOut-button-sign-in-password",
                        "type": "button"
                    },
                    "coordinates": {
                        "x": 957,
                        "y": 551
                    },
                    "selectors": [
                        {
                            "locator": "#btn-zoomOut-button-sign-in-password",
                            "type": "id"
                        },
                        {
                            "locator": "[data-testid=\"btn-sign-in-password\"]",
                            "type": "data-testid"
                        },
                        {
                            "locator": "//*[@data-testid='btn-sign-in-password']",
                            "type": "xpath"
                        },
                        {
                            "locator": "text-sm px-4 font-medium w-full border border-transparent bg-primary-600 text-white hover:bg-primary-700 px-2 py-2.5 rounded-lg focus:outline-none flex justify-center py-2 text-base text-center md:text-sm",
                            "type": "class"
                        },
                        {
                            "locator": "/html/body/div/div/div/div[2]/div/div/div[3]/div[2]/button",
                            "type": "xpath"
                        }
                    ],
                    "text": "Sign in",
                    "timeStamp": 15800.599999999627
                },
                "indexStep": 4
            }
        ]
    },
    {
        id: "4",
        name: "Límites de transferencia internacional 2",
        module: "Transfer",
        submodule: ["Transfer ach"],
        tags: ["Regression"],
        contextGeneral: {
            "action": "navigate",
            "data": {
                "pageSize": {
                    "height": 956,
                    "width": 1532
                },
                "timestamp": "2025-01-31 11:14:03",
                "url": "https://auth.wp.blossombeta.com/phone-verification-code?rememberDevice=false&session=90fc0cc0-1f16-4e9c-9a65-24761e4401ad&switch-profile=true&redirect=https%3A%2F%2Fmember.wp.blossombeta.com&role=MEMBER",
                "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36"
            }
        },
        jsonSteps: [
            {
                "action": "change",
                "context": {
                    "origin": "https://auth.wp.blossombeta.com",
                    "titlePage": "Wasatch Peaks Credit Union - Auth",
                    "url": "https://auth.wp.blossombeta.com/phone-verification-code?rememberDevice=false&session=90fc0cc0-1f16-4e9c-9a65-24761e4401ad&switch-profile=true&redirect=https%3A%2F%2Fmember.wp.blossombeta.com&role=MEMBER",
                    "window": {
                        "height": 1195,
                        "width": 1915
                    }
                },
                "data": {
                    "attributes": {
                        "aria-label": "Using your @you",
                        "autocomplete": "username",
                        "class": "customInputDate border focus:outline-none  undefined focus:ring-1 focus:ring-primary-600  bg-transparent p-1  w-full rounded-lg pl-8 pr-2 [object Object] py-2 text-sm color-blue placeholder-gray-500\t focus:border-transparent",
                        "data-default": "defaultValue",
                        "data-testid": "usernameInput",
                        "id": "usernameInput",
                        "placeholder": "Username",
                        "type": "text",
                        "value": "<UsernameInput>",
                        "width": "100"
                    },
                    "coordinates": {
                        "x": 0,
                        "y": 0
                    },
                    "selectors": [
                        {
                            "locator": "#usernameInput",
                            "type": "id"
                        },
                        {
                            "locator": "[data-testid=\"usernameInput\"]",
                            "type": "data-testid"
                        },
                        {
                            "locator": "//*[@data-testid='usernameInput']",
                            "type": "xpath"
                        },
                        {
                            "locator": "customInputDate border focus:outline-none  undefined focus:ring-1 focus:ring-primary-600  bg-transparent p-1  w-full rounded-lg pl-8 pr-2 [object Object] py-2 text-sm color-blue placeholder-gray-500\t focus:border-transparent",
                            "type": "class"
                        },
                        {
                            "locator": "/html/body/div/div/div/div[2]/div/div/div[5]/div/input",
                            "type": "xpath"
                        }
                    ],
                    "text": "",
                    "timeStamp": 5999.5999999996275
                },
                "indexStep": 1
            },
            {
                "action": "click",
                "context": {
                    "origin": "https://auth.wp.blossombeta.com",
                    "titlePage": "Wasatch Peaks Credit Union - Auth",
                    "url": "https://auth.wp.blossombeta.com/phone-verification-code?rememberDevice=false&session=90fc0cc0-1f16-4e9c-9a65-24761e4401ad&switch-profile=true&redirect=https%3A%2F%2Fmember.wp.blossombeta.com&role=MEMBER",
                    "window": {
                        "height": 1195,
                        "width": 1915
                    }
                },
                "data": {
                    "attributes": {
                        "aria-label": "Continue",
                        "class": "text-sm px-4 font-medium w-full border border-transparent bg-primary-600 text-white hover:bg-primary-700 px-2 py-2.5 rounded-lg focus:outline-none text-sm py-2.5 border-none justify-center items-center flex",
                        "data-default": "defaultValue",
                        "data-testid": "btn-sign-in-username",
                        "id": "btn-zoomOut-button-sign-in-username",
                        "type": "submit"
                    },
                    "coordinates": {
                        "x": 930,
                        "y": 560
                    },
                    "selectors": [
                        {
                            "locator": "#btn-zoomOut-button-sign-in-username",
                            "type": "id"
                        },
                        {
                            "locator": "[data-testid=\"btn-sign-in-username\"]",
                            "type": "data-testid"
                        },
                        {
                            "locator": "//*[@data-testid='btn-sign-in-username']",
                            "type": "xpath"
                        },
                        {
                            "locator": "text-sm px-4 font-medium w-full border border-transparent bg-primary-600 text-white hover:bg-primary-700 px-2 py-2.5 rounded-lg focus:outline-none text-sm py-2.5 border-none justify-center items-center flex",
                            "type": "class"
                        },
                        {
                            "locator": "/html/body/div/div/div/div[2]/div/div/div[5]/button",
                            "type": "xpath"
                        }
                    ],
                    "text": "Continue",
                    "timeStamp": 6444.5999999996275
                },
                "indexStep": 2
            },
            {
                "action": "change",
                "context": {
                    "origin": "https://auth.wp.blossombeta.com",
                    "titlePage": "Wasatch Peaks Credit Union - Auth",
                    "url": "https://auth.wp.blossombeta.com/phone-verification-code?rememberDevice=false&session=90fc0cc0-1f16-4e9c-9a65-24761e4401ad&switch-profile=true&redirect=https%3A%2F%2Fmember.wp.blossombeta.com&role=MEMBER",
                    "window": {
                        "height": 1195,
                        "width": 1915
                    }
                },
                "data": {
                    "attributes": {
                        "aria-label": "password",
                        "class": "customInputDate border focus:outline-none  undefined focus:ring-1 focus:ring-primary-600  bg-transparent p-1  w-full rounded-lg pl-8 pr-9 [object Object] py-2 text-sm focus:border-transparent",
                        "data-default": "defaultValue",
                        "data-testid": "passwordInput",
                        "id": "passwordInput",
                        "name": "password",
                        "placeholder": "Your password",
                        "type": "password",
                        "value": "<PasswordInput>",
                        "width": "100"
                    },
                    "coordinates": {
                        "x": 0,
                        "y": 0
                    },
                    "selectors": [
                        {
                            "locator": "#passwordInput",
                            "type": "id"
                        },
                        {
                            "locator": "[data-testid=\"passwordInput\"]",
                            "type": "data-testid"
                        },
                        {
                            "locator": "//*[@data-testid='passwordInput']",
                            "type": "xpath"
                        },
                        {
                            "locator": "customInputDate border focus:outline-none  undefined focus:ring-1 focus:ring-primary-600  bg-transparent p-1  w-full rounded-lg pl-8 pr-9 [object Object] py-2 text-sm focus:border-transparent",
                            "type": "class"
                        },
                        {
                            "locator": "/html/body/div/div/div/div[2]/div/div/div[3]/form/div[2]/input",
                            "type": "xpath"
                        }
                    ],
                    "text": "",
                    "timeStamp": 15731.799999999814
                },
                "indexStep": 3
            },
            {
                "action": "click",
                "context": {
                    "origin": "https://auth.wp.blossombeta.com",
                    "titlePage": "Wasatch Peaks Credit Union - Auth",
                    "url": "https://auth.wp.blossombeta.com/phone-verification-code?rememberDevice=false&session=90fc0cc0-1f16-4e9c-9a65-24761e4401ad&switch-profile=true&redirect=https%3A%2F%2Fmember.wp.blossombeta.com&role=MEMBER",
                    "window": {
                        "height": 1195,
                        "width": 1915
                    }
                },
                "data": {
                    "attributes": {
                        "aria-label": "Sign in",
                        "class": "text-sm px-4 font-medium w-full border border-transparent bg-primary-600 text-white hover:bg-primary-700 px-2 py-2.5 rounded-lg focus:outline-none flex justify-center py-2 text-base text-center md:text-sm",
                        "data-default": "defaultValue",
                        "data-testid": "btn-sign-in-password",
                        "id": "btn-zoomOut-button-sign-in-password",
                        "type": "button"
                    },
                    "coordinates": {
                        "x": 957,
                        "y": 551
                    },
                    "selectors": [
                        {
                            "locator": "#btn-zoomOut-button-sign-in-password",
                            "type": "id"
                        },
                        {
                            "locator": "[data-testid=\"btn-sign-in-password\"]",
                            "type": "data-testid"
                        },
                        {
                            "locator": "//*[@data-testid='btn-sign-in-password']",
                            "type": "xpath"
                        },
                        {
                            "locator": "text-sm px-4 font-medium w-full border border-transparent bg-primary-600 text-white hover:bg-primary-700 px-2 py-2.5 rounded-lg focus:outline-none flex justify-center py-2 text-base text-center md:text-sm",
                            "type": "class"
                        },
                        {
                            "locator": "/html/body/div/div/div/div[2]/div/div/div[3]/div[2]/button",
                            "type": "xpath"
                        }
                    ],
                    "text": "Sign in",
                    "timeStamp": 15800.599999999627
                },
                "indexStep": 4
            },
            {
                "action": "change",
                "context": {
                    "origin": "https://auth.wp.blossombeta.com",
                    "titlePage": "Wasatch Peaks Credit Union - Auth",
                    "url": "https://auth.wp.blossombeta.com/phone-verification-code?rememberDevice=false&session=90fc0cc0-1f16-4e9c-9a65-24761e4401ad&switch-profile=true&redirect=https%3A%2F%2Fmember.wp.blossombeta.com&role=MEMBER",
                    "window": {
                        "height": 1195,
                        "width": 1915
                    }
                },
                "data": {
                    "attributes": {
                        "aria-label": "password",
                        "class": "customInputDate border focus:outline-none  undefined focus:ring-1 focus:ring-primary-600  bg-transparent p-1  w-full rounded-lg pl-8 pr-9 [object Object] py-2 text-sm focus:border-transparent",
                        "data-default": "defaultValue",
                        "data-testid": "passwordInput",
                        "id": "passwordInput",
                        "name": "password",
                        "placeholder": "Your password",
                        "type": "password",
                        "value": "<PasswordInput2>",
                        "width": "100"
                    },
                    "coordinates": {
                        "x": 0,
                        "y": 0
                    },
                    "selectors": [
                        {
                            "locator": "#passwordInput",
                            "type": "id"
                        },
                        {
                            "locator": "[data-testid=\"passwordInput\"]",
                            "type": "data-testid"
                        },
                        {
                            "locator": "//*[@data-testid='passwordInput']",
                            "type": "xpath"
                        },
                        {
                            "locator": "customInputDate border focus:outline-none  undefined focus:ring-1 focus:ring-primary-600  bg-transparent p-1  w-full rounded-lg pl-8 pr-9 [object Object] py-2 text-sm focus:border-transparent",
                            "type": "class"
                        },
                        {
                            "locator": "/html/body/div/div/div/div[2]/div/div/div[3]/form/div[2]/input",
                            "type": "xpath"
                        }
                    ],
                    "text": "",
                    "timeStamp": 15731.799999999814
                },
                "indexStep": 5
            },
            {
                "action": "change",
                "context": {
                    "origin": "https://auth.wp.blossombeta.com",
                    "titlePage": "Wasatch Peaks Credit Union - Auth",
                    "url": "https://auth.wp.blossombeta.com/phone-verification-code?rememberDevice=false&session=90fc0cc0-1f16-4e9c-9a65-24761e4401ad&switch-profile=true&redirect=https%3A%2F%2Fmember.wp.blossombeta.com&role=MEMBER",
                    "window": {
                        "height": 1195,
                        "width": 1915
                    }
                },
                "data": {
                    "attributes": {
                        "aria-label": "Using your @you",
                        "autocomplete": "username",
                        "class": "customInputDate border focus:outline-none  undefined focus:ring-1 focus:ring-primary-600  bg-transparent p-1  w-full rounded-lg pl-8 pr-2 [object Object] py-2 text-sm color-blue placeholder-gray-500\t focus:border-transparent",
                        "data-default": "defaultValue",
                        "data-testid": "usernameInput",
                        "id": "usernameInput",
                        "placeholder": "Username",
                        "type": "text",
                        "value": "<UsernameInput2>",
                        "width": "100"
                    },
                    "coordinates": {
                        "x": 0,
                        "y": 0
                    },
                    "selectors": [
                        {
                            "locator": "#usernameInput",
                            "type": "id"
                        },
                        {
                            "locator": "[data-testid=\"usernameInput\"]",
                            "type": "data-testid"
                        },
                        {
                            "locator": "//*[@data-testid='usernameInput']",
                            "type": "xpath"
                        },
                        {
                            "locator": "customInputDate border focus:outline-none  undefined focus:ring-1 focus:ring-primary-600  bg-transparent p-1  w-full rounded-lg pl-8 pr-2 [object Object] py-2 text-sm color-blue placeholder-gray-500\t focus:border-transparent",
                            "type": "class"
                        },
                        {
                            "locator": "/html/body/div/div/div/div[2]/div/div/div[5]/div/input",
                            "type": "xpath"
                        }
                    ],
                    "text": "",
                    "timeStamp": 5999.5999999996275
                },
                "indexStep": 6
            }
        ]
    },
    {
        id: "5",
        name: "Facebook",
        module: "Transfer",
        submodule: ["Add Acounts"],
        tags: ["Regression"],
        "contextGeneral": {
            "action": "navigate",
            "data": {
                "pageSize": {
                    "height": 1192,
                    "width": 1198
                },
                "timestamp": "2025-02-12 21:24:27",
                "url": "https://www.facebook.com/login/device-based/regular/login/?login_attempt=1&lwv=120&lwc=1348028",
                "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36"
            }
        },
        "jsonSteps": [
            {
                "action": "change",
                "context": {
                    "origin": "https://www.facebook.com",
                    "titlePage": "Log into Facebook",
                    "url": "https://www.facebook.com/login/device-based/regular/login/?login_attempt=1&lwv=120&lwc=1348028",
                    "window": {
                        "height": 1192,
                        "width": 1198
                    }
                },
                "data": {
                    "attributes": {
                        "aria-label": "Email or phone number",
                        "autocomplete": "username",
                        "autofocus": "1",
                        "class": "inputtext _55r1 inputtext _1kbt _9ay4 inputtext _1kbt",
                        "data-default": "defaultValue",
                        "id": "email",
                        "name": "email",
                        "placeholder": "Email or phone number",
                        "tabindex": "0",
                        "type": "text",
                        "value": "<Email or phone number>"
                    },
                    "coordinates": {
                        "x": 0,
                        "y": 0
                    },
                    "selectors": [
                        {
                            "locator": "#email",
                            "type": "id"
                        },
                        {
                            "locator": "//*[@id='email']",
                            "type": "xpath"
                        },
                        {
                            "locator": "inputtext _55r1 inputtext _1kbt _9ay4 inputtext _1kbt",
                            "type": "class"
                        },
                        {
                            "locator": "/html/body/div[2]/div[2]/div[2]/div/div[2]/div[2]/form/div/div[4]/input",
                            "type": "xpath"
                        }
                    ],
                    "text": "",
                    "timeStamp": 5137.9000000003725
                },
                "indexStep": 1
            },
            {
                "action": "change",
                "context": {
                    "origin": "https://www.facebook.com",
                    "titlePage": "Log into Facebook",
                    "url": "https://www.facebook.com/login/device-based/regular/login/?login_attempt=1&lwv=120&lwc=1348028",
                    "window": {
                        "height": 1192,
                        "width": 1198
                    }
                },
                "data": {
                    "attributes": {
                        "aria-label": "Password",
                        "autocomplete": "current-password",
                        "class": "inputtext _55r1 inputtext _9npi inputtext _9npi",
                        "data-default": "defaultValue",
                        "id": "pass",
                        "name": "pass",
                        "placeholder": "Password",
                        "tabindex": "0",
                        "type": "password",
                        "value": "<Password>"
                    },
                    "coordinates": {
                        "x": 0,
                        "y": 0
                    },
                    "selectors": [
                        {
                            "locator": "#pass",
                            "type": "id"
                        },
                        {
                            "locator": "//*[@id='pass']",
                            "type": "xpath"
                        },
                        {
                            "locator": "inputtext _55r1 inputtext _9npi inputtext _9npi",
                            "type": "class"
                        },
                        {
                            "locator": "/html/body/div[2]/div[2]/div[2]/div/div[2]/div[2]/form/div/div[4]/div/div/input",
                            "type": "xpath"
                        }
                    ],
                    "text": "",
                    "timeStamp": 7809.299999998882
                },
                "indexStep": 2
            },
            {
                "action": "click",
                "context": {
                    "origin": "https://www.facebook.com",
                    "titlePage": "Log into Facebook",
                    "url": "https://www.facebook.com/login/device-based/regular/login/?login_attempt=1&lwv=120&lwc=1348028",
                    "window": {
                        "height": 1192,
                        "width": 1198
                    }
                },
                "data": {
                    "attributes": {
                        "aria-label": "no-label",
                        "class": "_42ft _4jy0 _52e0 _4jy6 _4jy1 selected _51sy",
                        "data-default": "defaultValue",
                        "id": "loginbutton",
                        "name": "login",
                        "tabindex": "0",
                        "type": "submit",
                        "value": "1"
                    },
                    "coordinates": {
                        "x": 540,
                        "y": 382
                    },
                    "selectors": [
                        {
                            "locator": "#loginbutton",
                            "type": "id"
                        },
                        {
                            "locator": "//*[@id='loginbutton']",
                            "type": "xpath"
                        },
                        {
                            "locator": "_42ft _4jy0 _52e0 _4jy6 _4jy1 selected _51sy",
                            "type": "class"
                        },
                        {
                            "locator": "/html/body/div[2]/div[2]/div[2]/div/div[2]/div[2]/form/div/div[4]/button",
                            "type": "xpath"
                        }
                    ],
                    "text": "Log In",
                    "timeStamp": 7871.5999999996275
                },
                "indexStep": 3
            }
        ]
    },
    {
        id: "6",
        "name": "Testing Extension",
        "module": "Login",
        "submodule": [
            "Login with OTP"
        ],
        "tags": [
            "Regression"
        ],
        "contextGeneral": {
            "action": "navigate",
            "data": {
                "pageSize": {
                    "height": 795,
                    "width": 1442
                },
                "timestamp": "2025-02-13 18:01:04",
                "url": "https://member.wp.blossombeta.com/",
                "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36"
            }
        },
        "jsonSteps": [
            {
                "action": "change",
                "context": {
                    "origin": "https://auth.wp.blossombeta.com",
                    "titlePage": "Wasatch Peaks Credit Union - Auth",
                    "url": "https://auth.wp.blossombeta.com/sign-in?switch-profile=true&",
                    "window": {
                        "height": 1192,
                        "width": 2163
                    }
                },
                "data": {
                    "attributes": {
                        "aria-label": "Using your @you",
                        "autocomplete": "username",
                        "class": "customInputDate border focus:outline-none  undefined focus:ring-1 focus:ring-primary-600  bg-transparent p-1  w-full rounded-lg pl-8 pr-2 [object Object] py-2 text-sm color-blue placeholder-gray-500\t focus:border-transparent",
                        "data-default": "defaultValue",
                        "data-testid": "usernameInput",
                        "id": "usernameInput",
                        "placeholder": "Username",
                        "type": "text",
                        "value": "<UsernameInput>",
                        "width": "100"
                    },
                    "coordinates": {
                        "x": 0,
                        "y": 0
                    },
                    "selectors": [
                        {
                            "locator": "#usernameInput",
                            "type": "id"
                        },
                        {
                            "locator": "[data-testid=\"usernameInput\"]",
                            "type": "data-testid"
                        },
                        {
                            "locator": "//*[@data-testid='usernameInput']",
                            "type": "xpath"
                        },
                        {
                            "locator": "customInputDate border focus:outline-none  undefined focus:ring-1 focus:ring-primary-600  bg-transparent p-1  w-full rounded-lg pl-8 pr-2 [object Object] py-2 text-sm color-blue placeholder-gray-500\t focus:border-transparent",
                            "type": "class"
                        },
                        {
                            "locator": "/html/body/div/div/div/div[2]/div/div/div[5]/div/input",
                            "type": "xpath"
                        }
                    ],
                    "text": "",
                    "timeStamp": 5995.9000000003725
                },
                "indexStep": 1
            },
            {
                "action": "click",
                "context": {
                    "origin": "https://auth.wp.blossombeta.com",
                    "titlePage": "Wasatch Peaks Credit Union - Auth",
                    "url": "https://auth.wp.blossombeta.com/sign-in?switch-profile=true&",
                    "window": {
                        "height": 1192,
                        "width": 2163
                    }
                },
                "data": {
                    "attributes": {
                        "aria-label": "Continue",
                        "class": "text-sm px-4 font-medium w-full border border-transparent bg-primary-600 text-white hover:bg-primary-700 px-2 py-2.5 rounded-lg focus:outline-none text-sm py-2.5 border-none justify-center items-center flex",
                        "data-default": "defaultValue",
                        "data-testid": "btn-sign-in-username",
                        "id": "btn-zoomOut-button-sign-in-username",
                        "type": "submit"
                    },
                    "coordinates": {
                        "x": 1043,
                        "y": 560
                    },
                    "selectors": [
                        {
                            "locator": "#btn-zoomOut-button-sign-in-username",
                            "type": "id"
                        },
                        {
                            "locator": "[data-testid=\"btn-sign-in-username\"]",
                            "type": "data-testid"
                        },
                        {
                            "locator": "//*[@data-testid='btn-sign-in-username']",
                            "type": "xpath"
                        },
                        {
                            "locator": "text-sm px-4 font-medium w-full border border-transparent bg-primary-600 text-white hover:bg-primary-700 px-2 py-2.5 rounded-lg focus:outline-none text-sm py-2.5 border-none justify-center items-center flex",
                            "type": "class"
                        },
                        {
                            "locator": "/html/body/div/div/div/div[2]/div/div/div[5]/button",
                            "type": "xpath"
                        }
                    ],
                    "text": "Continue",
                    "timeStamp": 6047.700000001118
                },
                "indexStep": 2
            },
            {
                "action": "change",
                "context": {
                    "origin": "https://auth.wp.blossombeta.com",
                    "titlePage": "Wasatch Peaks Credit Union - Auth",
                    "url": "https://auth.wp.blossombeta.com/sign-in?switch-profile=true&",
                    "window": {
                        "height": 1192,
                        "width": 2163
                    }
                },
                "data": {
                    "attributes": {
                        "aria-label": "password",
                        "class": "customInputDate border focus:outline-none  undefined focus:ring-1 focus:ring-primary-600  bg-transparent p-1  w-full rounded-lg pl-8 pr-9 [object Object] py-2 text-sm focus:border-transparent",
                        "data-default": "defaultValue",
                        "data-testid": "passwordInput",
                        "id": "passwordInput",
                        "name": "password",
                        "placeholder": "Your password",
                        "type": "password",
                        "value": "<PasswordInput>",
                        "width": "100"
                    },
                    "coordinates": {
                        "x": 0,
                        "y": 0
                    },
                    "selectors": [
                        {
                            "locator": "#passwordInput",
                            "type": "id"
                        },
                        {
                            "locator": "[data-testid=\"passwordInput\"]",
                            "type": "data-testid"
                        },
                        {
                            "locator": "//*[@data-testid='passwordInput']",
                            "type": "xpath"
                        },
                        {
                            "locator": "customInputDate border focus:outline-none  undefined focus:ring-1 focus:ring-primary-600  bg-transparent p-1  w-full rounded-lg pl-8 pr-9 [object Object] py-2 text-sm focus:border-transparent",
                            "type": "class"
                        },
                        {
                            "locator": "/html/body/div/div/div/div[2]/div/div/div[3]/form/div[2]/input",
                            "type": "xpath"
                        }
                    ],
                    "text": "",
                    "timeStamp": 14413.5
                },
                "indexStep": 3
            },
            {
                "action": "click",
                "context": {
                    "origin": "https://auth.wp.blossombeta.com",
                    "titlePage": "Wasatch Peaks Credit Union - Auth",
                    "url": "https://auth.wp.blossombeta.com/sign-in?switch-profile=true&",
                    "window": {
                        "height": 1192,
                        "width": 2163
                    }
                },
                "data": {
                    "attributes": {
                        "aria-label": "Sign in",
                        "class": "text-sm px-4 font-medium w-full border border-transparent bg-primary-600 text-white hover:bg-primary-700 px-2 py-2.5 rounded-lg focus:outline-none flex justify-center py-2 text-base text-center md:text-sm",
                        "data-default": "defaultValue",
                        "data-testid": "btn-sign-in-password",
                        "id": "btn-zoomOut-button-sign-in-password",
                        "type": "button"
                    },
                    "coordinates": {
                        "x": 1017,
                        "y": 560
                    },
                    "selectors": [
                        {
                            "locator": "#btn-zoomOut-button-sign-in-password",
                            "type": "id"
                        },
                        {
                            "locator": "[data-testid=\"btn-sign-in-password\"]",
                            "type": "data-testid"
                        },
                        {
                            "locator": "//*[@data-testid='btn-sign-in-password']",
                            "type": "xpath"
                        },
                        {
                            "locator": "text-sm px-4 font-medium w-full border border-transparent bg-primary-600 text-white hover:bg-primary-700 px-2 py-2.5 rounded-lg focus:outline-none flex justify-center py-2 text-base text-center md:text-sm",
                            "type": "class"
                        },
                        {
                            "locator": "/html/body/div/div/div/div[2]/div/div/div[3]/div[2]/button",
                            "type": "xpath"
                        }
                    ],
                    "text": "Sign in",
                    "timeStamp": 14465.5
                },
                "indexStep": 4
            },
            {
                "action": "OTP",
                "context": {
                    "origin": "https://auth.wp.blossombeta.com",
                    "titlePage": "Wasatch Peaks Credit Union - Auth",
                    "url": "https://auth.wp.blossombeta.com/sign-in?switch-profile=true&",
                    "window": {
                        "height": 1192,
                        "width": 2163
                    }
                },
                "data": {
                    "attributes": {
                        "aria-label": "no-label",
                        "class": "inputSteps outline-none cursor-text border text-3xl text-center mx-0.5\n            } hover:border-primary-600 hover:border-2 focus:border-primary-600 focus:border-2 focus:shadow-3xl rounded-lg border-gray-300",
                        "data-default": "defaultValue",
                        "data-testid": "btn-input_0",
                        "id": "btn-input_0",
                        "pattern": "[0-9]*",
                        "type": "text",
                        "value": ""
                    },
                    "coordinates": {
                        "x": 980,
                        "y": 502
                    },
                    "selectors": [
                        {
                            "locator": "#btn-input_0",
                            "type": "id"
                        },
                        {
                            "locator": "[data-testid=\"btn-input_0\"]",
                            "type": "data-testid"
                        },
                        {
                            "locator": "//*[@data-testid='btn-input_0']",
                            "type": "xpath"
                        },
                        {
                            "locator": "inputSteps outline-none cursor-text border text-3xl text-center mx-0.5\n            } hover:border-primary-600 hover:border-2 focus:border-primary-600 focus:border-2 focus:shadow-3xl rounded-lg border-gray-300",
                            "type": "class"
                        },
                        {
                            "locator": "/html/body/div/div/div[2]/div/div/div[5]/div/input[6]",
                            "type": "xpath"
                        }
                    ],
                    "text": "",
                    "timeStamp": 17307.700000001118
                },
                "indexStep": 5
            },
            {
                "action": "click",
                "context": {
                    "origin": "https://auth.wp.blossombeta.com",
                    "titlePage": "Wasatch Peaks Credit Union - Auth",
                    "url": "https://auth.wp.blossombeta.com/sign-in?switch-profile=true&",
                    "window": {
                        "height": 1192,
                        "width": 2163
                    }
                },
                "data": {
                    "attributes": {
                        "aria-label": "no-label",
                        "class": "text-sm px-4 font-medium w-full border border-transparent bg-primary-600 text-white hover:bg-primary-700 px-2 py-2.5 rounded-lg focus:outline-none ",
                        "data-default": "defaultValue",
                        "data-testid": "btn-phone-verification-continue",
                        "id": "btn-zoomOut-button-phone-verification-continue",
                        "type": "button"
                    },
                    "coordinates": {
                        "x": 1068,
                        "y": 573
                    },
                    "selectors": [
                        {
                            "locator": "#btn-zoomOut-button-phone-verification-continue",
                            "type": "id"
                        },
                        {
                            "locator": "[data-testid=\"btn-phone-verification-continue\"]",
                            "type": "data-testid"
                        },
                        {
                            "locator": "//*[@data-testid='btn-phone-verification-continue']",
                            "type": "xpath"
                        },
                        {
                            "locator": "text-sm px-4 font-medium w-full border border-transparent bg-primary-600 text-white hover:bg-primary-700 px-2 py-2.5 rounded-lg focus:outline-none ",
                            "type": "class"
                        },
                        {
                            "locator": "/html/body/div/div/div[2]/div/div/div[5]/button",
                            "type": "xpath"
                        }
                    ],
                    "text": "Continue",
                    "timeStamp": 22401.599999999627
                },
                "indexStep": 6
            },
            {
                "action": "click",
                "context": {
                    "origin": "https://member.wp.blossombeta.com",
                    "titlePage": "Wasatch Peaks Credit Union - Member",
                    "url": "https://member.wp.blossombeta.com/",
                    "window": {
                        "height": 1192,
                        "width": 2163
                    }
                },
                "data": {
                    "attributes": {
                        "aria-label": "no-label",
                        "data-default": "defaultValue"
                    },
                    "coordinates": {
                        "x": 92,
                        "y": 202
                    },
                    "selectors": [
                        {
                            "locator": "/html/body/div/div/div[2]/div/div/div[2]/nav/ul/div[3]/li/a/div/p/span",
                            "type": "xpath"
                        }
                    ],
                    "text": "Move money",
                    "timeStamp": 11494.199999999255
                },
                "indexStep": 7
            },
            {
                "action": "click",
                "context": {
                    "origin": "https://member.wp.blossombeta.com",
                    "titlePage": "Wasatch Peaks Credit Union - Member",
                    "url": "https://member.wp.blossombeta.com/",
                    "window": {
                        "height": 1192,
                        "width": 2163
                    }
                },
                "data": {
                    "attributes": {
                        "aria-label": "no-label",
                        "class": "lg:text-sm text-base font-semibold BlossomHeading-Title overflow-hidden overflow-ellipsis text-gray-800 p-0 Body",
                        "data-default": "defaultValue"
                    },
                    "coordinates": {
                        "x": 657,
                        "y": 228
                    },
                    "selectors": [
                        {
                            "locator": "(//*[contains(text(),\"Transfer between your accounts\")])[1]",
                            "type": "xpath"
                        },
                        {
                            "locator": "lg:text-sm text-base font-semibold BlossomHeading-Title overflow-hidden overflow-ellipsis text-gray-800 p-0 Body",
                            "type": "class"
                        },
                        {
                            "locator": "/html/body/div[2]/div/div[2]/div/div[2]/div/div/div[2]/div/div[2]/div/div[2]/div/div/div[2]/div[2]/div/p",
                            "type": "xpath"
                        }
                    ],
                    "text": "Transfer between your accounts",
                    "timeStamp": 13332.300000000745
                },
                "indexStep": 8
            }
        ]
    },
    {
        id:"7",
        "name": "Transfer Extension",
        "module": "Transfer",
        "submodule": [
          "Internal Transfer"
        ],
        "tags": [
          "Regression"
        ],
        "contextGeneral": {
          "action": "navigate",
          "data": {
            "pageSize": {
              "height": 795,
              "width": 1669
            },
            "timestamp": "2025-02-14 08:40:12",
            "url": "https://member.wp.blossombeta.com/",
            "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36"
          }
        },
        "jsonSteps": [
            {
              "action": "change",
              "context": {
                "origin": "https://auth.wp.blossombeta.com",
                "titlePage": "Wasatch Peaks Credit Union - Auth",
                "url": "https://auth.wp.blossombeta.com/sign-in?switch-profile=true&redirect=https%3A%2F%2Fmember.wp.blossombeta.com&role=MEMBER",
                "window": {
                  "height": 1110,
                  "width": 1656
                }
              },
              "data": {
                "attributes": {
                  "aria-label": "Using your @you",
                  "autocomplete": "username",
                  "class": "customInputDate border focus:outline-none  undefined focus:ring-1 focus:ring-primary-600  bg-transparent p-1  w-full rounded-lg pl-8 pr-2 [object Object] py-2 text-sm color-blue placeholder-gray-500\t focus:border-transparent",
                  "data-default": "defaultValue",
                  "data-testid": "usernameInput",
                  "id": "usernameInput",
                  "placeholder": "Username",
                  "type": "text",
                  "value": "<UsernameInput>",
                  "width": "100"
                },
                "coordinates": {
                  "x": 0,
                  "y": 0
                },
                "selectors": [
                  {
                    "locator": "#usernameInput",
                    "type": "id"
                  },
                  {
                    "locator": "[data-testid=\"usernameInput\"]",
                    "type": "data-testid"
                  },
                  {
                    "locator": "//*[@data-testid='usernameInput']",
                    "type": "xpath"
                  },
                  {
                    "locator": "customInputDate border focus:outline-none  undefined focus:ring-1 focus:ring-primary-600  bg-transparent p-1  w-full rounded-lg pl-8 pr-2 [object Object] py-2 text-sm color-blue placeholder-gray-500\t focus:border-transparent",
                    "type": "class"
                  },
                  {
                    "locator": "/html/body/div/div/div/div[2]/div/div/div[3]/div/input",
                    "type": "xpath"
                  }
                ],
                "text": "",
                "timeStamp": 4211.5
              },
              "indexStep": 1
            },
            {
              "action": "click",
              "context": {
                "origin": "https://auth.wp.blossombeta.com",
                "titlePage": "Wasatch Peaks Credit Union - Auth",
                "url": "https://auth.wp.blossombeta.com/sign-in?switch-profile=true&redirect=https%3A%2F%2Fmember.wp.blossombeta.com&role=MEMBER",
                "window": {
                  "height": 1110,
                  "width": 1656
                }
              },
              "data": {
                "attributes": {
                  "aria-label": "Continue",
                  "class": "text-sm px-4 font-medium w-full border border-transparent bg-primary-600 text-white hover:bg-primary-700 px-2 py-2.5 rounded-lg focus:outline-none text-sm py-2.5 border-none justify-center items-center flex",
                  "data-default": "defaultValue",
                  "data-testid": "btn-sign-in-username",
                  "id": "btn-zoomOut-button-sign-in-username",
                  "type": "submit"
                },
                "coordinates": {
                  "x": 807,
                  "y": 531
                },
                "selectors": [
                  {
                    "locator": "#btn-zoomOut-button-sign-in-username",
                    "type": "id"
                  },
                  {
                    "locator": "[data-testid=\"btn-sign-in-username\"]",
                    "type": "data-testid"
                  },
                  {
                    "locator": "//*[@data-testid='btn-sign-in-username']",
                    "type": "xpath"
                  },
                  {
                    "locator": "text-sm px-4 font-medium w-full border border-transparent bg-primary-600 text-white hover:bg-primary-700 px-2 py-2.5 rounded-lg focus:outline-none text-sm py-2.5 border-none justify-center items-center flex",
                    "type": "class"
                  },
                  {
                    "locator": "/html/body/div/div/div/div[2]/div/div/div[4]/button",
                    "type": "xpath"
                  }
                ],
                "text": "Continue",
                "timeStamp": 5627.399999999907
              },
              "indexStep": 2
            },
            {
              "action": "change",
              "context": {
                "origin": "https://auth.wp.blossombeta.com",
                "titlePage": "Wasatch Peaks Credit Union - Auth",
                "url": "https://auth.wp.blossombeta.com/sign-in?switch-profile=true&redirect=https%3A%2F%2Fmember.wp.blossombeta.com&role=MEMBER",
                "window": {
                  "height": 1110,
                  "width": 1656
                }
              },
              "data": {
                "attributes": {
                  "aria-label": "password",
                  "class": "customInputDate border focus:outline-none  undefined focus:ring-1 focus:ring-primary-600  bg-transparent p-1  w-full rounded-lg pl-8 pr-9 [object Object] py-2 text-sm focus:border-transparent",
                  "data-default": "defaultValue",
                  "data-testid": "passwordInput",
                  "id": "passwordInput",
                  "name": "password",
                  "placeholder": "Your password",
                  "type": "password",
                  "value": "<PasswordInput>",
                  "width": "100"
                },
                "coordinates": {
                  "x": 0,
                  "y": 0
                },
                "selectors": [
                  {
                    "locator": "#passwordInput",
                    "type": "id"
                  },
                  {
                    "locator": "[data-testid=\"passwordInput\"]",
                    "type": "data-testid"
                  },
                  {
                    "locator": "//*[@data-testid='passwordInput']",
                    "type": "xpath"
                  },
                  {
                    "locator": "customInputDate border focus:outline-none  undefined focus:ring-1 focus:ring-primary-600  bg-transparent p-1  w-full rounded-lg pl-8 pr-9 [object Object] py-2 text-sm focus:border-transparent",
                    "type": "class"
                  },
                  {
                    "locator": "/html/body/div/div/div/div[2]/div/div/div[3]/form/div[2]/input",
                    "type": "xpath"
                  }
                ],
                "text": "",
                "timeStamp": 12025.299999999814
              },
              "indexStep": 3
            },
            {
              "action": "click",
              "context": {
                "origin": "https://auth.wp.blossombeta.com",
                "titlePage": "Wasatch Peaks Credit Union - Auth",
                "url": "https://auth.wp.blossombeta.com/sign-in?switch-profile=true&redirect=https%3A%2F%2Fmember.wp.blossombeta.com&role=MEMBER",
                "window": {
                  "height": 1110,
                  "width": 1656
                }
              },
              "data": {
                "attributes": {
                  "aria-label": "Sign in",
                  "class": "text-sm px-4 font-medium w-full border border-transparent bg-primary-600 text-white hover:bg-primary-700 px-2 py-2.5 rounded-lg focus:outline-none flex justify-center py-2 text-base text-center md:text-sm",
                  "data-default": "defaultValue",
                  "data-testid": "btn-sign-in-password",
                  "id": "btn-zoomOut-button-sign-in-password",
                  "type": "button"
                },
                "coordinates": {
                  "x": 842,
                  "y": 527
                },
                "selectors": [
                  {
                    "locator": "#btn-zoomOut-button-sign-in-password",
                    "type": "id"
                  },
                  {
                    "locator": "[data-testid=\"btn-sign-in-password\"]",
                    "type": "data-testid"
                  },
                  {
                    "locator": "//*[@data-testid='btn-sign-in-password']",
                    "type": "xpath"
                  },
                  {
                    "locator": "text-sm px-4 font-medium w-full border border-transparent bg-primary-600 text-white hover:bg-primary-700 px-2 py-2.5 rounded-lg focus:outline-none flex justify-center py-2 text-base text-center md:text-sm",
                    "type": "class"
                  },
                  {
                    "locator": "/html/body/div/div/div/div[2]/div/div/div[3]/div/button",
                    "type": "xpath"
                  }
                ],
                "text": "Sign in",
                "timeStamp": 12125.799999999814
              },
              "indexStep": 4
            },
            {
              "action": "OTP",
              "context": {
                "origin": "https://auth.wp.blossombeta.com",
                "titlePage": "Wasatch Peaks Credit Union - Auth",
                "url": "https://auth.wp.blossombeta.com/sign-in?switch-profile=true&redirect=https%3A%2F%2Fmember.wp.blossombeta.com&role=MEMBER",
                "window": {
                  "height": 1110,
                  "width": 1656
                }
              },
              "data": {
                "attributes": {
                  "aria-label": "no-label",
                  "class": "inputSteps outline-none cursor-text border text-3xl text-center mx-0.5\n            } hover:border-primary-600 hover:border-2 focus:border-primary-600 focus:border-2 focus:shadow-3xl rounded-lg border-gray-300",
                  "data-default": "defaultValue",
                  "data-testid": "btn-input_0",
                  "id": "btn-input_0",
                  "pattern": "[0-9]*",
                  "type": "text",
                  "value": ""
                },
                "coordinates": {
                  "x": 762,
                  "y": 462
                },
                "selectors": [
                  {
                    "locator": "#btn-input_0",
                    "type": "id"
                  },
                  {
                    "locator": "[data-testid=\"btn-input_0\"]",
                    "type": "data-testid"
                  },
                  {
                    "locator": "//*[@data-testid='btn-input_0']",
                    "type": "xpath"
                  },
                  {
                    "locator": "inputSteps outline-none cursor-text border text-3xl text-center mx-0.5\n            } hover:border-primary-600 hover:border-2 focus:border-primary-600 focus:border-2 focus:shadow-3xl rounded-lg border-gray-300",
                    "type": "class"
                  },
                  {
                    "locator": "/html/body/div/div/div[2]/div/div/div[3]/div/input",
                    "type": "xpath"
                  }
                ],
                "text": "",
                "timeStamp": 14615.799999999814
              },
              "indexStep": 5
            },
            {
              "action": "click",
              "context": {
                "origin": "https://auth.wp.blossombeta.com",
                "titlePage": "Wasatch Peaks Credit Union - Auth",
                "url": "https://auth.wp.blossombeta.com/sign-in?switch-profile=true&redirect=https%3A%2F%2Fmember.wp.blossombeta.com&role=MEMBER",
                "window": {
                  "height": 1110,
                  "width": 1656
                }
              },
              "data": {
                "attributes": {
                  "aria-label": "no-label",
                  "class": "text-sm px-4 font-medium w-full border border-transparent bg-primary-600 text-white hover:bg-primary-700 px-2 py-2.5 rounded-lg focus:outline-none ",
                  "data-default": "defaultValue",
                  "data-testid": "btn-phone-verification-continue",
                  "id": "btn-zoomOut-button-phone-verification-continue",
                  "type": "button"
                },
                "coordinates": {
                  "x": 896,
                  "y": 542
                },
                "selectors": [
                  {
                    "locator": "#btn-zoomOut-button-phone-verification-continue",
                    "type": "id"
                  },
                  {
                    "locator": "[data-testid=\"btn-phone-verification-continue\"]",
                    "type": "data-testid"
                  },
                  {
                    "locator": "//*[@data-testid='btn-phone-verification-continue']",
                    "type": "xpath"
                  },
                  {
                    "locator": "text-sm px-4 font-medium w-full border border-transparent bg-primary-600 text-white hover:bg-primary-700 px-2 py-2.5 rounded-lg focus:outline-none ",
                    "type": "class"
                  },
                  {
                    "locator": "/html/body/div/div/div[2]/div/div/div[4]/button",
                    "type": "xpath"
                  }
                ],
                "text": "Continue",
                "timeStamp": 20039.799999999814
              },
              "indexStep": 6
            },
            {
              "action": "click",
              "context": {
                "origin": "https://member.wp.blossombeta.com",
                "titlePage": "Wasatch Peaks Credit Union - Member",
                "url": "https://member.wp.blossombeta.com/",
                "window": {
                  "height": 1110,
                  "width": 1656
                }
              },
              "data": {
                "attributes": {
                  "aria-label": "no-label",
                  "data-default": "defaultValue"
                },
                "coordinates": {
                  "x": 110,
                  "y": 202
                },
                "selectors": [
                  {
                    "locator": "/html/body/div/div/div[2]/div/div/div[2]/nav/ul/div[3]/li/a/div/p/span",
                    "type": "xpath"
                  }
                ],
                "text": "Move money",
                "timeStamp": 10594.69999999972
              },
              "indexStep": 7
            },
            {
              "action": "click",
              "context": {
                "origin": "https://member.wp.blossombeta.com",
                "titlePage": "Wasatch Peaks Credit Union - Member",
                "url": "https://member.wp.blossombeta.com/",
                "window": {
                  "height": 1110,
                  "width": 1656
                }
              },
              "data": {
                "attributes": {
                  "aria-label": "no-label",
                  "class": "lg:text-sm text-base font-semibold BlossomHeading-Title overflow-hidden overflow-ellipsis text-gray-800 p-0 Body",
                  "data-default": "defaultValue"
                },
                "coordinates": {
                  "x": 560,
                  "y": 231
                },
                "selectors": [
                  {
                    "locator": "(//*[contains(text(),\"Transfer between your accounts\")])[1]",
                    "type": "xpath"
                  },
                  {
                    "locator": "lg:text-sm text-base font-semibold BlossomHeading-Title overflow-hidden overflow-ellipsis text-gray-800 p-0 Body",
                    "type": "class"
                  },
                  {
                    "locator": "/html/body/div/div/div[2]/div/div[2]/div/div/div[2]/div/div/div/div/div/div/div/div[2]/div/p",
                    "type": "xpath"
                  }
                ],
                "text": "Transfer between your accounts",
                "timeStamp": 13968.799999999814
              },
              "indexStep": 8
            },
            {
                "action":"wait",
                "value":5000,
                "indexStep": 9
            },
            {
              "action": "click",
              "context": {
                "origin": "https://member.wp.blossombeta.com",
                "titlePage": "Wasatch Peaks Credit Union - Member",
                "url": "https://member.wp.blossombeta.com/",
                "window": {
                  "height": 1110,
                  "width": 1656
                }
              },
              "data": {
                "attributes": {
                  "aria-label": "no-label",
                  "class": "BlossomListHeader-LabelContainer no flex flex-row justify-between items-center",
                  "data-default": "defaultValue"
                },
                "coordinates": {
                  "x": 495,
                  "y": 330
                },
                "selectors": [
                  {
                    "locator": "(//*[contains(text(),\"Select account\")])[1]",
                    "type": "xpath"
                  },
                  {
                    "locator": "BlossomListHeader-LabelContainer no flex flex-row justify-between items-center",
                    "type": "class"
                  },
                  {
                    "locator": "/html/body/div/div/div[2]/div[2]/main/div[2]/section/section/section/article/section/div/div/div/div/div",
                    "type": "xpath"
                  }
                ],
                "text": "Select account",
                "timeStamp": 17883
              },
              "indexStep": 10
            },
            {
              "action": "click",
              "context": {
                "origin": "https://member.wp.blossombeta.com",
                "titlePage": "Wasatch Peaks Credit Union - Member",
                "url": "https://member.wp.blossombeta.com/",
                "window": {
                  "height": 1110,
                  "width": 1656
                }
              },
              "data": {
                "attributes": {
                  "aria-label": "no-label",
                  "class": "DropdownItem-root cursor-pointer group hover:bg-gray-50 border-xl py-4 md:p-3 flex justify-between items-center text-gray-800 font-medium md:text-sm w-full rounded-xl outline-none",
                  "data-default": "defaultValue",
                  "tabindex": "-1"
                },
                "coordinates": {
                  "x": 459,
                  "y": 511
                },
                "selectors": [
                  {
                    "locator": '(//*[contains(text(),"SAVINGS ...897:1:00")])[1]',
                    "type": "xpath"
                  },
                  {
                    "locator": "DropdownItem-root cursor-pointer group hover:bg-gray-50 border-xl py-4 md:p-3 flex justify-between items-center text-gray-800 font-medium md:text-sm w-full rounded-xl outline-none",
                    "type": "class"
                  },
                  {
                    "locator": "/html/body/div[4]/div/div/div/div/div/div[3]/div/div[2]",
                    "type": "xpath"
                  }
                ],
                "text": "SAVINGS ...897:1:00\n\n$1,639.86 Available",
                "timeStamp": 19501.299999999814
              },
              "indexStep": 11
            },
            {
                "action":"wait",
                "value":5000,
                "indexStep": 12
            },
            {
              "action": "click",
              "context": {
                "origin": "https://member.wp.blossombeta.com",
                "titlePage": "Wasatch Peaks Credit Union - Member",
                "url": "https://member.wp.blossombeta.com/",
                "window": {
                  "height": 1110,
                  "width": 1656
                }
              },
              "data": {
                "attributes": {
                  "aria-label": "no-label",
                  "class": "BlossomListHeader-LabelContainer no flex flex-row justify-between items-center",
                  "data-default": "defaultValue"
                },
                "coordinates": {
                  "x": 540,
                  "y": 530
                },
                "selectors": [
                  {
                    "locator": "(//*[contains(text(),\"Select account\")])[1]",
                    "type": "xpath"
                  },
                  {
                    "locator": "BlossomListHeader-LabelContainer no flex flex-row justify-between items-center",
                    "type": "class"
                  },
                  {
                    "locator": "/html/body/div/div/div[2]/div[2]/main/div[2]/section/section/section/article/section/div[3]/div/div/div/div",
                    "type": "xpath"
                  }
                ],
                "text": "Select account",
                "timeStamp": 21749.100000000093
              },
              "indexStep": 13
            },
            {
              "action": "click",
              "context": {
                "origin": "https://member.wp.blossombeta.com",
                "titlePage": "Wasatch Peaks Credit Union - Member",
                "url": "https://member.wp.blossombeta.com/",
                "window": {
                  "height": 1110,
                  "width": 1656
                }
              },
              "data": {
                "attributes": {
                  "aria-label": "no-label",
                  "class": "DropdownItem-root cursor-pointer group hover:bg-gray-50 border-xl py-4 md:p-3 flex justify-between items-center text-gray-800 font-medium md:text-sm w-full rounded-xl outline-none",
                  "data-default": "defaultValue",
                  "tabindex": "-1"
                },
                "coordinates": {
                  "x": 439,
                  "y": 237
                },
                "selectors": [
                  {
                    "locator": '(//*[contains(text(),"SAVINGS ...897:1:01")])[1]',
                    "type": "xpath"
                  },
                  {
                    "locator": "DropdownItem-root cursor-pointer group hover:bg-gray-50 border-xl py-4 md:p-3 flex justify-between items-center text-gray-800 font-medium md:text-sm w-full rounded-xl outline-none",
                    "type": "class"
                  },
                  {
                    "locator": "/html/body/div[3]/div/div/div/div/div/div[3]/div/div[2]",
                    "type": "xpath"
                  }
                ],
                "text": "SAVINGS ...897:1:01\n\n$35.71 Available",
                "timeStamp": 23987.299999999814
              },
              "indexStep": 14
            },
            {
              "action": "change",
              "context": {
                "origin": "https://member.wp.blossombeta.com",
                "titlePage": "Wasatch Peaks Credit Union - Member",
                "url": "https://member.wp.blossombeta.com/",
                "window": {
                  "height": 1110,
                  "width": 1656
                }
              },
              "data": {
                "attributes": {
                  "aria-label": "no-label",
                  "autocomplete": "off",
                  "class": "BlossomBigInputAmount-Input min-w-10 shrink focus:outline-none w-full bg-transparent font-semibold placeholder-gray-500 text-gray-800 md:text-center lg:text-left",
                  "data-default": "defaultValue",
                  "inputmode": "decimal",
                  "name": "amount",
                  "placeholder": "0",
                  "style": "",
                  "type": "text",
                  "value": "<0>"
                },
                "coordinates": {
                  "x": 0,
                  "y": 0
                },
                "selectors": [
                  {
                    "locator": "//*[@class=\"BlossomBigInputAmount-Input min-w-10 shrink focus:outline-none w-full bg-transparent font-semibold placeholder-gray-500 text-gray-800 md:text-center lg:text-left\"]",
                    "type": "xpath"
                  },
                  {
                    "locator": "BlossomBigInputAmount-Input min-w-10 shrink focus:outline-none w-full bg-transparent font-semibold placeholder-gray-500 text-gray-800 md:text-center lg:text-left",
                    "type": "class"
                  },
                  {
                    "locator": "/html/body/div/div/div[2]/div[2]/main/div[2]/section/section/section/article/div/div/div/input",
                    "type": "xpath"
                  }
                ],
                "text": "",
                "timeStamp": 36125.299999999814
              },
              "indexStep": 15
            },
            {
              "action": "click",
              "context": {
                "origin": "https://member.wp.blossombeta.com",
                "titlePage": "Wasatch Peaks Credit Union - Member",
                "url": "https://member.wp.blossombeta.com/",
                "window": {
                  "height": 1110,
                  "width": 1656
                }
              },
              "data": {
                "attributes": {
                  "aria-label": "no-label",
                  "class": "lg:text-sm text-base font-semibold BlossomButton-Label text-white body Body",
                  "data-default": "defaultValue"
                },
                "coordinates": {
                  "x": 368,
                  "y": 623
                },
                "selectors": [
                  {
                    "locator": '(//button/p[contains(text(),"Transfer")])[1]',
                    "type": "xpath"
                  },
                  {
                    "locator": "lg:text-sm text-base font-semibold BlossomButton-Label text-white body Body",
                    "type": "class"
                  },
                  {
                    "locator": "/html/body/div/div/div[2]/div[2]/main/div[2]/section/section/section/section/div/button[2]/p",
                    "type": "xpath"
                  }
                ],
                "text": "Transfer",
                "timeStamp": 36205.19999999972
              },
              "indexStep": 16
            },
            {
              "action": "click",
              "context": {
                "origin": "https://member.wp.blossombeta.com",
                "titlePage": "Wasatch Peaks Credit Union - Member",
                "url": "https://member.wp.blossombeta.com/",
                "window": {
                  "height": 1110,
                  "width": 1656
                }
              },
              "data": {
                "attributes": {
                  "aria-label": "no-label",
                  "class": "lg:text-sm text-base font-semibold BlossomButton-Label text-white body Body",
                  "data-default": "defaultValue"
                },
                "coordinates": {
                  "x": 403,
                  "y": 594
                },
                "selectors": [
                  {
                    "locator": "(//*[contains(text(),\"Transfer $0.02\")])[1]",
                    "type": "xpath"
                  },
                  {
                    "locator": "lg:text-sm text-base font-semibold BlossomButton-Label text-white body Body",
                    "type": "class"
                  },
                  {
                    "locator": "/html/body/div/div/div[2]/main/div[2]/section/section/section/div[2]/button/p",
                    "type": "xpath"
                  }
                ],
                "text": "Transfer $0.02",
                "timeStamp": 39209.299999999814
              },
              "indexStep": 17
            }
          ]
      }
];