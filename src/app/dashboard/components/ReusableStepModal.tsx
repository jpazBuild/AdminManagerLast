import React, { useEffect, useMemo, useState } from 'react';
import { Label } from "@/components/ui/label";
import TextInputWithClearButton from "../../components/InputClear";
import { toast } from "sonner";
import axios from "axios";
import { URL_API_ALB } from '@/config';
import { checkConnection } from '@/utils/DBBUtils';
import { SearchField } from '../../components/SearchField';
import { User } from '@/types/types';
import ModalCustom from '@/app/components/ModalCustom';

interface ReusableStepModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedSteps: number[];
    steps: any[];
    onCreateReusable: (step: any) => void;
    isDarkMode?: boolean;
    responseTest?: any;
    setResponseData?: (data: any) => void;
    onSetResponseData?: any
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
    const defaultCreator = responseTest?.createdByName || 'jpaz';
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [newTags, setNewTags] = useState('');
    const [createdBy, setCreatedBy] = useState(responseTest?.createdByName || 'jpaz');
    const [reusableStep, setReusableStep] = useState<any>(null);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [usernames, setUsernames] = useState<string[]>([]);
    const userOptions = useMemo(
        () =>
            Array.from(new Set([defaultCreator, ...usernames]))
                .filter(Boolean)
                .map((u) => ({ label: u, value: u })),
        [defaultCreator, usernames]
    );

    const fetchUsers = async () => {
        try {
            setLoadingUsers(true);
            const res = await axios.post(`${URL_API_ALB}users`, {});
            setUsernames(Array.isArray(res?.data) ? res.data.map((user: User) => user.name) : []);
        } catch (err) {
            console.error("Error fetching users:", err);
            toast.error("Error fetching users");
        } finally {
            setLoadingUsers(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchUsers();
        }
    }, [isOpen]);

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

        const reusableStepPayload: {
            tagNames: any;
            name: string;
            description: string;
            stepsData: any[];
            createdBy: any;
            temp: boolean;
            id?: any;
        } = {
            tagNames: tags,
            name: name.trim(),
            description: description.trim(),
            stepsData: selectedStepsData,
            createdBy: createdBy.trim() || 'jpaz',
            temp: false       
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

        } catch (err:Error | any) {
            console.error(err);
            toast.error('Error saving reusable step',err.message);
        }
    };


    return (
        <ModalCustom
            open={isOpen}
            onClose={onClose}
            width="max-w-2/3 max-h-screen"

            backArrow={true}
        >
              <div className="py-4 flex flex-col gap-4 overflow-x-hidden">
                    <p className="text-[22px] font-semibold text-start pb-3">Create Reusable Step</p>
                    <div className="space-y-2">
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
                                label='Enter tags'
                                isDarkMode={isDarkMode}
                            />
                        )}

                        <TextInputWithClearButton
                            id="name"
                            value={name}
                            label="Enter reusable step name"
                            onChangeHandler={e => setName(e.target.value)}
                            placeholder="Enter reusable step name"
                            isDarkMode={isDarkMode}
                        />
                    </div>

                    <div className="space-y-2">
                        <TextInputWithClearButton
                            id="description"
                            value={description}
                            label={`Enter description`}
                            onChangeHandler={e => setDescription(e.target.value)}
                            placeholder="Enter description (optional)"
                            isDarkMode={isDarkMode}
                        />
                    </div>

                    <div className="space-y-2">
                        <SearchField
                            value={createdBy}
                            label={loadingUsers ? 'Loading creators…' : 'Select creator'}
                            onChange={(e: any) => {
                                if (typeof e === 'string') return setCreatedBy(e);
                                if (e?.value) return setCreatedBy(e.value);
                                if (e?.label && !e?.value) return setCreatedBy(e.label);
                                if (e?.target?.value) return setCreatedBy(e.target.value);
                                if (e?.target?.name) return setCreatedBy(e.target.name);
                                if (e?.name) return setCreatedBy(e.name);
                            }}

                            placeholder="Select creator"
                            options={userOptions}
                            disabled={loadingUsers}
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

                    <div className='flex justify-end gap-4 mt-4'>
                        <button className="px-10 py-3 border rounded-md cursor-pointer text-primary transition-colors duration-150">
                        Cancel
                    </button>
                    <button
                        onClick={handleCreate}
                        className={`px-10 py-3 rounded-md text-white cursor-pointer hover:opacity-90 font-semibold transition-opacity duration-150 ${
                            isDarkMode ? 'bg-primary/90' : 'bg-primary/80'
                        }`}
                    >
                        Create
                    </button>
                    </div>
                </div>
        </ModalCustom>
    );
};

export default ReusableStepModal;