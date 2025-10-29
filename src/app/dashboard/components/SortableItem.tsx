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
import React, { useCallback } from 'react';
import { Accordion } from '@/components/ui/accordion';
import { usePagination } from '@/app/hooks/usePagination';
import PaginationResults from './PaginationResults';

type SortableTestCasesAccordionProps = {
  testCases: any[];
  setTestCasesData: (arr: any[]) => void;
  renderItem: (test: any, index: number) => React.ReactNode;
  openItems: string[];
  setOpenItems: (vals: string[]) => void;
  isDarkMode?: boolean;
};


const SortableTestCasesAccordion: React.FC<SortableTestCasesAccordionProps> = ({
  testCases,
  setTestCasesData,
  renderItem,
  openItems,
  setOpenItems,
  isDarkMode = false,
}) => {

  const {
    page, setPage,
    pageSize, setPageSize,
    totalItems, totalPages,
    start, end,
    items: paginatedSelectedTests,
  } = usePagination(testCases, 10);

  const getId = useCallback((tc: any) => tc.testCaseId || tc.id, []);

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

  const accordion = (
    <>
      <PaginationResults
        totalItems={totalItems}
        pageSize={pageSize}
        setPageSize={setPageSize}
        page={page}
        setPage={setPage}
        darkMode={isDarkMode}
      />
      <Accordion
        type="multiple"
        value={openItems}
        onValueChange={setOpenItems}
        className={getAccordionClasses()}
      >
        {paginatedSelectedTests.map((test, index) =>
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
      ? "flex w-full items-center hover:bg-gray-700 transition-colors rounded-lg"
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