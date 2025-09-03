import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { ChatMessage, CollectedInfo, WorkflowState, LoadingState, Language } from './types';
import { WorkflowStep } from './types';
import { generateSvgStream, createChatForRevisions, continueChatStream, generatePlanStream } from './services/geminiService';
import type { Chat, GenerateContentResponse } from '@google/genai';
import ChatInterface from './components/ChatInterface';
import SvgPreview from './components/SvgPreview';
import SvgCode from './components/SvgCode';
import { ja, AppTexts } from './locales/ja';
import { en } from './locales/en';

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = error => reject(error);
    });
};

const extractSvgCode = (rawResponse: string): string | null => {
    const svgCodeBlockRegex = /```svg\s*([\s\S]*?)```/s;
    const blockMatch = rawResponse.match(svgCodeBlockRegex);
    const textToSearch = blockMatch ? blockMatch[1] : rawResponse;
    const svgTagRegex = /<svg[\s\S]*?<\/svg>/s;
    const svgMatch = textToSearch.match(svgTagRegex);
    return svgMatch ? svgMatch[0] : null;
};

const separateSvgFromText = (rawResponse: string): { text: string; svg: string | null } => {
    const svgCode = extractSvgCode(rawResponse);
    const svgCodeBlockRegex = /```svg\s*[\s\S]*?```\s*/;
    const text = svgCode ? rawResponse.replace(svgCodeBlockRegex, '').trim() : rawResponse.trim();
    return { text, svg: svgCode };
};

const LanguageSelectionScreen: React.FC<{ onSelect: (lang: Language) => void }> = ({ onSelect }) => (
    <div className="flex h-screen w-screen items-center justify-center bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
        <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-xl">
            <h1 className="text-2xl font-bold mb-2">Select Language / 言語を選択</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Please choose your preferred language.</p>
            <div className="flex justify-center space-x-4">
                <button 
                    onClick={() => onSelect('en')} 
                    className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-transform transform hover:scale-105"
                >
                    English
                </button>
                <button 
                    onClick={() => onSelect('ja')} 
                    className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-transform transform hover:scale-105"
                >
                    日本語
                </button>
            </div>
        </div>
    </div>
);


const App: React.FC = () => {
    const [language, setLanguage] = useState<Language | null>(null);
    const [texts, setTexts] = useState<AppTexts>(ja);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [workflowState, setWorkflowState] = useState<WorkflowState>(WorkflowStep.AWAITING_PURPOSE);
    const [collectedInfo, setCollectedInfo] = useState<Partial<CollectedInfo>>({});
    const [svgCode, setSvgCode] = useState<string>('');
    const [loadingState, setLoadingState] = useState<LoadingState>('idle');
    const [error, setError] = useState<string>('');
    const chatRef = useRef<Chat | null>(null);

     useEffect(() => {
        if (language) {
            const selectedTexts = language === 'ja' ? ja : en;
            setTexts(selectedTexts);
            setMessages([{ id: 1, role: 'assistant', content: selectedTexts.initialMessage }]);
            document.documentElement.lang = language;
            document.title = selectedTexts.title;
        }
    }, [language]);

    const addMessage = (message: Omit<ChatMessage, 'id'> & { id?: number }) => {
        setMessages(prev => [...prev, { ...message, id: message.id || Date.now() + Math.random() }]);
    };

    const processStream = async (
        stream: AsyncGenerator<GenerateContentResponse, any, unknown>,
        onComplete: (fullResponse: string) => void
    ) => {
        setLoadingState('streaming');
        const assistantMessageId = Date.now();
        addMessage({ id: assistantMessageId, role: 'assistant', content: '' });

        let fullResponse = '';
        for await (const chunk of stream) {
            const chunkText = chunk.text;
            if (chunkText) {
                fullResponse += chunkText;
                const { text, svg } = separateSvgFromText(fullResponse);

                setMessages(prev => prev.map(m =>
                    m.id === assistantMessageId ? { ...m, content: text } : m
                ));

                if (svg) {
                    setSvgCode(svg);
                }
            }
        }
        onComplete(fullResponse);
    };

    const handleNewMessage = useCallback(async (userInput: string, file?: File) => {
        if (!userInput.trim() && !file) return;

        let userMessageContent = userInput;
        if (file) {
            userMessageContent = `${userInput}\n(${language === 'ja' ? '画像添付あり' : 'Image attached'})`;
        }
        addMessage({ role: 'user', content: userMessageContent });
        
        setLoadingState('waiting');
        setError('');

        try {
            switch (workflowState) {
                case WorkflowStep.AWAITING_PURPOSE:
                    if (userInput.toUpperCase() === 'A' || userInput.toUpperCase() === 'B') {
                        setCollectedInfo({ purpose: userInput.toUpperCase() as 'A' | 'B' });
                        setWorkflowState(WorkflowStep.AWAITING_TEXT);
                        addMessage({ role: 'assistant', content: texts.assistantMessages[WorkflowStep.AWAITING_TEXT] });
                    } else {
                        addMessage({ role: 'assistant', content: texts.errorMessages.invalidInput });
                    }
                    setLoadingState('idle');
                    break;
                case WorkflowStep.AWAITING_TEXT:
                    setCollectedInfo(prev => ({ ...prev, text: userInput }));
                    setWorkflowState(WorkflowStep.AWAITING_ELEMENTS);
                    addMessage({ role: 'assistant', content: texts.assistantMessages[WorkflowStep.AWAITING_ELEMENTS] });
                    setLoadingState('idle');
                    break;
                case WorkflowStep.AWAITING_ELEMENTS:
                    setCollectedInfo(prev => ({ ...prev, elements: userInput }));
                    setWorkflowState(WorkflowStep.AWAITING_PLACEMENT);
                    addMessage({ role: 'assistant', content: texts.assistantMessages[WorkflowStep.AWAITING_PLACEMENT] });
                    setLoadingState('idle');
                    break;
                case WorkflowStep.AWAITING_PLACEMENT:
                    setCollectedInfo(prev => ({ ...prev, placement: userInput }));
                    setWorkflowState(WorkflowStep.AWAITING_DESIGN);
                    addMessage({ role: 'assistant', content: texts.assistantMessages[WorkflowStep.AWAITING_DESIGN]});
                    setLoadingState('idle');
                    break;
                case WorkflowStep.AWAITING_DESIGN:
                    setCollectedInfo(prev => ({ ...prev, design: userInput }));
                    setWorkflowState(WorkflowStep.AWAITING_REFERENCE_IMAGE);
                    addMessage({ role: 'assistant', content: texts.assistantMessages[WorkflowStep.AWAITING_REFERENCE_IMAGE] });
                    setLoadingState('idle');
                    break;
                case WorkflowStep.AWAITING_REFERENCE_IMAGE:
                    const newInfo: Partial<CollectedInfo> = { ...collectedInfo };
                    if (file) {
                        const base64Data = await fileToBase64(file);
                        newInfo.referenceImage = { mimeType: file.type, data: base64Data };
                        newInfo.referenceImageNotes = userInput;
                    } else {
                        const noneKeyword = language === 'ja' ? 'なし' : 'none';
                        newInfo.referenceImageNotes = userInput === noneKeyword ? undefined : userInput;
                    }
                    setCollectedInfo(newInfo);
                    
                    const planStream = await generatePlanStream(newInfo, language!);
                    await processStream(planStream, () => {
                        setWorkflowState(WorkflowStep.AWAITING_CONFIRMATION);
                        setLoadingState('idle');
                    });
                    break;
                 case WorkflowStep.AWAITING_CONFIRMATION:
                    const finalConfirmationInfo = { ...collectedInfo } as CollectedInfo;
                    const yesKeywords = language === 'ja' ? ['はい', 'yes'] : ['yes', 'ok', 'sure', 'yeah', 'yep'];
                     if (!yesKeywords.includes(userInput.trim().toLowerCase())) {
                        finalConfirmationInfo.finalAdjustments = userInput;
                    }
                    setCollectedInfo(finalConfirmationInfo);
                    
                    const { prompt, stream } = await generateSvgStream(finalConfirmationInfo, language!);

                    await processStream(stream, (fullResponse) => {
                        const { text, svg } = separateSvgFromText(fullResponse);

                        setMessages(prev => {
                            const lastMessage = prev[prev.length - 1];
                            const finalMessageText = svg ? texts.assistantMessages[WorkflowStep.AWAITING_REVISIONS] : (text || texts.errorMessages.svgGenerationFailed);
                            return prev.map(m => m.id === lastMessage.id ? { ...m, content: finalMessageText } : m);
                        });

                        if (svg) {
                            setSvgCode(svg);
                            chatRef.current = createChatForRevisions(prompt, fullResponse, finalConfirmationInfo, language!);
                            setWorkflowState(WorkflowStep.AWAITING_REVISIONS);
                        } else {
                            setError(texts.errorMessages.svgExtractionFailed);
                            setSvgCode(texts.errorMessages.svgGenerationFailed);
                        }
                        setLoadingState('idle');
                    });
                    break;
                 case WorkflowStep.AWAITING_REVISIONS:
                    if (chatRef.current) {
                        let imageForRevision: { mimeType: string, data: string } | undefined = undefined;
                        if (file) {
                            const base64Data = await fileToBase64(file);
                            imageForRevision = { mimeType: file.type, data: base64Data };
                        }

                        const revisionStream = await continueChatStream(chatRef.current, userInput, imageForRevision);
                        await processStream(revisionStream, (fullResponse) => {
                             const { text, svg } = separateSvgFromText(fullResponse);

                            setMessages(prev => {
                                const lastMessage = prev[prev.length - 1];
                                if (lastMessage && lastMessage.role === 'assistant' && !text && svg) {
                                    return prev.slice(0, -1);
                                }
                                return prev;
                            });

                            if (svg) {
                                setSvgCode(svg);
                            }
                            setLoadingState('idle');
                        });

                    } else {
                         throw new Error(texts.errorMessages.chatNotInitialized);
                    }
                    break;
            }
        } catch (e) {
            console.error("An error occurred in the application workflow:", e);
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
            setError(errorMessage);
            addMessage({ role: 'assistant', content: `${texts.errorMessages.generalError}${errorMessage}` });
            setLoadingState('idle');
        }
    }, [workflowState, collectedInfo, language, texts]);

    const handleRestart = () => {
        if (language) {
            const selectedTexts = language === 'ja' ? ja : en;
            setMessages([{ id: 1, role: 'assistant', content: selectedTexts.initialMessage }]);
        }
        setWorkflowState(WorkflowStep.AWAITING_PURPOSE);
        setCollectedInfo({});
        setSvgCode('');
        setError('');
        setLoadingState('idle');
        chatRef.current = null;
    };

    const handleSvgCodeChange = (newCode: string) => {
        setSvgCode(newCode);
    };

    if (!language) {
        return <LanguageSelectionScreen onSelect={setLanguage} />;
    }

    return (
        <div className="flex h-screen font-sans bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
            <div className="w-1/2 flex flex-col p-4 h-full">
                <header className="mb-4">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{texts.title}</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{texts.description}</p>
                </header>
                <ChatInterface
                    messages={messages}
                    onSendMessage={handleNewMessage}
                    loadingState={loadingState}
                    workflowState={workflowState}
                    texts={texts.chatInterface}
                />
            </div>
            <div className="w-1/2 flex flex-col p-4 space-y-4 h-full">
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                        <strong className="font-bold">Error: </strong>
                        <span className="block sm:inline">{error}</span>
                    </div>
                )}
                <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                    <h2 className="text-lg font-semibold p-4 border-b border-gray-200 dark:border-gray-700">{texts.preview.title}</h2>
                    <SvgPreview svgCode={svgCode} texts={texts.preview} />
                </div>
                <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                    <h2 className="text-lg font-semibold p-4 border-b border-gray-200 dark:border-gray-700">{texts.code.title}</h2>
                    <SvgCode svgCode={svgCode} onCodeChange={handleSvgCodeChange} texts={texts.code} />
                </div>
                 <button 
                    onClick={handleRestart}
                    className="w-full mt-4 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-colors"
                >
                    {texts.app.restartButton}
                </button>
            </div>
        </div>
    );
};

export default App;
