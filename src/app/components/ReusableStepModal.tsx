import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import TextInputWithClearButton from "./InputClear";
import { toast } from "sonner";
import axios from "axios";
import { URL_API_ALB } from '@/config';
import { checkConnection } from '@/utils/DBBUtils';

interface ReusableStepModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedSteps: number[];
    steps: any[];
    onCreateReusable: (step: any) => void;
    isDarkMode?: boolean;
    responseTest?: any;
    setResponseData?: (data: any) => void;
    onSetResponseData?:any
}

const ReusableStepModal: React.FC<ReusableStepModalProps> = ({
    isOpen,
    onClose,
    selectedSteps,
    steps,
    onCreateReusable,
    isDarkMode = false,
    responseTest = null,
    onSetResponseData
}) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [newTags, setNewTags] = useState('');
    const [createdBy, setCreatedBy] = useState(responseTest?.createdBy || 'jpaz');
    const [reusableStep, setReusableStep] = useState<any>(null);
    const handleCreate = async () => {
        if (!name.trim()) {
            toast.error('Name is required');
            return;
        }
        const selectedStepsData = selectedSteps.map((index, idx) => {
            const { stepsId, ...rest } = steps[index] || {};
            return {
                ...rest,
                indexStep: idx + 1,
            };
        });

        const tags =
            responseTest?.tagNames && responseTest.tagNames.length > 0
                ? responseTest.tagNames
                : newTags
                    .split(',')
                    .map(tag => tag.trim())
                    .filter(tag => tag !== '');

        const reusableStepPayload = {
            tagNames: tags,
            name: name.trim(),
            description: description.trim(),
            stepsData: selectedStepsData,
            createdBy: createdBy.trim() || 'jpaz',
            temp: false,
            id: null,
        };

        console.log("Creating reusable step with payload:", reusableStepPayload);
        console.log("Selected steps data:", selectedStepsData);
            
        try {
            await checkConnection()
            const apiUrl = (URL_API_ALB ?? '');
            const response = await axios.put(
                `${apiUrl}reusableSteps`,
                reusableStepPayload
            );
            if (!response?.data) {
                throw new Error('No data returned from API');
            }

            
            reusableStepPayload.id = await response?.data[0]?.id;
            
            setReusableStep(response?.data);
            toast.success('Reusable step created successfully');
            onCreateReusable(reusableStepPayload);
            onSetResponseData?.(response?.data);
            setName('');
            setDescription('');
            setNewTags('');
            setCreatedBy(responseTest?.createdBy || 'jpaz');
            onClose();

        } catch (err) {
            console.error(err);
            toast.error('Error saving reusable step');
        }
    };

    const getModalClasses = () => isDarkMode 
        ? "bg-gray-800 text-white border-gray-600" 
        : "bg-white text-gray-900";

    const getInputClasses = () => isDarkMode
        ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
        : "bg-white border-gray-300 text-gray-900";


    
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className={getModalClasses()}>
                <DialogHeader>
                    <DialogTitle>Create Reusable Step</DialogTitle>
                    <DialogDescription>
                        Create a reusable step from {selectedSteps?.length} selected steps
                    </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="TagNames">Tag Names</Label>
                        {responseTest?.tagNames && responseTest.tagNames.length > 0 ? (
                            <div className="flex gap-2">
                                {responseTest.tagNames.map((tag: string, index: number) => (
                                    <span 
                                        key={index} 
                                        className={`text-xs px-2 py-1 rounded-full ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-primary/20 text-primary/80'}`}>
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <TextInputWithClearButton
                                id="newTags"
                                value={newTags}
                                onChangeHandler={e => setNewTags(e.target.value)}
                                placeholder="Enter tags separated by commas"
                                className={getInputClasses()}
                                isDarkMode={isDarkMode}
                            />
                        )}

                        <Label htmlFor="name">Name *</Label>
                        <TextInputWithClearButton
                            id="name"
                            value={name}
                            onChangeHandler={e => setName(e.target.value)}
                            placeholder="Enter reusable step name"
                            className={getInputClasses()}
                            isDarkMode={isDarkMode}
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <TextInputWithClearButton   
                            id="description"
                            value={description}
                            onChangeHandler={e => setDescription(e.target.value)}
                            placeholder="Enter description (optional)"
                            className={getInputClasses()}
                            isDarkMode={isDarkMode}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="createdBy">Created By</Label>
                        <TextInputWithClearButton   
                            id="createdBy"
                            value={createdBy}
                            onChangeHandler={e => setCreatedBy(e.target.value)}
                            placeholder="Enter creator"
                            className={getInputClasses()}
                            isDarkMode={isDarkMode}
                        />
                    </div>

                    <div className="border rounded p-3">
                        <Label>Selected Steps ({selectedSteps.length}):</Label>
                        <div className="mt-2 space-y-1 max-h-32 overflow-y-auto flex flex-col gap-2 ">
                            {selectedSteps.map(index => (
                                <div 
                                    key={index} 
                                    className={`text-sm p-2 rounded ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'}`}>
                                    {`Step ${index + 1}: ${steps[index]?.action} - ${steps[index]?.data?.text || 'No text'}`}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} >
                        Cancel
                    </Button>
                    <Button onClick={handleCreate} className={`${isDarkMode ? 'bg-primary/90 text-white' : 'bg-primary/80 text-white'}`}>
                        Create Reusable Step
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ReusableStepModal;
