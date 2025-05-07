import { useState } from "react";
import { Settings } from "lucide-react";
import { SelectField } from "./SelectField";

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

  const browserOptions = Array.from({ length: 10 }, (_, i) => ({
    value: String(i + 1),
    label: String(i + 1),
  }));
  return (
    <div className="p-4 border rounded-lg shadow-lg bg-white">
      <h2 className="text-lg font-semibold mb-4 text-primary/70 flex justify-between">Settings Tests <Settings/></h2>
      <div className="mb-6">
      <SelectField
        label="Max number of Browsers:"
        value={String(browserLimit)}
        onChange={handleBrowserLimitChange}
        options={browserOptions}
        placeholder="Select number of browsers"
      />
      </div>
    </div>
  );
};

export default TestSettings;
