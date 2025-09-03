import React, { useState, useEffect } from 'react';
import CopyIcon from './icons/CopyIcon';
import type { AppTexts } from '../locales/ja';

interface SvgCodeProps {
    svgCode: string;
    onCodeChange: (newCode: string) => void;
    texts: AppTexts['code'];
}

const SvgCode: React.FC<SvgCodeProps> = ({ svgCode, onCodeChange, texts }) => {
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (copied) {
            const timer = setTimeout(() => setCopied(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [copied]);

    const copyToClipboard = () => {
        if (!svgCode) return;
        navigator.clipboard.writeText(svgCode).then(() => {
            setCopied(true);
        });
    };

    return (
        <div className="relative flex-1 bg-gray-900 dark:bg-black overflow-auto">
            <textarea
                value={svgCode}
                onChange={(e) => onCodeChange(e.target.value)}
                placeholder={texts.placeholder}
                className="w-full h-full p-4 bg-gray-900 dark:bg-black text-sm text-white font-mono whitespace-pre break-all border-0 focus:outline-none focus:ring-0 resize-none"
                spellCheck="false"
            />
            {svgCode && (
                <button
                    onClick={copyToClipboard}
                    className="absolute top-4 right-4 p-2 bg-gray-700 text-white rounded-full hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition"
                    title={texts.copyButtonTitle}
                >
                    {copied ? (
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                         </svg>
                    ) : (
                        <CopyIcon />
                    )}
                </button>
            )}
        </div>
    );
};

export default SvgCode;
