import { useState } from "react";
import { Search, Settings } from "lucide-react";
import { SelectField } from "../../components/SelectField";
import { SearchField } from "../../components/SearchField";

interface TestSettingsProps {
  onBrowserLimitChange: (value: number) => void;
  onHeadlessChange: (value: boolean) => void;
  isDarkMode?: boolean;
}

const TestSettings = ({ onBrowserLimitChange, onHeadlessChange,isDarkMode }: TestSettingsProps) => {
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

  const browserOptions = Array.from({ length: 10 }, (_, i) => ({
    value: String(i + 1),
    label: String(i + 1),
  }));

  return (
    <div className={`p-4 border  rounded-lg shadow-lg ${isDarkMode ? "bg-gray-700 text-white":"bg-white border-primary/30 text-primary/70"} `}>
      <h2 className="text-lg font-semibold mb-4 flex justify-between">Settings Tests <Settings/></h2>
      <div className="mb-6">
      <SearchField 
        label="Max number of Browsers:"
        value={String(browserLimit) }
        onChange={handleBrowserLimitChange}
        options={browserOptions}
        placeholder="Select number of browsers"
        darkMode={isDarkMode}
      />
      </div>
    </div>
  );
};

export default TestSettings;