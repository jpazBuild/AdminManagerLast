import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

type TabsUnderlineDemoProps = {
    tabs?: {
        name: string;
        value: string;
        icon?: React.ReactNode;
        content: React.ReactNode;
    }[];
    defaultValue?: string;
};

const TabsUnderline = ({tabs,defaultValue}:TabsUnderlineDemoProps) => {
  return (
    <div className='w-full overflow-hidden '>
      <Tabs defaultValue={`${defaultValue}`} className='gap-4 w-full h-full '>
        <TabsList className='w-full flex justify-start rounded-none border-b border-primary/20 p-0 sticky top-0 bg-white z-10 h-12'>
          {tabs?.map(tab => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className=' data-[state=active]:border-primary-blue flex gap-1 items-center dark:data-[state=active]:border-primary-blue h-full rounded-none border-0 border-b-2 border-transparent data-[state=active]:shadow-none'
            >
              {tab.icon} {tab.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs?.map(tab => (
          <TabsContent key={tab.value} value={tab.value} className='w-full'>
            <div className={` w-full`}>{tab.content}</div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

export default TabsUnderline


