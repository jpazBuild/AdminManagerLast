import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type TabItem = {
  name: string;
  value: string;
  icon?: React.ReactNode;
  content: React.ReactNode;
};

type TabsUnderlineProps = {
  tabs: TabItem[];
  value?: string;
  setValue?: (value: string) => void;
  className?: string;
  defaultValue?: string;
};

const TabsUnderline = ({ tabs, value, setValue, className, defaultValue }: TabsUnderlineProps) => {
  const initial = defaultValue ?? tabs[0]?.value ?? "";

  return (
    <div className={`w-full h-full overflow-hidden ${className ?? ""}`}>
      <Tabs value={value} onValueChange={setValue} className="gap-4 w-full h-full">
        <TabsList defaultValue={value === undefined ? initial : undefined}
          className="w-full flex justify-start rounded-none border-b border-primary/20 p-0 sticky top-0 bg-white z-10 h-12">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="data-[state=active]:border-primary-blue flex gap-1 items-center dark:data-[state=active]:border-primary-blue h-full rounded-none border-0 border-b-2 border-transparent data-[state=active]:shadow-none"
            >
              {tab.icon} {tab.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="w-full overflow-auto h-full p-4">
            <div className="w-full h-full overflow-auto">{tab.content}</div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default TabsUnderline;
