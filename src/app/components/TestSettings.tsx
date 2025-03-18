import { useState } from "react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../../components/ui/select";
import { Switch } from "../../components/ui/switch";
import { Settings } from "lucide-react";

interface TestSettingsProps {
  onBrowserLimitChange: (value: number) => void;
  onHeadlessChange: (value: boolean) => void;
}

const TestSettings = ({ onBrowserLimitChange, onHeadlessChange }: TestSettingsProps) => {
  const [browserLimit, setBrowserLimit] = useState(1);
  const [headless, setHeadless] = useState(true);

  const handleBrowserLimitChange = (value: string) => {
    const numberValue = Number(value);
    setBrowserLimit(numberValue);
    onBrowserLimitChange(numberValue);
  };

  const handleHeadlessChange = (value: boolean) => {
    setHeadless(value);
    onHeadlessChange(value);
  };

  return (
    <div className="p-4 border rounded-lg shadow-lg bg-white">
      <h2 className="text-lg font-semibold mb-4 text-gray-800 flex justify-between">Settings Tests <Settings/></h2>
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Max number of Browsers:
        </label>
        <Select value={String(browserLimit)} onValueChange={handleBrowserLimitChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select number of browsers" />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 10 }, (_, i) => (
              <SelectItem key={i} value={String(i + 1)}>
                {i + 1}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default TestSettings;
