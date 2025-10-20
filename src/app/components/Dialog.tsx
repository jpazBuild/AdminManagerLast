// import { Dialog, DialogContent } from "@/components/ui/dialog";
// import { Button } from "@headlessui/react";
// import { AiOutlineClose } from "react-icons/ai";

// type DialogUIProps = {
//     isOpen: boolean;
//     handleAccordionToggle: () => void;
//     title?: any;
//     children?: React.ReactNode;
//     heigth?: string;
//     width?: string;
// }

// const DialogUI = ({ isOpen, handleAccordionToggle, title, children,heigth="h-full min-h-[70vh]",width="w-full" }: DialogUIProps) => {

//     return (
//         <Dialog
//             open={isOpen}
//         >
//             <DialogContent className={`${width} ${heigth} overflow-hidden bg-white flex flex-col`}>
//                 <div className="h-full w-full rounded-lg shadow-2xl flex flex-col z-10">
//                     <div className="sticky top-0 flex flex-col items-center justify-between px-6 py-4 w-full h-full bg-white z-50 border-b border-gray-200 rounded-t-lg flex-shrink-0">
//                         <div className="flex items-center gap-4 justify-between w-full">
//                             <h2 className="text-lg font-semibold text-primary/80">{title}</h2>
//                             <button
//                                 onClick={handleAccordionToggle}
//                                 className="text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-full p-1"
//                             >
//                                 <AiOutlineClose className="h-6 w-6" />
//                             </button>
//                         </div>

//                         {children}
//                     </div>
//                 </div>
//             </DialogContent>
//         </Dialog>
//     )
// }

// export default DialogUI;


// DialogUI.tsx
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AiOutlineClose } from "react-icons/ai";

type DialogUIProps = {
  isOpen: boolean;
  handleAccordionToggle: () => void;
  title?: React.ReactNode;
  children?: React.ReactNode;
  height?: string;
  width?: string;
};

const DialogUI = ({
  isOpen,
  handleAccordionToggle,
  title,
  children,
  height = "min-h-[70vh] max-h-[90vh]",
  width = "w-full max-w-5xl",
}: DialogUIProps) => {
  return (
    <Dialog open={isOpen}>
      <DialogContent className={`${width} ${height} bg-white p-0 flex flex-col`}>
        {/* HEADER (sticky) */}
        <div className="sticky top-0 z-50 flex items-center justify-between px-6 pt-4 border-b border-gray-200 bg-white">
          <h2 className="text-lg font-semibold text-primary/80">{title}</h2>
          <button
            onClick={handleAccordionToggle}
            className="text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-full p-1"
          >
            <AiOutlineClose className="h-6 w-6" />
          </button>
        </div>

        {/* BODY (scrollable) */}
        <div className="flex-1 overflow-auto px-6 pb-6 pt-2">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DialogUI;
