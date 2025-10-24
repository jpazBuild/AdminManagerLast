// import React from "react";
// import type { IterBlock, Row } from "../types";
// import VariablesList from "./VariablesList";
// import { PlusIcon } from "lucide-react";

// type Props = {
//   blocks: IterBlock[];
//   onAddRow: (iterId: string) => void;
//   onRemoveRow: (iterId: string, rowId: string) => void;
//   onUpdateRow: (iterId: string, rowId: string, patch: Partial<Row>) => void;
//   onAddIteration: () => void;
// };

// const IterationsList: React.FC<Props> = ({
//   blocks,
//   onAddRow,
//   onRemoveRow,
//   onUpdateRow,
//   onAddIteration,
// }) => {
//   return (
//     <div className="flex flex-col gap-6">
//       {blocks.map((b, i) => (
//         <div key={b.id} className="rounded-xl border border-[#E6ECF3] p-4">
//           <div className="flex items-center justify-between mb-3">
//             <h3 className="text-sm font-semibold text-[#0A2342]">{b.label}</h3>
//           </div>

//           <VariablesList
//             rows={b.rows}
//             onUpdate={(rowId, patch) => onUpdateRow(b.id, rowId, patch)}
//             onRemove={(rowId) => onRemoveRow(b.id, rowId)}
//             onAdd={() => onAddRow(b.id)}
//           />
//         </div>
//       ))}

//       <div>
//         <button
//           onClick={onAddIteration}
//           className="mt-2 text-sm cursor-pointer px-4 py-2 rounded-full bg-primary/90 text-white hover:bg-primary/95 flex items-center gap-2"
//         >
//           <PlusIcon className="w-5 h-5"/> Add iteration
//         </button>
//       </div>
//     </div>
//   );
// };

// export default IterationsList;


"use client";

import React from "react";
import { PlusIcon } from "lucide-react";
import VariablesList, { Row } from "./VariablesList";

export type IterBlock = {
  id: string;            // id del bloque (iteration)
  label: string;         // "Iteration 1", "Iteration 2", ...
  rows: Row[];           // pares variable/value de esa iteración
};

type Props = {
  blocks: IterBlock[];
  onAddRow: (iterId: string) => void;
  onRemoveRow: (iterId: string, rowId: string) => void;
  onUpdateRow: (iterId: string, rowId: string, patch: Partial<Row>) => void;
  onAddIteration: () => void;
};

const IterationsList: React.FC<Props> = ({
  blocks,
  onAddRow,
  onRemoveRow,
  onUpdateRow,
  onAddIteration,
}) => {
  return (
    <div className="flex flex-col gap-6">
      {blocks.map((b) => (
        <div key={b.id} className="rounded-xl border border-[#E6ECF3] p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-[#0A2342]">{b.label}</h3>
          </div>

          <VariablesList
            rows={b.rows}
            onUpdate={(rowId, patch) => onUpdateRow(b.id, rowId, patch)}
            onRemove={(rowId) => onRemoveRow(b.id, rowId)}
            onAdd={() => onAddRow(b.id)}
          />
        </div>
      ))}

      <div>
        <button
          onClick={onAddIteration}
          className="mt-2 text-sm cursor-pointer px-4 py-2 rounded-full bg-primary/90 text-white hover:bg-primary/95 flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5" />
          Add iteration
        </button>
      </div>
    </div>
  );
};

export default IterationsList;
