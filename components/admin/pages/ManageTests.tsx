import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp, doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../../services/firebase';
import { Category, Test, Question } from '../../../types';
import { showMessage } from '../../../utils/helpers';
import { GoogleGenAI, Type } from "@google/genai";
import Modal from '../../modals/Modal';

import { FilePlus, PlusCircle, Trash2, Bot, Upload, Loader2, Wand2, Check, X, ArrowLeft } from 'lucide-react';

type QuestionInputMode = 'manual' | 'ai' | 'csv';

interface ManageTestsProps {
    testIdToEdit: string | null;
    onSaveComplete: () => void;
}

const ManageTests: React.FC<ManageTestsProps> = ({ testIdToEdit, onSaveComplete }) => {
    // Test Metadata State
    const [title, setTitle] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [durationMinutes, setDurationMinutes] = useState(60);
    const [marksPerQuestion, setMarksPerQuestion] = useState(1);
    const [negativeMarking, setNegativeMarking] = useState(0);
    const [section, setSection] = useState('');

    // Categories for dropdown
    const [categories, setCategories] = useState<Category[]>([]);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [availableSections, setAvailableSections] = useState<string[]>([]);

    // Questions State
    const [questions, setQuestions] = useState<Question[]>([
        { question: '', options: ['', '', '', ''], correctAnswer: 'A', explanation: '' }
    ]);

    // UI State
    const [activeTab, setActiveTab] = useState<QuestionInputMode>('manual');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingTestData, setIsLoadingTestData] = useState(false);
    
    // AI State
    const [aiTopic, setAiTopic] = useState('');
    const [aiNumQuestions, setAiNumQuestions] = useState(5);
    const [aiDifficulty, setAiDifficulty] = useState('Medium');
    const [isGenerating, setIsGenerating] = useState(false);
    const [aiGeneratedQuestions, setAiGeneratedQuestions] = useState<Question[]>([]);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

    useEffect(() => {
        const q = query(collection(db, 'testCategories'), orderBy('name'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const categoriesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
            setCategories(categoriesData);
            setLoadingCategories(false);
        });
        return () => unsubscribe();
    }, []);
    
    useEffect(() => {
        const fetchTestForEdit = async () => {
            if (!testIdToEdit) {
                 setTitle('');
                 setCategoryId('');
                 setDurationMinutes(60);
                 setMarksPerQuestion(1);
                 setNegativeMarking(0);
                 setSection('');
                 setQuestions([{ question: '', options: ['', '', '', ''], correctAnswer: 'A', explanation: '' }]);
                return;
            }
            setIsLoadingTestData(true);
            try {
                const testDocRef = doc(db, 'tests', testIdToEdit);
                const testDoc = await getDoc(testDocRef);
                if (testDoc.exists()) {
                    const data = testDoc.data() as Test;
                    setTitle(data.title);
                    setCategoryId(data.categoryId);
                    setDurationMinutes(data.durationMinutes);
                    setMarksPerQuestion(data.marksPerQuestion);
                    setNegativeMarking(data.negativeMarking);
                    setQuestions(data.questions);
                    setSection(data.section || '');
                } else {
                    showMessage('Test not found.', true);
                    onSaveComplete();
                }
            } catch (error) {
                showMessage('Error loading test data.', true);
            } finally {
                setIsLoadingTestData(false);
            }
        };
        fetchTestForEdit();
    }, [testIdToEdit, onSaveComplete]);
    
    useEffect(() => {
        setSection(''); // Reset on category change
        if (!categoryId) {
            setAvailableSections([]);
            return;
        }

        let currentCat = categories.find(c => c.id === categoryId);
        let topLevelParent = currentCat;
        while (topLevelParent?.parentId) {
            topLevelParent = categories.find(c => c.id === topLevelParent.parentId);
        }
        
        if (topLevelParent && topLevelParent.sections) {
            setAvailableSections(topLevelParent.sections);
        } else {
            setAvailableSections([]);
        }

    }, [categoryId, categories]);

    const handleQuestionChange = (index: number, field: 'question' | 'explanation', value: string) => {
        const newQuestions = [...questions];
        newQuestions[index][field] = value;
        setQuestions(newQuestions);
    };

    const handleOptionChange = (qIndex: number, oIndex: number, value: string) => {
        const newQuestions = [...questions];
        newQuestions[qIndex].options[oIndex] = value;
        setQuestions(newQuestions);
    };
    
    const handleCorrectAnswerChange = (index: number, value: string) => {
        const newQuestions = [...questions];
        newQuestions[index].correctAnswer = value;
        setQuestions(newQuestions);
    };

    const addQuestion = () => {
        setQuestions([...questions, { question: '', options: ['', '', '', ''], correctAnswer: 'A', explanation: '' }]);
    };

    const removeQuestion = (index: number) => {
        setQuestions(questions.filter((_, i) => i !== index));
    };

    const handleGenerateAIQuestions = async () => {
        if (!aiTopic.trim()) {
            showMessage('Please enter a topic for AI generation.', true);
            return;
        }
        setIsGenerating(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const prompt = `Generate ${aiNumQuestions} multiple-choice questions for a test on the topic "${aiTopic}". The difficulty level should be ${aiDifficulty}. For each question, provide:
1.  A question text.
2.  An array of 4 options.
3.  The correct answer key (A, B, C, or D).
4.  A brief explanation for the correct answer.
Do not include any introductory text, just the JSON output.`;
            
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                question: { type: Type.STRING },
                                options: { 
                                    type: Type.ARRAY,
                                    items: { type: Type.STRING }
                                },
                                correctAnswer: { type: Type.STRING },
                                explanation: { type: Type.STRING }
                            },
                             required: ['question', 'options', 'correctAnswer', 'explanation']
                        }
                    }
                }
            });

            const generatedQs = JSON.parse(response.text) as Question[];
            
            setAiGeneratedQuestions(generatedQs);
            setIsReviewModalOpen(true);
            showMessage(`${generatedQs.length} questions generated. Please review them.`);

        } catch (error) {
            console.error("AI Generation Error:", error);
            showMessage('Failed to generate questions. Please check the topic and try again.', true);
        } finally {
            setIsGenerating(false);
        }
    };
    
    const handleAcceptQuestion = (index: number) => {
        const questionToAccept = aiGeneratedQuestions[index];
        const existingQuestions = questions.filter(q => q.question.trim() !== '');
        setQuestions([...existingQuestions, questionToAccept]);
        setAiGeneratedQuestions(aiGeneratedQuestions.filter((_, i) => i !== index));
    };

    const handleDiscardQuestion = (index: number) => {
        setAiGeneratedQuestions(aiGeneratedQuestions.filter((_, i) => i !== index));
    };
    
    const handleAcceptAllAndClose = () => {
        const existingQuestions = questions.filter(q => q.question.trim() !== '');
        setQuestions([...existingQuestions, ...aiGeneratedQuestions]);
        handleCloseReviewModal();
    };

    const handleCloseReviewModal = () => {
        setAiGeneratedQuestions([]);
        setIsReviewModalOpen(false);
        setActiveTab('manual');
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            try {
                const rows = text.split('\n').slice(1);
                const parsedQuestions: Question[] = rows.map((row): Question | null => {
                    const columns = row.split(',').map(c => c.trim().replace(/"/g, ''));
                    if (columns.length < 7) return null;
                    return {
                        question: columns[0],
                        options: [columns[1], columns[2], columns[3], columns[4]],
                        correctAnswer: columns[5].toUpperCase(),
                        explanation: columns[6] || '',
                    };
                }).filter((q): q is Question => q !== null);
                
                const existingQuestions = questions.filter(q => q.question.trim() !== '');
                setQuestions([...existingQuestions, ...parsedQuestions]);

                showMessage(`${parsedQuestions.length} questions imported from CSV.`);
                setActiveTab('manual');
            } catch (error) {
                 showMessage('Failed to parse CSV file. Please check the format.', true);
            }
        };
        reader.readAsText(file);
    };

    const handleSaveTest = async () => {
        if (!title.trim() || !categoryId) {
            showMessage('Please fill in the Test Title and select a Category.', true);
            return;
        }
        if (questions.some(q => !q.question.trim() || q.options.some(o => !o.trim()))) {
            showMessage('Please ensure all questions and options are filled out.', true);
            return;
        }
        setIsSubmitting(true);
        try {
            const categoryName = categories.find(c => c.id === categoryId)?.name || '';

            if (testIdToEdit) {
                 const testDocRef = doc(db, 'tests', testIdToEdit);
                 await updateDoc(testDocRef, {
                    title,
                    categoryId,
                    category: categoryName,
                    questionCount: questions.length,
                    durationMinutes: Number(durationMinutes),
                    marksPerQuestion: Number(marksPerQuestion),
                    negativeMarking: Number(negativeMarking),
                    questions,
                    section: section || '',
                    updatedAt: serverTimestamp()
                 });
                 showMessage('Test updated successfully!');
            } else {
                const testData: Omit<Test, 'id' | 'updatedAt'> = {
                    title,
                    categoryId,
                    category: categoryName,
                    questionCount: questions.length,
                    durationMinutes: Number(durationMinutes),
                    marksPerQuestion: Number(marksPerQuestion),
                    negativeMarking: Number(negativeMarking),
                    questions,
                    status: 'draft',
                    section: section || '',
                    createdAt: serverTimestamp() as any
                };
                await addDoc(collection(db, 'tests'), testData);
                showMessage('Test saved as draft successfully!');
            }
            onSaveComplete();
        } catch (error) {
            console.error("Error saving test:", error);
            showMessage('Failed to save the test.', true);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const renderTabContent = () => {
        switch (activeTab) {
            case 'ai':
                return (
                    <div className="p-4 space-y-4 border-t">
                         <h3 className="text-lg font-semibold text-gray-700">Generate Questions with AI</h3>
                         <div>
                            <label className="block text-sm font-medium mb-1">Topic</label>
                            <input type="text" value={aiTopic} onChange={e => setAiTopic(e.target.value)} placeholder="e.g., World History, JavaScript Basics" className="w-full p-2 border border-gray-300 rounded-lg" />
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Number of Questions</label>
                                <input type="number" value={aiNumQuestions} onChange={e => setAiNumQuestions(Number(e.target.value))} className="w-full p-2 border border-gray-300 rounded-lg" />
                            </div>
                             <div>
                                <label className="block text-sm font-medium mb-1">Difficulty</label>
                                <select value={aiDifficulty} onChange={e => setAiDifficulty(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg bg-white">
                                    <option>Easy</option>
                                    <option>Medium</option>
                                    <option>Hard</option>
                                </select>
                            </div>
                         </div>
                         <button onClick={handleGenerateAIQuestions} disabled={isGenerating} className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:bg-purple-400">
                            {isGenerating ? <><Loader2 className="animate-spin" size={20}/> Generating...</> : <><Wand2 size={18}/> Generate & Review</>}
                         </button>
                    </div>
                );
            case 'csv':
                 return (
                    <div className="p-4 space-y-4 border-t">
                        <h3 className="text-lg font-semibold text-gray-700">Upload Questions from CSV</h3>
                        <p className="text-sm text-gray-500">
                            Upload a CSV file with the headers: <code>question,optionA,optionB,optionC,optionD,correctAnswer,explanation</code>.
                            The <code>correctAnswer</code> should be 'A', 'B', 'C', or 'D'.
                        </p>
                        <input type="file" accept=".csv" onChange={handleFileUpload} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"/>
                    </div>
                );
            case 'manual':
            default:
                return (
                     <div className="space-y-4 border-t pt-4">
                        {questions.map((q, index) => (
                            <div key={index} className="border-b pb-4">
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="font-semibold">Question {index + 1}</h4>
                                    {questions.length > 1 && <button onClick={() => removeQuestion(index)} className="text-red-500 hover:text-red-700 p-1"><Trash2 size={18} /></button>}
                                </div>
                                <textarea value={q.question} onChange={e => handleQuestionChange(index, 'question', e.target.value)} placeholder="Question text..." className="w-full p-2 border border-gray-300 rounded-lg mb-2"></textarea>
                                {q.options.map((opt, optIndex) => (
                                     <div key={optIndex} className="flex items-center gap-2 mb-2">
                                        <span className="font-bold">{String.fromCharCode(65 + optIndex)}</span>
                                        <input type="text" value={opt} onChange={e => handleOptionChange(index, optIndex, e.target.value)} placeholder={`Option ${String.fromCharCode(65 + optIndex)}`} className="w-full p-2 border border-gray-300 rounded-lg" />
                                     </div>
                                ))}
                                <div className="mt-2">
                                     <label className="block text-sm font-medium mb-1">Correct Answer</label>
                                     <select value={q.correctAnswer} onChange={e => handleCorrectAnswerChange(index, e.target.value)} className="p-2 border border-gray-300 rounded-lg bg-white">
                                         <option>A</option><option>B</option><option>C</option><option>D</option>
                                     </select>
                                </div>
                                <textarea value={q.explanation} onChange={e => handleQuestionChange(index, 'explanation', e.target.value)} placeholder="Explanation (optional)..." className="w-full p-2 border border-gray-300 rounded-lg mt-2"></textarea>
                            </div>
                        ))}
                        <button onClick={addQuestion} className="flex items-center gap-2 text-indigo-600 font-semibold">
                            <PlusCircle size={18} /> Add Another Question
                        </button>
                    </div>
                )
        }
    };
    
    const TabButton = ({ mode, label, icon: Icon }: { mode: QuestionInputMode; label: string; icon: React.ElementType }) => (
        <button
            onClick={() => setActiveTab(mode)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-t-lg border-b-2 ${activeTab === mode ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
            <Icon size={16} /> {label}
        </button>
    );
    
    if (isLoadingTestData) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="bg-white p-6 rounded-xl shadow-lg h-64">
                    <div className="h-8 w-1/3 bg-gray-200 rounded mb-6"></div>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="h-14 bg-gray-200 rounded-lg"></div>
                            <div className="h-14 bg-gray-200 rounded-lg"></div>
                            <div className="h-14 bg-gray-200 rounded-lg"></div>
                            <div className="h-14 bg-gray-200 rounded-lg"></div>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-lg h-96"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="flex justify-between items-start mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3"><FilePlus /> {testIdToEdit ? 'Edit Test' : 'Create a New Test'}</h2>
                    <button onClick={onSaveComplete} className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-800 font-semibold rounded-lg hover:bg-gray-200 transition-all">
                        <ArrowLeft size={18} /> Back to All Tests
                    </button>
                </div>
                <fieldset className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Test Title</label>
                            <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Category</label>
                            <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg bg-white" disabled={loadingCategories}>
                                <option value="">{loadingCategories ? 'Loading...' : 'Select Category...'}</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        {availableSections.length > 0 && (
                            <div>
                                <label className="block text-sm font-medium mb-1">Section (Optional)</label>
                                <select value={section} onChange={e => setSection(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg bg-white">
                                    <option value="">Select Section...</option>
                                    {availableSections.map(sec => <option key={sec} value={sec}>{sec}</option>)}
                                </select>
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium mb-1">Duration (Minutes)</label>
                            <input type="number" value={durationMinutes} onChange={e => setDurationMinutes(Number(e.target.value))} className="w-full p-2 border border-gray-300 rounded-lg" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Marks per Question</label>
                            <input type="number" step="0.5" value={marksPerQuestion} onChange={e => setMarksPerQuestion(Number(e.target.value))} className="w-full p-2 border border-gray-300 rounded-lg" />
                        </div>
                         <div>
                            <label className="block text-sm font-medium mb-1">Negative Marking (per wrong answer)</label>
                            <input type="number" step="0.25" value={negativeMarking} onChange={e => setNegativeMarking(Number(e.target.value))} className="w-full p-2 border border-gray-300 rounded-lg" />
                        </div>
                    </div>
                </fieldset>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-lg">
                <h3 className="text-xl font-bold text-gray-800 mb-2">Test Questions</h3>
                <div className="flex border-b mb-4">
                    <TabButton mode="manual" label="Manual Entry" icon={PlusCircle} />
                    <TabButton mode="ai" label="AI Generation" icon={Bot} />
                    <TabButton mode="csv" label="Upload CSV" icon={Upload} />
                </div>
                {renderTabContent()}
            </div>
            
            <button onClick={handleSaveTest} disabled={isSubmitting} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 flex items-center justify-center gap-2">
                {isSubmitting && <Loader2 className="animate-spin" />}
                {isSubmitting ? 'Saving...' : (testIdToEdit ? 'Save Changes' : 'Save as Draft')}
            </button>
            
            <Modal isOpen={isReviewModalOpen} onClose={handleCloseReviewModal} title={`Reviewing ${aiGeneratedQuestions.length} AI-Generated Questions`} size="lg">
                <div className="space-y-4 max-h-[60vh] overflow-y-auto p-1 pr-4">
                    {aiGeneratedQuestions.length === 0 && <p className="text-gray-500 text-center py-8">All questions have been reviewed.</p>}
                    {aiGeneratedQuestions.map((q, index) => (
                        <div key={index} className="border p-4 rounded-lg bg-gray-50/50">
                            <p className="font-semibold text-gray-800">{index + 1}. {q.question}</p>
                            <div className="mt-2 space-y-1 pl-4">
                                {q.options.map((opt, i) => (
                                    <p key={i} className={`text-sm ${String.fromCharCode(65 + i) === q.correctAnswer ? 'text-green-700 font-bold' : 'text-gray-600'}`}>
                                        {String.fromCharCode(65 + i)}. {opt}
                                    </p>
                                ))}
                            </div>
                            <p className="text-xs text-gray-500 mt-2"><b>Explanation:</b> {q.explanation}</p>
                            <div className="flex justify-end gap-2 mt-3">
                                <button onClick={() => handleDiscardQuestion(index)} className="px-3 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-md hover:bg-red-200 flex items-center gap-1">
                                    <X size={14} /> Discard
                                </button>
                                <button onClick={() => handleAcceptQuestion(index)} className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-md hover:bg-green-200 flex items-center gap-1">
                                    <Check size={14} /> Accept
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t mt-4">
                    <button type="button" onClick={handleCloseReviewModal} className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300">Discard All & Close</button>
                    <button type="button" onClick={handleAcceptAllAndClose} className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700">
                        Accept All & Close
                    </button>
                </div>
            </Modal>
        </div>
    );
};

export default ManageTests;