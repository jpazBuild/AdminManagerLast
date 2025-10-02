import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import React from 'react';
import { Accordion } from '@/components/ui/accordion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { SearchField } from '@/app/components/SearchField';

type SortableTestCasesAccordionProps = {
  testCases: any[];
  setTestCasesData: (arr: any[]) => void;
  renderItem: (test: any, index: number) => React.ReactNode;
  openItems: string[];
  setOpenItems: (vals: string[]) => void;
  isDarkMode?: boolean;
};

const PAGE_SIZE_OPTIONS = [5, 10, 15, 20];

const SortableTestCasesAccordion: React.FC<SortableTestCasesAccordionProps> = ({
  testCases,
  setTestCasesData,
  renderItem,
  openItems,
  setOpenItems,
  isDarkMode = false,
}) => {
  const [pageSize, setPageSize] = React.useState<number>(10);
  const [page, setPage] = React.useState<number>(1);

  const getId = React.useCallback((tc: any) => tc.testCaseId || tc.id, []);

  const totalItems = testCases.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const clampedPage = Math.min(page, totalPages);
  const start = (clampedPage - 1) * pageSize;
  const end = start + pageSize;
  const pageItems = testCases.slice(start, end);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active?.id && over?.id && active.id !== over.id) {
      const oldIndex = testCases.findIndex(tc => getId(tc) === active.id);
      const newIndex = testCases.findIndex(tc => getId(tc) === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(testCases, oldIndex, newIndex);
        setTestCasesData(newOrder);
      }
    }
  };

  const isDragDisabled = openItems.length > 0;

  const getAccordionClasses = () => {
    return isDarkMode
      ? "flex flex-col gap-4 [&>*]:bg-gray-800 [&>*]:border-gray-600 [&>*]:text-white"
      : "flex flex-col gap-4";
  };

  const PaginationBar = (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-3">
      <div className="flex items-center gap-2">
        <label htmlFor="pageSize" className="text-sm text-primary/80">
          Items per page:
        </label>
        <SearchField 
          placeholder="Items per page"
          value={pageSize.toString()}
          options={PAGE_SIZE_OPTIONS.map(opt => ({ label: opt.toString(), value: opt.toString() }))}
          onChange={(val) => {
            const next = Number(val) || 10;
            setPageSize(next);
            setPage(1);
          }}
          className="!w-18 h-8"
          widthComponent='w-22'
          showSearch={false}
        />
        <span className="ml-3 text-sm text-primary/80">
          Show {totalItems === 0 ? 0 : start + 1}–{Math.min(end, totalItems)} de {totalItems}
        </span>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          className="cursor-pointer bg-gray-200 flex gap-2 items-center px-2 py-1 text-sm rounded disabled:opacity-50 "
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={clampedPage <= 1}
        >
          <ChevronLeft className="w-4 h-4"/> Anterior
        </button>
        <span className="px-2 text-sm">
          Page {clampedPage} / {totalPages}
        </span>
        <button
          type="button"
          className="cursor-pointer bg-gray-200 flex gap-2 items-center px-2 py-1 text-sm rounded disabled:opacity-50 "
          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          disabled={clampedPage >= totalPages}
        >
          Siguiente <ChevronRight className="w-4 h-4"/>
        </button>
      </div>
    </div>
  );

  const accordion = (
    <>
      <Accordion
        type="multiple"
        value={openItems}
        onValueChange={setOpenItems}
        className={getAccordionClasses()}
      >
        {pageItems.map((test, index) =>
          isDragDisabled ? (
            <div key={getId(test)}>{renderItem(test, start + index)}</div>
          ) : (
            <SortableAccordionItem
              key={getId(test)}
              id={getId(test)}
              isDarkMode={isDarkMode}
            >
              {renderItem(test, start + index)}
            </SortableAccordionItem>
          )
        )}
      </Accordion>

      {PaginationBar}
    </>
  );

  return isDragDisabled ? (
    accordion
  ) : (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext
        items={pageItems.map(getId)}
        strategy={verticalListSortingStrategy}
      >
        {accordion}
      </SortableContext>
    </DndContext>
  );
};

const SortableAccordionItem: React.FC<{
  id: string;
  children: React.ReactNode;
  isDarkMode?: boolean;
}> = ({ id, children, isDarkMode = false }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const getDynamicStyle = () => {
    const baseStyle = {
      transform: CSS.Transform.toString(transform),
      transition,
      zIndex: isDragging ? 50 : 'auto',
      cursor: 'grab',
    };

    if (isDarkMode && isDragging) {
      return {
        ...baseStyle,
        boxShadow: '0 25px 50px -12px rgba(59, 130, 246, 0.25)',
        backgroundColor: '#374151',
        borderColor: '#60A5FA',
      };
    } else if (isDragging) {
      return {
        ...baseStyle,
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      };
    }

    return baseStyle;
  };

  const getContainerClasses = () => {
    return isDarkMode
      ? "flex w-full items-center hover:bg-gray-700/50 transition-colors rounded-lg"
      : "flex w-full items-center hover:bg-gray-50 transition-colors rounded-lg";
  };

  return (
    <div
      ref={setNodeRef}
      className={getContainerClasses()}
      style={getDynamicStyle()}
      {...attributes}
      {...listeners}
    >
      {children}
    </div>
  );
};

export default SortableTestCasesAccordion;