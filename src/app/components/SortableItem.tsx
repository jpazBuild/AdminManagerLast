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

interface SortableTestCasesAccordionProps {
    testCases: any[];
    setTestCasesData: (data: any[]) => void;
    renderItem: (test: any, index: number) => React.ReactNode;
}

const SortableTestCasesAccordion: React.FC<SortableTestCasesAccordionProps> = ({
    testCases,
    setTestCasesData,
    renderItem,
}) => {
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        })
    );

    const handleDragEnd = (event: any) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            const oldIndex = testCases.findIndex(tc => tc.testCaseId === active.id);
            const newIndex = testCases.findIndex(tc => tc.testCaseId === over.id);
            const newOrder = arrayMove(testCases, oldIndex, newIndex);
            setTestCasesData(newOrder);
        }
    };

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext
                items={testCases.map(tc => tc.testCaseId)}
                strategy={verticalListSortingStrategy}
            >
                <Accordion type="multiple" className="space-y-2">
                    {testCases.map((test, index) => (
                        <SortableAccordionItem key={test.testCaseId} id={test.testCaseId}>
                            {renderItem(test, index)}
                        </SortableAccordionItem>
                    ))}
                </Accordion>
            </SortableContext>
        </DndContext>
    );
};

const SortableAccordionItem: React.FC<{
    id: string;
    children: React.ReactNode;
}> = ({ id, children }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            {children}
        </div>
    );
};

export default SortableTestCasesAccordion;