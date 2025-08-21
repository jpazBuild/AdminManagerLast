import CopyToClipboard from "./CopyToClipboard";
import DeleteButton from "./DeleteButton";
import ExpandablePanel from "./ExpandablePanel";
import TextInputWithClearButton from "./InputClear";

type KeyValueEditorProps = {
  entries: [string, any][];
  onDelete: (key: string, idx: number, val: any) => void;
  onChange: (key: string, newValue: any, idx: number, val: any) => void;
  keyLabel?: (key: string) => string;
  valueLabel?: (val: any) => string;
  placeholder?: (key: string) => string;
  getId?: (key: string, idx: number) => string | number;
  typeLabel?: string;
  level?: number;
};

const KeyValueEditor = ({
  entries,
  onDelete,
  onChange,
  keyLabel = (key) => key,
  valueLabel = (val) => String(val),
  placeholder = (key) => key,
  getId = (key, idx) => key,
  typeLabel = undefined,
  level = 0
}: KeyValueEditorProps) => {
  return (
    <div className={`flex flex-col gap-2 ${level > 0 ? "ml-4 border-l pl-4" : ""}`}>
      {entries.map(([key, val], idx) => {
        const isArrayOfObjects = Array.isArray(val) && val.length && typeof val[0] === "object";
        const isObject = val && typeof val === "object" && !Array.isArray(val);

        if (isArrayOfObjects) {
          // ej: selectors
          return (
            <ExpandablePanel
              key={getId(key, idx)}
              title={key.charAt(0).toUpperCase() + key.slice(1)}
              panelKey={key}
              openPanels={{}}
              togglePanel={() => {}}
            >
              <div className="flex flex-col gap-2">
                {val.map((item, i) => (
                  <div key={i} className="flex flex-col items-center gap-2 mb-2">
                    <div className="flex items-center justify-between w-full gap-1">
                      <span className="text-xs text-primary/80">{item.type ?? `Item ${i + 1}`}</span>
                      <div className="flex items-center gap-2">
                        <CopyToClipboard text={item.locator} isDarkMode={false}/>
                        <DeleteButton onClick={() => {
                          const updatedArr = val.filter((_, idx2) => idx2 !== i);
                          onChange(key, updatedArr, idx, val);
                        }}/>
                      </div>
                    </div>
                    <TextInputWithClearButton
                      id={item.locator}
                      value={item.locator}
                      onChangeHandler={e => {
                        const updatedArr = [...val];
                        updatedArr[i] = { ...updatedArr[i], locator: e.target.value };
                        onChange(key, updatedArr, idx, val);
                      }}
                      placeholder="Locator"
                      label="Enter locator"
                    />
                  </div>
                ))}
              </div>
            </ExpandablePanel>
          );
        }
        if (isObject) {
          return (
            <ExpandablePanel
              key={getId(key, idx)}
              title={key.charAt(0).toUpperCase() + key.slice(1)}
              panelKey={key}
              openPanels={{}}
              togglePanel={() => {}}
            >
              <KeyValueEditor
                entries={Object.entries(val)}
                onDelete={(childKey) => {
                  const updated = { ...val };
                  delete updated[childKey];
                  onChange(key, updated, idx, val);
                }}
                onChange={(childKey, newValue) => {
                  onChange(key, { ...val, [childKey]: newValue }, idx, val);
                }}
                level={level + 1}
              />
            </ExpandablePanel>
          );
        }
        return (
          <div key={getId(key, idx)} className="flex flex-col items-center gap-2 mb-2">
            <div className="flex items-center justify-between w-full gap-1">
              <span className="text-xs text-primary/80">{keyLabel(key)}:</span>
              <div className="flex items-center gap-2">
                <CopyToClipboard text={valueLabel(val)} isDarkMode={false}/>
                <DeleteButton onClick={() => onDelete(key, idx, val)} />
              </div>
            </div>
            <TextInputWithClearButton
              id={String(getId(key, idx))}
              value={valueLabel(val)}
              label={`Enter value for ${keyLabel(key)}`}
              onChangeHandler={e => onChange(key, e.target.value, idx, val)}
              placeholder={placeholder(key)}

            />
          </div>
        );
      })}
    </div>
  );
}

export default KeyValueEditor;