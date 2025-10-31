import React, { useState, useEffect, useCallback, useRef } from 'react';
import { doc, onSnapshot, setDoc, collection, query, where, orderBy, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../../../services/firebase';
import { showMessage } from '../../../utils/helpers';
import { CustomPage, FooterLink, HomepageSettings, Category, HomeComponent, BannerComponentConfig, FeaturedCategoryComponentConfig, LatestTestsComponentConfig, CategoriesGridComponentConfig, RichTextComponentConfig, RecentTestsComponentConfig, AnnouncementsComponentConfig, TestimonialsComponentConfig, Testimonial, StatsCounterComponentConfig, Stat, FAQComponentConfig, FAQ, CTAComponentConfig, SyllabusComponentConfig, NotesComponentConfig, InformationComponentConfig, NewAdditionsComponentConfig } from '../../../types';
import { GoogleGenAI, Type } from "@google/genai";
import { Palette, Wand2, Loader2, Eye, Save, Trash2, Link as LinkIcon, PlusCircle, Pencil, LayoutPanelTop, ArrowUp, ArrowDown, GripVertical, Image as ImageIcon, FileText, List, Grid, Type as TypeIcon, History, Bell, Megaphone, MessageSquareQuote, TrendingUp, HelpCircle, Info, ClipboardList, StickyNote, Sparkles } from 'lucide-react';
import Modal from '../../modals/Modal';

// Simplified Preview Component for AI Theme Editor
const PreviewComponent = () => (
    <div className="bg-slate-100 p-4 font-sans">
        <header className="bg-white shadow-md mb-4 p-4 rounded-lg">
            <h1 className="text-2xl font-extrabold text-indigo-700">Exam<span className="text-gray-900">Hub</span></h1>
        </header>
        <div className="bg-white p-6 rounded-xl shadow-lg text-center border-t-4 border-indigo-500">
            <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Master Your Exams</h1>
            <p className="text-lg text-gray-600">Prepare effectively with high-quality online mock tests.</p>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 flex flex-col">
                <h3 className="text-xl font-semibold mb-2">Sample Test</h3>
                <p className="text-gray-500 text-sm mb-4">10 questions | 15 mins</p>
                <button className="w-full mt-auto py-2.5 px-4 bg-indigo-600 text-white font-semibold rounded-lg shadow-md">Attempt Now</button>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 flex flex-col">
                <h3 className="text-xl font-semibold mb-2">Another Test</h3>
                <p className="text-gray-500 text-sm mb-4">20 questions | 30 mins</p>
                <button className="w-full mt-auto py-2.5 px-4 bg-indigo-600 text-white font-semibold rounded-lg shadow-md">Attempt Now</button>
            </div>
        </div>
    </div>
);

const ManageUI: React.FC = () => {
    return (
        <div className="space-y-8">
            <div className="bg-white p-6 rounded-xl shadow-lg border-t-4 border-indigo-500">
                <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3">
                    <Palette size={32} /> Appearance
                </h1>
                <p className="text-gray-600 mt-2">Customize the look, feel, and content of your application.</p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
                <div className="space-y-8">
                    <HomepageLayoutManager />
                    <FooterLinksManager />
                </div>
                <div className="space-y-8">
                    <AIThemeEditor />
                </div>
            </div>
        </div>
    );
};

const componentTypes: { type: HomeComponent['type']; label: string; icon: React.ElementType }[] = [
    { type: 'banner', label: 'Banner', icon: ImageIcon },
    { type: 'announcements', label: 'Announcements Bar', icon: Bell },
    { type: 'cta', label: 'Call to Action', icon: Megaphone },
    { type: 'latest_tests', label: 'Latest Tests', icon: List },
    { type: 'new_additions', label: 'New Additions (with badge)', icon: Sparkles },
    { type: 'recent_tests', label: 'Recent User Tests', icon: History },
    { type: 'featured_category', label: 'Featured Category', icon: FileText },
    { type: 'categories_grid', label: 'Categories Grid', icon: Grid },
    { type: 'testimonials', label: 'Testimonials', icon: MessageSquareQuote },
    { type: 'stats_counter', label: 'Statistics Counter', icon: TrendingUp },
    { type: 'faq', label: 'FAQ Section', icon: HelpCircle },
    { type: 'syllabus', label: 'Syllabus Block', icon: ClipboardList },
    { type: 'notes', label: 'Notes Block', icon: StickyNote },
    { type: 'information', label: 'Information Block', icon: Info },
    { type: 'rich_text', label: 'Rich Text Block', icon: TypeIcon },
];

// Homepage Layout Manager
const HomepageLayoutManager: React.FC = () => {
    const [settings, setSettings] = useState<HomepageSettings | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [editingComponent, setEditingComponent] = useState<HomeComponent | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
    const addMenuRef = useRef<HTMLDivElement>(null);
    
    const [aiLayoutPrompt, setAiLayoutPrompt] = useState('');
    const [suggestedLayout, setSuggestedLayout] = useState<HomeComponent[] | null>(null);
    const [isGeneratingLayout, setIsGeneratingLayout] = useState(false);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (addMenuRef.current && !addMenuRef.current.contains(event.target as Node)) {
                setIsAddMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const settingsDocRef = doc(db, 'uiSettings', 'homepage');
        const unsubscribeSettings = onSnapshot(settingsDocRef, (doc) => {
            if (doc.exists()) {
                setSettings(doc.data() as HomepageSettings);
            } else {
                 setSettings({ layout: [
                    { id: 'banner-default', type: 'banner', enabled: true, config: { title: 'Master Your Exams', subtitle: 'Prepare effectively with high-quality online mock tests.', imageUrl: null } },
                    { id: 'latest-tests-default', type: 'latest_tests', enabled: true, config: { title: 'Latest Tests', limit: 4 } }
                ]});
            }
            setLoading(false);
        });

        const catQuery = query(collection(db, 'testCategories'), orderBy('name'));
        const unsubscribeCats = onSnapshot(catQuery, (snapshot) => {
            setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));
        });

        return () => { unsubscribeSettings(); unsubscribeCats(); };
    }, []);

    const handleGenerateLayout = async () => {
        if (!aiLayoutPrompt.trim()) {
            showMessage('Please describe the layout you want.', true);
            return;
        }
        setIsGeneratingLayout(true);
        setSuggestedLayout(null);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const modelPrompt = `
You are a UI/UX expert designing a homepage layout for an exam prep website. Based on the user's request, suggest a layout by generating a JSON array of components.
Available component types and their configurations are:
1. 'banner': { "title": "string", "subtitle": "string", "imageUrl": null }
2. 'latest_tests': { "title": "string", "limit": number (between 2 and 8) }
3. 'featured_category': { "title": "string (include the category name here)", "categoryId": null }
4. 'categories_grid': { "title": "string" }
5. 'rich_text': { "content": "string (HTML content)" }
6. 'recent_tests': { "title": "string", "limit": number (between 2 and 6) }
7. 'announcements': { "title": "string" }
8. 'testimonials': { "title": "string", "testimonials": [{ "text": "string", "author": "string", "role": "string" }] }
9. 'stats_counter': { "title": "string", "stats": [{ "label": "string", "value": "string" }] }
10. 'faq': { "title": "string", "faqs": [{ "question": "string", "answer": "string" }] }
11. 'cta': { "headline": "string", "description": "string", "buttonText": "string", "buttonLink": "string" }
12. 'new_additions': { "title": "string", "limit": number (between 2 and 8) }
13. 'syllabus': { "title": "string", "content": "string (HTML content)" }
14. 'notes': { "title": "string", "content": "string (HTML content)" }
15. 'information': { "title": "string", "content": "string (HTML content)" }

Generate a JSON array of these components in a logical order. For each component, provide a unique 'id' (e.g., 'banner-12345'), 'type', 'enabled: true', and a 'config' object. For the 'featured_category' component, always set 'categoryId' to null.
User's request: "${aiLayoutPrompt}"
Return ONLY the JSON array.`;

            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash", contents: modelPrompt
            });
            
            const rawText = response.text.trim();
            const jsonMatch = rawText.match(/\[[\s\S]*\]/);
            if (!jsonMatch) {
                throw new Error("No JSON array found in the AI response.");
            }
            const layout = JSON.parse(jsonMatch[0]) as HomeComponent[];
            
            if (Array.isArray(layout) && layout.length > 0) {
                setSuggestedLayout(layout);
                showMessage('AI suggestion generated!');
            } else {
                throw new Error("Invalid layout format returned by AI.");
            }

        } catch (error) {
            console.error(error);
            showMessage('Failed to generate layout suggestion.', true);
        } finally {
            setIsGeneratingLayout(false);
        }
    };

    const handleApplySuggestion = () => {
        if (!suggestedLayout) return;
        setSettings(s => ({ ...s, layout: suggestedLayout }));
        setSuggestedLayout(null);
        showMessage('AI suggestion applied!');
    };

    const handleSave = async () => {
        if (!settings) return;
        setIsSaving(true);
        try {
            const settingsToSave = { ...settings, layout: settings.layout || [] };
            await setDoc(doc(db, 'uiSettings', 'homepage'), settingsToSave);
            showMessage('Homepage layout saved!');
        } catch (error) { showMessage('Failed to save layout.', true);
        } finally { setIsSaving(false); }
    };

    const handleAddComponent = (type: HomeComponent['type']) => {
        const newId = `${type}-${Date.now()}`;
        let defaultConfig: any;
        switch(type) {
            case 'banner': defaultConfig = { title: 'New Banner', subtitle: 'Banner subtitle', imageUrl: null }; break;
            case 'featured_category': defaultConfig = { title: 'Featured Category', categoryId: null }; break;
            case 'latest_tests': defaultConfig = { title: 'Latest Tests', limit: 4 }; break;
            case 'categories_grid': defaultConfig = { title: 'Explore Categories' }; break;
            case 'rich_text': defaultConfig = { content: '<h2>New Section</h2><p>Add your custom text or HTML content here.</p>' }; break;
            case 'recent_tests': defaultConfig = { title: 'Your Recent Activity', limit: 4 }; break;
            case 'announcements': defaultConfig = { title: 'Latest Announcements' }; break;
            case 'testimonials': defaultConfig = { title: 'What Our Users Say', testimonials: [{ text: 'This platform is amazing!', author: 'Jane Doe', role: 'Student' }] }; break;
            case 'stats_counter': defaultConfig = { title: 'Our Achievements', stats: [{ label: 'Tests Taken', value: '10,000+' }, { label: 'Happy Students', value: '5,000+' }] }; break;
            case 'faq': defaultConfig = { title: 'Frequently Asked Questions', faqs: [{ question: 'How do I start?', answer: 'Just pick a test and click "Attempt Now"!' }] }; break;
            case 'cta': defaultConfig = { headline: 'Ready to Ace Your Next Exam?', description: 'Join thousands of students preparing on our platform.', buttonText: 'Sign Up Now', buttonLink: 'home' }; break;
            case 'syllabus': defaultConfig = { title: 'Syllabus', content: '<p>Details about the syllabus...</p>' }; break;
            case 'notes': defaultConfig = { title: 'Important Notes', content: '<ul><li>Note 1</li><li>Note 2</li></ul>' }; break;
            case 'information': defaultConfig = { title: 'General Information', content: '<p>Some important info for students.</p>' }; break;
            case 'new_additions': defaultConfig = { title: 'What\'s New', limit: 4 }; break;
        }
        const newComponent: HomeComponent = { id: newId, type, enabled: true, config: defaultConfig };
        setSettings(s => ({ ...s, layout: [...(s?.layout || []), newComponent] }));
        setIsAddMenuOpen(false);
    };

    const handleUpdateComponent = (updatedComponent: HomeComponent) => {
        setSettings(s => {
            if (!s) return s;
            const newLayout = (s.layout || []).map(c => c.id === updatedComponent.id ? updatedComponent : c);
            return { ...s, layout: newLayout };
        });
    };

    const handleRemoveComponent = (id: string) => {
        setSettings(s => {
            if (!s) return s;
            const newLayout = (s.layout || []).filter(c => c.id !== id);
            return { ...s, layout: newLayout };
        });
    };

    const moveComponent = (index: number, direction: 'up' | 'down') => {
        setSettings(s => {
            if (!s || !s.layout) return s;
            const newLayout = [...s.layout];
            const targetIndex = direction === 'up' ? index - 1 : index + 1;
            if (targetIndex < 0 || targetIndex >= newLayout.length) return s;
            [newLayout[index], newLayout[targetIndex]] = [newLayout[targetIndex], newLayout[index]];
            return { ...s, layout: newLayout };
        });
    };

    const handleEditClick = (component: HomeComponent) => {
        setEditingComponent(component);
        setIsEditModalOpen(true);
    };
    
    return (
        <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="border-b pb-4 mb-4">
                <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2"><Wand2 /> AI Layout Assistant</h3>
                <p className="text-sm text-gray-500 mb-3">Describe the kind of homepage you want, and AI will suggest a component layout for you.</p>
                <textarea
                    value={aiLayoutPrompt}
                    onChange={e => setAiLayoutPrompt(e.target.value)}
                    rows={3}
                    className="w-full p-2 border rounded-lg"
                    placeholder="e.g., A clean layout for medical students, focusing on new tests and categories."
                />
                <button onClick={handleGenerateLayout} disabled={isGeneratingLayout} className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:bg-purple-400">
                    {isGeneratingLayout ? <><Loader2 className="animate-spin" /> Generating Suggestion...</> : 'Generate Suggestion'}
                </button>
            </div>
            
            {suggestedLayout && (
                <div className="border-b pb-4 mb-4 animate-fade-in">
                    <h3 className="font-semibold text-gray-700 mb-2">AI Suggestion:</h3>
                    <div className="space-y-2 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                        {suggestedLayout.map((comp, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm">
                                <span className="font-bold text-purple-700">{i+1}.</span>
                                <span className="capitalize">{comp.type.replace(/_/g, ' ')}</span>
                                <span className="text-gray-500 truncate">- "{(comp.config as any).title || (comp.config as any).headline || '...'}"</span>
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-2 mt-3">
                        <button onClick={handleApplySuggestion} className="flex-1 py-2 bg-green-600 text-white font-semibold rounded-lg text-sm">Apply Suggestion</button>
                        <button onClick={() => setSuggestedLayout(null)} className="flex-1 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg text-sm">Discard</button>
                    </div>
                </div>
            )}

            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-3"><LayoutPanelTop /> Current Homepage Layout</h2>
            {loading ? <p>Loading...</p> : (
                <>
                    <div className="space-y-2 mb-4 min-h-[60px]">
                        {(settings?.layout || []).map((component, index) => {
                             const componentInfo = componentTypes.find(ct => ct.type === component.type) || { label: 'Unknown', icon: PlusCircle };
                             const title = (component.config as any).title || (component.config as any).headline || componentInfo.label;

                             return (
                                <div key={component.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border hover:bg-gray-100">
                                    <div className="flex items-center gap-3">
                                        <GripVertical className="text-gray-400 cursor-grab"/>
                                        <componentInfo.icon className="text-indigo-500"/>
                                        <span className="font-semibold">{title}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => moveComponent(index, 'up')} disabled={index === 0} className="p-1.5 text-gray-500 hover:bg-gray-200 rounded-md disabled:opacity-30"><ArrowUp size={16}/></button>
                                        <button onClick={() => moveComponent(index, 'down')} disabled={index === (settings?.layout || []).length - 1} className="p-1.5 text-gray-500 hover:bg-gray-200 rounded-md disabled:opacity-30"><ArrowDown size={16}/></button>
                                        <button onClick={() => handleEditClick(component)} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-md"><Pencil size={16}/></button>
                                        <button onClick={() => handleRemoveComponent(component.id)} className="p-1.5 text-red-600 hover:bg-red-100 rounded-md"><Trash2 size={16}/></button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                     <div className="relative" ref={addMenuRef}>
                         <button onClick={() => setIsAddMenuOpen(prev => !prev)} className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-indigo-50 text-indigo-700 font-semibold rounded-lg hover:bg-indigo-100">
                            <PlusCircle size={18} /> Add Component
                        </button>
                        {isAddMenuOpen && (
                            <div className="absolute bottom-full mb-2 w-full bg-white shadow-lg rounded-lg border z-10 p-2 animate-scale-in origin-bottom">
                                {componentTypes.map(({ type, label, icon: Icon }) => (
                                    <button key={type} onClick={() => handleAddComponent(type)} className="w-full flex items-center gap-3 p-2 text-left text-sm rounded-md hover:bg-gray-100">
                                        <Icon className="text-indigo-500" size={16} /> {label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <button onClick={handleSave} disabled={isSaving} className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400">
                         {isSaving ? <Loader2 className="animate-spin" /> : <Save />} Save Layout
                    </button>
                </>
            )}
            {editingComponent && <EditComponentModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} component={editingComponent} onSave={handleUpdateComponent} allCategories={categories} />}
        </div>
    );
};


const AIBannerContentGenerator: React.FC<{
    onGenerated: (title: string, subtitle: string) => void;
    onClose: () => void;
}> = ({ onGenerated, onClose }) => {
    const [topic, setTopic] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerate = async () => {
        if (!topic.trim()) {
            showMessage('Please provide a topic.', true);
            return;
        }
        setIsGenerating(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const prompt = `Generate a catchy title (under 6 words) and a short, compelling subtitle (under 15 words) for a banner on an exam preparation website. The topic is "${topic}". Return a JSON object with 'title' and 'subtitle' keys.`;
            
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            subtitle: { type: Type.STRING }
                        },
                        required: ['title', 'subtitle']
                    }
                }
            });

            const result = JSON.parse(response.text);
            onGenerated(result.title, result.subtitle);
            onClose();

        } catch (error) {
            console.error("AI Banner Generation Error:", error);
            showMessage('Failed to generate content.', true);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Modal isOpen={true} onClose={onClose} title="Generate Banner Content">
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">What is the banner about?</label>
                    <input 
                        type="text" 
                        value={topic} 
                        onChange={e => setTopic(e.target.value)} 
                        placeholder="e.g., Upcoming engineering exams" 
                        className="w-full p-2 border rounded-lg mt-1"
                    />
                </div>
                <div className="flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg">Cancel</button>
                    <button onClick={handleGenerate} disabled={isGenerating} className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg flex items-center gap-2">
                         {isGenerating ? <Loader2 className="animate-spin" /> : <Wand2 size={16} />}
                         Generate
                    </button>
                </div>
            </div>
        </Modal>
    );
};

const AIImageGeneratorModal: React.FC<{
    onClose: () => void;
    onAccept: (imageDataUrl: string) => void;
}> = ({ onClose, onAccept }) => {
    const [prompt, setPrompt] = useState('');
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            showMessage('Please enter a prompt to generate an image.', true);
            return;
        }
        setIsGenerating(true);
        setGeneratedImage(null);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const response = await ai.models.generateImages({
                model: 'imagen-4.0-generate-001',
                prompt: `A professional, clean, and modern banner image for an exam preparation website. The theme is: ${prompt}. Avoid text in the image. High quality, visually appealing.`,
                config: {
                    numberOfImages: 1,
                    outputMimeType: 'image/jpeg',
                    aspectRatio: '16:9',
                },
            });

            if (response.generatedImages && response.generatedImages.length > 0) {
                const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
                const imageUrl = `data:image/jpeg;base64,${base64ImageBytes}`;
                setGeneratedImage(imageUrl);
            } else {
                throw new Error("AI did not return an image.");
            }
        } catch (error) {
            console.error("AI Image Generation Error:", error);
            showMessage('Failed to generate image. Please try again.', true);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleAccept = () => {
        if (generatedImage) {
            onAccept(generatedImage);
        }
    };

    return (
        <Modal isOpen={true} onClose={onClose} title="Generate Banner Image with AI">
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Describe the image you want</label>
                    <textarea
                        value={prompt}
                        onChange={e => setPrompt(e.target.value)}
                        placeholder="e.g., abstract geometric shapes in blue and gold, a stack of books with a glowing lightbulb..."
                        rows={3}
                        className="w-full p-2 border rounded-lg"
                    />
                </div>
                
                {isGenerating && (
                    <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                        <p className="mt-2 text-sm text-gray-500">Generating your image... this can take a moment.</p>
                    </div>
                )}
                
                {generatedImage && !isGenerating && (
                    <div>
                        <p className="text-sm font-medium mb-2">Preview:</p>
                        <img src={generatedImage} alt="AI generated preview" className="w-full rounded-lg shadow-md" />
                    </div>
                )}

                <div className="flex justify-end gap-2 pt-2 border-t">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg">Cancel</button>
                    {generatedImage && !isGenerating ? (
                        <button onClick={handleAccept} className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg flex items-center gap-2">
                             Accept Image
                        </button>
                    ) : (
                        <button onClick={handleGenerate} disabled={isGenerating} className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg flex items-center gap-2">
                             <Wand2 size={16} /> Generate
                        </button>
                    )}
                </div>
            </div>
        </Modal>
    );
};

// Edit Component Modal
interface EditModalProps { isOpen: boolean; onClose: () => void; component: HomeComponent; onSave: (comp: HomeComponent) => void; allCategories: Category[]; }
const EditComponentModal: React.FC<EditModalProps> = ({ isOpen, onClose, component, onSave, allCategories }) => {
    const [editedConfig, setEditedConfig] = useState(component.config);
    const [imageFile, setImageFile] = useState<File|null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isAIBannerContentGeneratorOpen, setIsAIBannerContentGeneratorOpen] = useState(false);
    const [isAIImageGeneratorOpen, setIsAIImageGeneratorOpen] = useState(false);

    useEffect(() => { setEditedConfig(component.config); setImageFile(null); }, [component]);
    
    const handleAIAcceptImage = async (imageDataUrl: string) => {
        if (!imageDataUrl) return;
        const res = await fetch(imageDataUrl);
        const blob = await res.blob();
        const file = new File([blob], `ai-generated-${Date.now()}.jpeg`, { type: 'image/jpeg' });
        setImageFile(file);
        setEditedConfig(conf => ({ ...(conf as BannerComponentConfig), imageUrl: null }));
        setIsAIImageGeneratorOpen(false);
    };

    const handleSave = async () => {
        let finalConfig = { ...editedConfig };
        if (component.type === 'banner' && imageFile) {
            setIsUploading(true);
            const config = finalConfig as BannerComponentConfig;
            try {
                if (component.config.imageUrl) {
                    try {
                        const oldImageRef = ref(storage, component.config.imageUrl);
                        await deleteObject(oldImageRef);
                    } catch (deleteError) {
                        console.warn("Could not delete old banner image:", deleteError);
                    }
                }
                const storageRef = ref(storage, `homepage_banners/${component.id}/${imageFile.name}`);
                await uploadBytes(storageRef, imageFile);
                config.imageUrl = await getDownloadURL(storageRef);
            } catch (e) { showMessage('Image upload failed!', true); setIsUploading(false); return; }
            setIsUploading(false);
        }
        onSave({ ...component, config: finalConfig });
        onClose();
    };
    
    const handleRemoveImage = () => {
        setEditedConfig({ ...editedConfig, imageUrl: null });
        setImageFile(null);
    };
    
    const renderArrayEditor = (
        items: any[],
        itemFields: { key: string, label: string, type?: string }[],
        itemTypeName: string,
        updateFn: (newItems: any[]) => void
    ) => {
        const handleItemChange = (index: number, field: string, value: string) => {
            const newItems = [...items];
            newItems[index] = { ...newItems[index], [field]: value };
            updateFn(newItems);
        };
        const addItem = () => {
            const newItem = itemFields.reduce((acc, f) => ({ ...acc, [f.key]: '' }), {});
            updateFn([...items, newItem]);
        };
        const removeItem = (index: number) => updateFn(items.filter((_, i) => i !== index));
    
        return (
            <div className="space-y-3">
                {items.map((item, index) => (
                    <div key={index} className="p-3 bg-gray-50 border rounded-lg space-y-2 relative">
                         <button type="button" onClick={() => removeItem(index)} className="absolute top-2 right-2 p-1 text-red-500 hover:bg-red-100 rounded-full"><Trash2 size={14}/></button>
                        {itemFields.map(field => (
                             <div key={field.key}>
                                <label className="text-xs font-medium">{field.label}</label>
                                {field.type === 'textarea' ? (
                                     <textarea value={item[field.key]} onChange={e => handleItemChange(index, field.key, e.target.value)} className="w-full p-1 border rounded-md mt-1 text-sm" />
                                ) : (
                                     <input type="text" value={item[field.key]} onChange={e => handleItemChange(index, field.key, e.target.value)} className="w-full p-1 border rounded-md mt-1 text-sm" />
                                )}
                            </div>
                        ))}
                    </div>
                ))}
                <button type="button" onClick={addItem} className="text-sm font-semibold text-indigo-600 flex items-center gap-1"><PlusCircle size={14}/>Add {itemTypeName}</button>
            </div>
        );
    };

    const renderForm = () => {
        switch (component.type) {
            case 'banner':
                const bannerConf = editedConfig as BannerComponentConfig;
                return (
                    <>
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="text-sm font-medium">Title</label>
                                <button type="button" onClick={() => setIsAIBannerContentGeneratorOpen(true)} className="text-xs text-indigo-600 font-semibold flex items-center gap-1 hover:text-indigo-800"><Wand2 size={14}/> Suggest</button>
                            </div>
                            <input type="text" value={bannerConf.title} onChange={e => setEditedConfig({...bannerConf, title: e.target.value})} className="w-full p-2 border rounded-lg"/>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Subtitle</label>
                            <textarea value={bannerConf.subtitle} onChange={e => setEditedConfig({...bannerConf, subtitle: e.target.value})} className="w-full p-2 border rounded-lg mt-1"/>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Background Image</label>
                            <div className="mt-1 flex items-center gap-4">
                                {(bannerConf.imageUrl || imageFile) ? <img src={imageFile ? URL.createObjectURL(imageFile) : bannerConf.imageUrl!} alt="preview" className="w-24 h-14 object-cover rounded shadow-sm"/> : <div className="w-24 h-14 bg-gray-100 rounded flex items-center justify-center"><ImageIcon className="text-gray-400"/></div>}
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                        <input id="banner-img" type="file" onChange={e => setImageFile(e.target.files?.[0] || null)} accept="image/*" className="hidden"/>
                                        <label htmlFor="banner-img" className="px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm font-semibold cursor-pointer hover:bg-gray-50 whitespace-nowrap">Choose File</label>
                                        <button type="button" onClick={() => setIsAIImageGeneratorOpen(true)} className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-md text-sm font-semibold flex items-center gap-1.5 hover:bg-purple-200 whitespace-nowrap">
                                            <Wand2 size={14}/> Generate with AI
                                        </button>
                                    </div>
                                    {(bannerConf.imageUrl) && <button type="button" onClick={handleRemoveImage} className="text-red-600 text-xs font-semibold text-left">Remove Current Image</button>}
                                </div>
                            </div>
                        </div>
                    </div>
                    {isAIBannerContentGeneratorOpen && <AIBannerContentGenerator onClose={() => setIsAIBannerContentGeneratorOpen(false)} onGenerated={(title, subtitle) => setEditedConfig({...bannerConf, title, subtitle})} />}
                    {isAIImageGeneratorOpen && <AIImageGeneratorModal onClose={() => setIsAIImageGeneratorOpen(false)} onAccept={handleAIAcceptImage} />}
                    </>
                );
            case 'latest_tests':
            case 'recent_tests':
            case 'new_additions':
                const testListConf = editedConfig as (LatestTestsComponentConfig | RecentTestsComponentConfig | NewAdditionsComponentConfig);
                return (
                    <div className="space-y-4">
                        <div><label className="text-sm font-medium">Section Title</label><input type="text" value={testListConf.title} onChange={e => setEditedConfig({...testListConf, title: e.target.value})} className="w-full p-2 border rounded-lg mt-1"/></div>
                        <div><label className="text-sm font-medium">Number of tests to show</label><input type="number" value={testListConf.limit} onChange={e => setEditedConfig({...testListConf, limit: Number(e.target.value)})} className="w-full p-2 border rounded-lg mt-1"/></div>
                    </div>
                );
            case 'featured_category':
                const featuredConf = editedConfig as FeaturedCategoryComponentConfig;
                return (
                    <div className="space-y-4">
                        <div><label className="text-sm font-medium">Section Title</label><input type="text" value={featuredConf.title} onChange={e => setEditedConfig({...featuredConf, title: e.target.value})} className="w-full p-2 border rounded-lg mt-1"/></div>
                        <div>
                            <label className="text-sm font-medium">Category to Feature</label>
                            <select value={featuredConf.categoryId || ''} onChange={e => setEditedConfig({...featuredConf, categoryId: e.target.value})} className="w-full p-2 border rounded-lg bg-white mt-1">
                                <option value="">Select Category...</option>
                                {allCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                    </div>
                );
            case 'announcements':
                const announceConf = editedConfig as AnnouncementsComponentConfig;
                return (
                    <div><label className="text-sm font-medium">Section Title</label><input type="text" value={announceConf.title} onChange={e => setEditedConfig({...announceConf, title: e.target.value})} className="w-full p-2 border rounded-lg mt-1"/></div>
                );
            case 'testimonials':
                const testimonialConf = editedConfig as TestimonialsComponentConfig;
                return (
                     <div className="space-y-4">
                        <div><label className="text-sm font-medium">Section Title</label><input type="text" value={testimonialConf.title} onChange={e => setEditedConfig({...testimonialConf, title: e.target.value})} className="w-full p-2 border rounded-lg mt-1"/></div>
                        {renderArrayEditor(
                            testimonialConf.testimonials,
                            [{ key: 'text', label: 'Quote', type: 'textarea' }, { key: 'author', label: 'Author' }, { key: 'role', label: 'Role/Title' }],
                            'Testimonial',
                            (newItems: Testimonial[]) => setEditedConfig({...testimonialConf, testimonials: newItems})
                        )}
                    </div>
                );
            case 'stats_counter':
                const statsConf = editedConfig as StatsCounterComponentConfig;
                return (
                    <div className="space-y-4">
                        <div><label className="text-sm font-medium">Section Title</label><input type="text" value={statsConf.title} onChange={e => setEditedConfig({...statsConf, title: e.target.value})} className="w-full p-2 border rounded-lg mt-1"/></div>
                        {renderArrayEditor(
                            statsConf.stats,
                            [{ key: 'label', label: 'Label' }, { key: 'value', label: 'Value' }],
                            'Stat',
                            (newItems: Stat[]) => setEditedConfig({...statsConf, stats: newItems})
                        )}
                    </div>
                );
            case 'faq':
                const faqConf = editedConfig as FAQComponentConfig;
                return (
                    <div className="space-y-4">
                        <div><label className="text-sm font-medium">Section Title</label><input type="text" value={faqConf.title} onChange={e => setEditedConfig({...faqConf, title: e.target.value})} className="w-full p-2 border rounded-lg mt-1"/></div>
                        {renderArrayEditor(
                            faqConf.faqs,
                            [{ key: 'question', label: 'Question' }, { key: 'answer', label: 'Answer', type: 'textarea' }],
                            'FAQ',
                            (newItems: FAQ[]) => setEditedConfig({...faqConf, faqs: newItems})
                        )}
                    </div>
                );
            case 'cta':
                const ctaConf = editedConfig as CTAComponentConfig;
                return (
                    <div className="space-y-4">
                        <div><label className="text-sm font-medium">Headline</label><input type="text" value={ctaConf.headline} onChange={e => setEditedConfig({...ctaConf, headline: e.target.value})} className="w-full p-2 border rounded-lg mt-1"/></div>
                        <div><label className="text-sm font-medium">Description</label><textarea value={ctaConf.description} onChange={e => setEditedConfig({...ctaConf, description: e.target.value})} className="w-full p-2 border rounded-lg mt-1"/></div>
                        <div><label className="text-sm font-medium">Button Text</label><input type="text" value={ctaConf.buttonText} onChange={e => setEditedConfig({...ctaConf, buttonText: e.target.value})} className="w-full p-2 border rounded-lg mt-1"/></div>
                        <div><label className="text-sm font-medium">Button Link</label><input type="text" value={ctaConf.buttonLink} onChange={e => setEditedConfig({...ctaConf, buttonLink: e.target.value})} className="w-full p-2 border rounded-lg mt-1"/></div>
                    </div>
                );
            case 'categories_grid':
                const gridConf = editedConfig as CategoriesGridComponentConfig;
                return <div><label className="text-sm font-medium">Section Title</label><input type="text" value={gridConf.title} onChange={e => setEditedConfig({ ...gridConf, title: e.target.value })} className="w-full p-2 border rounded-lg mt-1" /></div>;
            case 'rich_text':
                const richConf = editedConfig as RichTextComponentConfig;
                return <div><label className="text-sm font-medium">Content (HTML allowed)</label><textarea value={richConf.content} onChange={e => setEditedConfig({ ...richConf, content: e.target.value })} rows={10} className="w-full p-2 border rounded-lg mt-1 font-mono text-sm" /></div>;
            case 'syllabus':
            case 'notes':
            case 'information': {
                const config = editedConfig as (SyllabusComponentConfig | NotesComponentConfig | InformationComponentConfig);
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Section Title</label>
                            <input type="text" value={config.title} onChange={e => setEditedConfig({ ...config, title: e.target.value })} className="w-full p-2 border rounded-lg mt-1" />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Content (HTML allowed)</label>
                            <textarea value={config.content} onChange={e => setEditedConfig({ ...config, content: e.target.value })} rows={10} className="w-full p-2 border rounded-lg mt-1 font-mono text-sm" />
                        </div>
                    </div>
                );
            }
            default: return null;
        }
    };

    return <Modal isOpen={isOpen} onClose={onClose} title={`Edit ${component.type.replace(/_/g, ' ')}`}>
        {renderForm()}
        <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
            <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300">Cancel</button>
            <button onClick={handleSave} disabled={isUploading} className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg flex items-center gap-2 hover:bg-indigo-700 disabled:bg-indigo-400">
                {isUploading && <Loader2 className="animate-spin"/>} Save Changes
            </button>
        </div>
    </Modal>;
};


// Footer Links Manager
const FooterLinksManager: React.FC = () => {
    const [links, setLinks] = useState<FooterLink[]>([]);
    const [customPages, setCustomPages] = useState<CustomPage[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [editingLink, setEditingLink] = useState<{ link: FooterLink, index: number } | null>(null);
    const [newLink, setNewLink] = useState({ label: '', path: 'home', type: 'internal' });

    const internalPages = [ { label: 'Home', path: 'home' }, { label: 'My Results', path: 'history' }, { label: 'About Us', path: 'about' }, { label: 'Contact Us', path: 'contact' }, { label: 'Privacy Policy', path: 'privacy' }];

    useEffect(() => {
        const unsubFooter = onSnapshot(doc(db, 'uiSettings', 'footer'), doc => {
            if (doc.exists()) setLinks(doc.data().links || []);
        });
        const q = query(collection(db, 'customPages'), where("status", "==", "published"), orderBy('title'));
        const unsubPages = onSnapshot(q, snap => {
            setCustomPages(snap.docs.map(d => ({...d.data(), id: d.id } as CustomPage)));
        });
        return () => { unsubFooter(); unsubPages(); };
    }, []);

    const handleAddLink = () => {
        if (!newLink.label.trim() || !newLink.path.trim()) return;
        setLinks([...links, { label: newLink.label, path: newLink.path }]);
        setNewLink({ label: '', path: 'home', type: 'internal' });
    };

    const handleUpdateLink = () => {
        if (!editingLink) return;
        const newLinks = [...links];
        newLinks[editingLink.index] = editingLink.link;
        setLinks(newLinks);
        setEditingLink(null);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await setDoc(doc(db, 'uiSettings', 'footer'), { links });
            showMessage('Footer links saved!');
        } catch (e) { showMessage('Failed to save.', true);
        } finally { setIsSaving(false); }
    };
    
    return (
        <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-3"><LinkIcon /> Footer Links</h2>
            <div className="space-y-2 mb-4">
                {links.map((link, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border">
                        <span>{link.label} <span className="text-xs text-gray-500">({link.path})</span></span>
                        <div className="flex gap-2">
                            <button onClick={() => setEditingLink({ link, index })} className="p-1 text-blue-600 hover:bg-blue-100 rounded-full"><Pencil size={16}/></button>
                            <button onClick={() => setLinks(links.filter((_, i) => i !== index))} className="p-1 text-red-600 hover:bg-red-100 rounded-full"><Trash2 size={16}/></button>
                        </div>
                    </div>
                ))}
            </div>
            <div className="border-t pt-4 space-y-2">
                <h3 className="font-semibold text-gray-700">Add New Link</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" value={newLink.label} onChange={e => setNewLink(l => ({...l, label: e.target.value}))} placeholder="Link Label" className="p-2 border rounded-lg"/>
                    <select value={newLink.type} onChange={e => setNewLink(l => ({...l, type: e.target.value, path: ''}))} className="p-2 border rounded-lg bg-white">
                        <option value="internal">Internal Page</option>
                        <option value="custom">Custom Page</option>
                    </select>
                </div>
                <select value={newLink.path} onChange={e => setNewLink(l => ({...l, path: e.target.value}))} className="w-full p-2 border rounded-lg bg-white">
                    {(newLink.type === 'internal' ? internalPages : customPages.map(p => ({ label: p.title, path: p.slug }))).map(p => <option key={p.path} value={p.path}>{p.label}</option>)}
                </select>
                <button onClick={handleAddLink} className="flex items-center gap-2 text-indigo-600 font-semibold text-sm p-1"><PlusCircle size={16}/>Add Link</button>
            </div>
            <button onClick={handleSave} disabled={isSaving} className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400">
                {isSaving ? <Loader2 className="animate-spin"/> : <Save />} Save Footer Links
            </button>
            
            {editingLink && <Modal isOpen={!!editingLink} onClose={() => setEditingLink(null)} title="Edit Link">
                <div className="space-y-4">
                    <input type="text" value={editingLink.link.label} onChange={e => setEditingLink(l => ({...l!, link: {...l!.link, label: e.target.value}}))} className="w-full p-2 border rounded-lg"/>
                    <p className="text-sm text-gray-500">Path cannot be changed. Delete and re-add to change path.</p>
                    <div className="flex justify-end gap-2">
                         <button onClick={() => setEditingLink(null)} className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg">Cancel</button>
                         <button onClick={handleUpdateLink} className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg">Save</button>
                    </div>
                </div>
            </Modal>}
        </div>
    );
};


// AI Theme Editor
const AIThemeEditor = () => {
    const [prompt, setPrompt] = useState('');
    const [generatedCss, setGeneratedCss] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    const PREVIEW_STYLE_ID = 'ai-preview-styles';
    const removePreviewStyles = useCallback(() => document.getElementById(PREVIEW_STYLE_ID)?.remove(), []);
    const applyPreviewStyles = useCallback((css: string) => {
        removePreviewStyles();
        const styleTag = document.createElement('style');
        styleTag.id = PREVIEW_STYLE_ID;
        styleTag.innerHTML = css;
        document.head.appendChild(styleTag);
    }, [removePreviewStyles]);

    useEffect(() => () => removePreviewStyles(), [removePreviewStyles]);

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        setIsLoading(true); setGeneratedCss(null); removePreviewStyles();
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const modelPrompt = `You are a CSS expert. Generate CSS code to customize a web app. The user wants this: "${prompt}". Return only a JSON object with a key "css" and the CSS string as the value. All CSS selectors MUST be prefixed with '#preview-area ' to scope them. Target Tailwind classes like '.bg-indigo-600' for buttons or '.bg-slate-100' for background. Do not include markdown.`;
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash", contents: modelPrompt,
                config: { responseMimeType: "application/json", responseSchema: { type: Type.OBJECT, properties: { css: { type: Type.STRING }}, required: ['css'] } }
            });
            const resultJson = JSON.parse(response.text.trim().match(/{[\s\S]*}/)?.[0] || '{}');
            if (resultJson?.css) {
                setGeneratedCss(resultJson.css);
                applyPreviewStyles(resultJson.css);
                showMessage('Preview generated!');
            } else { throw new Error("AI did not return valid CSS."); }
        } catch (error) { console.error(error); showMessage('Failed to generate UI.', true);
        } finally { setIsLoading(false); }
    };

    const handleApplyChanges = async () => {
        if (!generatedCss) return;
        setIsSaving(true);
        try {
            await setDoc(doc(db, 'uiSettings', 'dynamicStyles'), { css: generatedCss, updatedAt: serverTimestamp() });
            showMessage('UI changes applied successfully!');
        } catch (error) { showMessage('Failed to apply changes.', true);
        } finally { setIsSaving(false); }
    };

    const handleDiscardChanges = () => {
        setGeneratedCss(null); removePreviewStyles(); showMessage('Preview discarded.');
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-3"><Wand2 /> AI Theme Generator</h2>
            <div className="space-y-4">
                <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={3} className="w-full p-2 border rounded-lg" placeholder="e.g., 'A dark theme with green accents and rounded corners.'"/>
                <button onClick={handleGenerate} disabled={isLoading} className="w-full py-2 bg-indigo-600 text-white font-semibold rounded-lg flex items-center justify-center gap-2 disabled:bg-indigo-400">
                    {isLoading ? <><Loader2 className="animate-spin"/> Generating...</> : <><Eye/> Generate Preview</>}
                </button>
            </div>

            <div className="mt-4 border-t pt-4">
                <h3 className="font-semibold text-gray-700 mb-2">Live Preview</h3>
                <div className="border rounded-lg overflow-hidden bg-gray-200">
                    <div id="preview-area" className="transform scale-[0.85] origin-top-left" style={{ height: '380px', width: '118%' }}>
                        <PreviewComponent />
                    </div>
                </div>
            </div>

            {generatedCss && (
                <div className="mt-4 border-t pt-4 flex gap-4">
                    <button onClick={handleApplyChanges} disabled={isSaving} className="flex-1 py-2 bg-green-600 text-white font-semibold rounded-lg flex items-center justify-center gap-2 disabled:bg-green-400">
                        {isSaving ? <Loader2 className="animate-spin"/> : <Save/>} Apply
                    </button>
                    <button onClick={handleDiscardChanges} className="flex-1 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg flex items-center justify-center gap-2">
                        <Trash2/> Discard
                    </button>
                </div>
            )}
        </div>
    );
};

export default ManageUI;