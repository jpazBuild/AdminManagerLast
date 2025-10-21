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
        <div className="sticky top-0 z-50 flex items-center justify-between px-6 pt-4 border-b border-gray-200 bg-white">
          <h2 className="text-lg font-semibold text-primary/80">{title}</h2>
          <button
            onClick={handleAccordionToggle}
            className="text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-full p-1"
          >
            <AiOutlineClose className="h-6 w-6" />
          </button>
        </div>

        <div className="flex w-full justify-center h-full overflow-auto px-6 pb-6 pt-2">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DialogUI;
