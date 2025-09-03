import React, { useState, useEffect, useRef } from 'react';
import type { ChatMessage, WorkflowState, LoadingState } from '../types';
import { WorkflowStep } from '../types';
import SendIcon from './icons/SendIcon';
import AttachmentIcon from './icons/AttachmentIcon';
import type { AppTexts } from '../locales/ja';

interface ChatInterfaceProps {
    messages: ChatMessage[];
    onSendMessage: (message: string, file?: File) => void;
    loadingState: LoadingState;
    workflowState: WorkflowState;
    texts: AppTexts['chatInterface'];
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, onSendMessage, loadingState, workflowState, texts }) => {
    const [input, setInput] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const isLoading = loadingState !== 'idle';

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, loadingState]);

    useEffect(() => {
        if (!selectedFile) {
            setPreviewUrl(null);
            return;
        }
        const objectUrl = URL.createObjectURL(selectedFile);
        setPreviewUrl(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);
    }, [selectedFile]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isLoading || (!input.trim() && !selectedFile)) return;
        onSendMessage(input, selectedFile);
        setInput('');
        setSelectedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };
    
    const handlePurposeButtonClick = (purpose: 'A' | 'B') => {
        onSendMessage(purpose);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };
    
    const removeFile = () => {
        setSelectedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }

    const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.kind === 'file' && item.type.startsWith('image/')) {
                const file = item.getAsFile();
                if (file) {
                    setSelectedFile(file);
                    e.preventDefault(); // Prevent image data from being pasted as text
                    return; // Stop after finding the first image
                }
            }
        }
    };


    return (
        <div className="flex flex-col flex-1 bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xl px-4 py-2 rounded-lg shadow whitespace-pre-wrap ${msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-200'}`}>
                           {msg.content.split('**').map((part, index) => 
                                index % 2 === 1 ? <strong key={index}>{part}</strong> : part
                            )}
                        </div>
                    </div>
                ))}
                {loadingState === 'waiting' && (
                     <div className="flex justify-start">
                        <div className="max-w-lg px-4 py-2 rounded-lg shadow bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-200">
                           <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse delay-75"></div>
                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse delay-150"></div>
                           </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                 {workflowState === WorkflowStep.AWAITING_PURPOSE && (
                    <div className="flex justify-center space-x-4 mb-4">
                        <button 
                            onClick={() => handlePurposeButtonClick('A')}
                            disabled={isLoading}
                            className="px-6 py-2 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:bg-purple-300 transition-colors"
                        >
                            {texts.problemButton}
                        </button>
                        <button 
                            onClick={() => handlePurposeButtonClick('B')}
                            disabled={isLoading}
                            className="px-6 py-2 bg-teal-600 text-white font-semibold rounded-lg shadow-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:bg-teal-300 transition-colors"
                        >
                            {texts.explanationButton}
                        </button>
                    </div>
                )}

                {previewUrl && (
                    <div className="mb-2">
                        <div className="relative inline-block mr-2">
                            <img src={previewUrl} alt={texts.previewAlt} className="h-16 w-16 object-cover rounded"/>
                            <button type="button" onClick={removeFile} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 w-5 h-5 flex items-center justify-center text-xs">&times;</button>
                        </div>
                    </div>
                )}
                
                {workflowState !== WorkflowStep.AWAITING_PURPOSE && (
                     <form onSubmit={handleSubmit} className="relative">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={texts.placeholder}
                            disabled={isLoading}
                            rows={workflowState === WorkflowStep.AWAITING_TEXT ? 5 : 2}
                            className="w-full p-3 pr-24 text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmit(e);
                                }
                            }}
                            onPaste={handlePaste}
                        />
                        <div className="absolute right-2.5 bottom-2.5 flex items-center space-x-2">
                            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isLoading} className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:cursor-not-allowed">
                                <AttachmentIcon />
                            </button>
                             <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                            <button type="submit" disabled={isLoading || (!input.trim() && !selectedFile)} className="p-2 text-white bg-blue-600 rounded-full hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-blue-800 transition-colors">
                                <SendIcon />
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ChatInterface;