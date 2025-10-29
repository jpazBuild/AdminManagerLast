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
  setValue?: any;
  className?: string;
  defaultValue?: string;
  isDarkMode?: boolean;
};

const TabsUnderline = ({ tabs, value, setValue, className, defaultValue,isDarkMode }: TabsUnderlineProps) => {
  const initial = defaultValue ?? tabs[0]?.value ?? "";

  return (
    <div className={`w-full h-full overflow-hidden ${className ?? ""}`}>
      <Tabs value={value} onValueChange={setValue} className="gap-4 w-full h-full">
        <TabsList defaultValue={value === undefined ? initial : undefined}
          className={`w-full flex justify-start rounded-none border-b ${isDarkMode ? "border-gray-600":"border-primary/20"} p-0 sticky top-0 bg-transparent z-10 h-12`}>
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className={`data-[state=active]:border-primary-blue font-semibold flex gap-1 items-center dark:data-[state=active]:border-primary-blue h-full rounded-none border-0 border-b-2 ${isDarkMode ? "border-transparent":"border-transparent"} data-[state=active]:shadow-none`}
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
