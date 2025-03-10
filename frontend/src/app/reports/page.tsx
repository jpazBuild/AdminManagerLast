"use client"
import { useEffect, useState } from "react";
import { Dashboard } from "../Layouts/dashboard"
import Image from "next/image";
import { Progress } from "../../components/ui/progress";

const jsonSteps = [
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


const Reports = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [report, setReport] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  const handleToggleDarkMode = (darkMode: boolean) => {
    setDarkMode(darkMode);
  };

  const handleImageClick = (image: string) => {
    setSelectedImage(image);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedImage("");
  };
  const handleStepClick = (index: number) => {
    setExpandedStep(expandedStep === index ? null : index);
  };

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const response = await fetch('http://localhost:4000/execute-test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            isHeadless: true,
            testData: {
              username: "qauser",
              password: "Secret1234*",
              amount: "0.01"
            },
            dataScenario: {
              contextGeneral: {
                data: { url: "https://auth.wp.blossombeta.com/sign-in" }
              },
              jsonSteps
            }
          })
        });

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (reader) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          const events = buffer.split("\n\n");
          buffer = events.pop() || "";

          for (const event of events) {
            if (event.startsWith("data: ")) {
              try {
                const jsonData = JSON.parse(event.slice(6));
                setReport((prev: any) => [...prev, jsonData]);



              } catch (error) {
                console.error("Error al parsear JSON:", error, event);
              }
            }
          }
        }
      } catch (error: any) {
        setError(`Error fetching report: ${error.message}`);
        console.error("Error fetching report:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, []);




  useEffect(() => {
    if (!isModalOpen) return;

    const handleOutsideClick = (event: MouseEvent) => {
      const modal = document.getElementById("image-modal");
      if (modal && !modal.contains(event.target as Node)) {
        handleCloseModal();
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isModalOpen]);


  if (error) {
    return (
      <Dashboard onToggleDarkMode={handleToggleDarkMode}>
        <h2 className="text-center mt-3">Failed to load the report.</h2>
        <p>{error}</p>
      </Dashboard>
    );
  }

  if (!report) {
    return (
      <Dashboard onToggleDarkMode={handleToggleDarkMode}>
        <h2 className="text-center mt-3">No report found.</h2>
      </Dashboard>
    );
  }
  const groupedSteps = report.reduce((acc: any, step: any) => {
    if (!acc[step.indexStep]) {
      acc[step.indexStep] = [];
    }
    acc[step.indexStep].push(step);
    return acc;
  }, {});

  const totalSteps = jsonSteps.length + 2;
  const completedCount = Object.entries(groupedSteps).reduce((count, [indexStep, steps]: any) => {
    const latestStep = steps[steps.length - 1];
    return latestStep["status"].toLowerCase() === "completed" ? count + 1 : count;
  }, 0);
  
  
  const progressValue = Math.round((completedCount / totalSteps) * 100);

  return (
    <Dashboard onToggleDarkMode={handleToggleDarkMode}>
      <div className="lg:left-1/4 lg:relative lg:w-3/4 w-full p-6 shadow-md rounded-lg">
        <h2 className="mt-3 text-2xl font-semibold">Reports Saved</h2>
        <div className="mt-4">
          <h3 className="text-xl font-medium mb-4">Steps:</h3>
          <div className="mb-4">
            <Progress value={progressValue} />
          </div>
          <div className="flex flex-col gap-4 p-2">
            {Object.entries(groupedSteps).map(([indexStep, steps]: any) => {
              const latestStep = steps[steps.length - 1];

              const isStepSuccess = latestStep.status.toLowerCase() === "completed";
              const isStepError = latestStep.status.toLowerCase() === "failed";
              const isProcessing = latestStep.status.toLowerCase() === "processing";
            
              return (
                <div
                  key={indexStep}
                  className={`p-4 rounded-lg shadow-md transition-all ${darkMode ? "text-[#021d3d]" : ""
                    } ${isStepSuccess
                      ? "border-green-500 bg-green-100"
                      : isStepError
                        ? "border-red-500 bg-red-100"
                        : isProcessing
                          ? "border-yellow-500 bg-yellow-100"
                          : "border-gray-300"
                    }`}
                >
                  <strong className="text-lg">
                    Paso {indexStep}: {latestStep.description || latestStep.step}
                  </strong>
                  <p className="text-sm mt-2">
                    <strong>Status:</strong> {latestStep.status}
                  </p>
                 
                  {latestStep.result && (
                    <p className="text-sm">
                      <strong>Result:</strong> {latestStep.result}
                    </p>
                  )}
                  {latestStep.action && (
                    <p className="text-sm">
                      <strong>Action:</strong> {latestStep.action}
                    </p>
                  )}

                  {latestStep.screenshot && (
                    <div className="flex justify-center mt-4">
                      <div
                        className="cursor-pointer"
                        onClick={() =>
                          handleImageClick(
                            `data:image/png;base64,${latestStep.screenshot}`
                          )
                        }
                      >
                        <Image
                          src={`data:image/png;base64,${latestStep.screenshot}`}
                          alt="Step screenshot"
                          width={256}
                          height={256}
                          className="rounded-lg object-cover"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div
          className="fixed inset-0 bg-[#021d3d] bg-opacity-75 flex justify-center items-center z-50"
          onClick={handleCloseModal}
        >
          <div
            id="image-modal"
            className="relative bg-white p-4 rounded-md"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleCloseModal}
              className="absolute top-2 right-2 text-gray-600 text-3xl font-bold"
            >
              ×
            </button>
            <Image
              src={selectedImage}
              alt="Step screenshot"
              width={800}
              height={800}
              className="rounded-md"
            />
          </div>
        </div>
      )}
    </Dashboard>
  );

};

export default Reports;
