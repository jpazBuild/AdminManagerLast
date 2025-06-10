"use client";
import React, { useEffect, useState } from "react";
import { Dialog } from "@headlessui/react";
import { URL_API_ALB } from "@/config";
import { DashboardHeader } from "../Layouts/main";
import { Clock } from "lucide-react";
import { FaXmark } from "react-icons/fa6";

type Event = {
  indexStep: number;
  action: string;
  description: string;
  status: string;
  screenshot: string;
  metadata?: {
    isHeadless?: boolean;
  };
  isConditional?: boolean;
  time: string;
};

const Reports = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(false);

  
  useEffect(() => {
    const url = `${String(URL_API_ALB)}getReports`;

    const fetchReport = async () => {
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            testCaseId: "19e9c7b7-4b2d-4b86-8925-220de1e7ae0a",
          }),
        });

        const reportUrl = await response.text();
        const reportResponse = await fetch(reportUrl);
        const reportData = await reportResponse.json();

        const firstReport = reportData?.reports?.[0];
        if (firstReport?.events) {
          setEvents(firstReport.events);
        } else {
          setError("No se encontraron eventos en el reporte.");
        }
      } catch (err) {
        setError("Error al obtener el reporte.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, []);

  const handleToggleDarkMode = (darkMode: boolean) => {
    setDarkMode(darkMode);
  };
  const statusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-primary border-green-300 border-l-4 border-2";
      case "failed":
        return "text-red-600 border-red-300 border-l-4 border-2";
      case "processing":
        return "text-yellow-600 border-yellow-300 border-l-4 border-2";
      default:
        return "text-gray-600 border-gray-300 border-l-4 border-2";
    }
  };


  return (
    <DashboardHeader onToggleDarkMode={handleToggleDarkMode}>
      <div className="p-6 max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-800">Reporte de Ejecución</h1>

        {loading && <p className="text-gray-500">Cargando reporte...</p>}
        {error && <p className="text-red-500">{error}</p>}

        <div className="space-y-6">
          {!loading &&
            !error &&
            events.map((ev, index) => (
              <div
                key={index}
                className={`relative border-l-4 p-4 rounded-md shadow-sm transition ${statusColor(
                  ev.status
                )}`}
              >
                <div className="flex justify-between flex-col items-start">
                  <div className="flex-1">
                    <div className="absolute top-0 left-0 bg-primary text-white px-3 py-1 text-sm font-semibold rounded-tl-xl rounded-br-full shadow-md">
                      Step {index}
                    </div>
                    <h2 className="text-md text-primary mt-6 font-semibold break-words max-w-full">
                      {ev.action}
                    </h2>
                    <p className="text-xs text-gray-700 mt-1">{ev.description}</p>
                    <div className="mt-2 text-sm text-gray-500 flex gap-6 flex-wrap">
                      {ev.isConditional && <span>🔀 Paso condicional</span>}
                    </div>
                    <div className="absolute top-2 right-2 flex items-center text-primary/90 text-sm">
                      <Clock className="w-4 h-4 mr-1" />
                      {ev.time} s
                    </div>
                  </div>

                  {ev.screenshot && (
                    <img
                      src={
                        ev.screenshot.startsWith("data:image")
                          ? ev.screenshot
                          : `data:image/png;base64,${ev.screenshot}`
                      }
                      alt={`step-${ev.indexStep}`}
                      className="w-28 h-auto ml-4 rounded border self-center cursor-pointer hover:scale-105 transition"
                      onClick={() =>
                        setModalImage(
                          ev.screenshot.startsWith("data:image")
                            ? ev.screenshot
                            : `data:image/png;base64,${ev.screenshot}`
                        )
                      }
                    />
                  )}
                </div>
              </div>
            ))}
        </div>

        <Dialog open={!!modalImage} onClose={() => setModalImage(null)} className="relative z-50">
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4">
            <Dialog.Panel className="bg-white rounded-lg shadow-xl p-4 max-w-4xl w-full relative">
              <Dialog.Title className="text-lg font-semibold align-middle">Screenshot</Dialog.Title>
              <img src={modalImage!} alt="modal screenshot" className="max-w-full h-auto" />
              <button
                onClick={() => setModalImage(null)}
                className=" px-4 py-2 text-primary top-0 right-2 absolute"
              >
                <FaXmark className="text-2xl" />
              </button>
            </Dialog.Panel>
          </div>
        </Dialog>
      </div>
    </DashboardHeader>
  );
};

export default Reports;
