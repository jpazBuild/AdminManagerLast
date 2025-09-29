"use client";
import { DashboardHeader } from "../Layouts/main";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function EnvironmentsPage() {
  return (
    <DashboardHeader>
      <div className="flex min-h-screen text-primary">
        {/* Sidebar */}
        <aside className="bg-white min-h-screen sticky top-0 w-96">
          <div className="p-4">
            <Tabs defaultValue="environments" className="w-full pt-2">
              <TabsList className="grid grid-cols-2 mb-2 text-primary/80">
                <TabsTrigger value="environments">Environments</TabsTrigger>
                <TabsTrigger value="teams">Teams</TabsTrigger>
              </TabsList>
              <TabsContent value="environments">
                {/* Placeholder for environments list */}
                <div className="h-96 flex items-center justify-center text-muted-foreground">
                  Lista de Environments
                </div>
              </TabsContent>
              <TabsContent value="teams">
                {/* Placeholder for teams list */}
                <div className="h-96 flex items-center justify-center text-muted-foreground">
                  Lista de Teams
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </aside>
        {/* Divider */}
        <span className="w-1 bg-gray-200 mx-2 my-8 block" style={{ minWidth: '2px', height: 'calc(100vh - 64px)' }} />
        {/* Main Section */}
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-primary">Gestión de Environments</h1>
            <Button className="text-white cursor-pointer">Nuevo Environment</Button>
          </div>
          <Tabs defaultValue="details">
            <TabsList className="mb-4">
              <TabsTrigger value="details">Detalles</TabsTrigger>
              <TabsTrigger value="variables">Variables</TabsTrigger>
              <TabsTrigger value="history">Historial</TabsTrigger>
            </TabsList>
            <TabsContent value="details">
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                Detalles del Environment
              </div>
            </TabsContent>
            <TabsContent value="variables">
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                Variables del Environment
              </div>
            </TabsContent>
            <TabsContent value="history">
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                Historial de cambios
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </DashboardHeader>
  );
}
