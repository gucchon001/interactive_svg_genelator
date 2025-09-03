
import React, { useRef, useState } from 'react';
import DownloadIcon from './icons/DownloadIcon';
import type { AppTexts } from '../locales/ja';

interface SvgPreviewProps {
    svgCode: string;
    texts: AppTexts['preview'];
}

const SvgPreview: React.FC<SvgPreviewProps> = ({ svgCode, texts }) => {
    const svgContainerRef = useRef<HTMLDivElement>(null);
    const [isExporting, setIsExporting] = useState(false);

    const exportToPng = () => {
        if (!svgCode || !svgContainerRef.current) return;
        
        setIsExporting(true);

        const svgElement = svgContainerRef.current.querySelector('svg');
        if(!svgElement) {
            setIsExporting(false);
            return;
        }

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            setIsExporting(false);
            return;
        }

        const svgData = new XMLSerializer().serializeToString(svgElement);
        const img = new Image();
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);

        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            URL.revokeObjectURL(url);

            const pngUrl = canvas.toDataURL('image/png');
            const a = document.createElement('a');
            a.href = pngUrl;
            a.download = 'diagram.png';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setIsExporting(false);
        };
        img.onerror = () => {
            console.error("Failed to load SVG image for export.");
            setIsExporting(false);
            URL.revokeObjectURL(url);
        }
        img.src = url;
    };

    return (
        <div className="relative flex-1 p-4 bg-gray-50 dark:bg-gray-900 flex items-center justify-center overflow-auto">
            {svgCode ? (
                <>
                    <div
                        ref={svgContainerRef}
                        className="w-full h-full"
                        dangerouslySetInnerHTML={{ __html: svgCode }}
                    />
                    <button
                        onClick={exportToPng}
                        disabled={isExporting}
                        className="absolute top-4 right-4 p-2 bg-gray-700 text-white rounded-full hover:bg-gray-800 disabled:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition"
                        title={texts.exportButtonTitle}
                    >
                        {isExporting ? (
                            <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                        ) : (
                            <DownloadIcon />
                        )}
                    </button>
                </>
            ) : (
                <div className="text-center text-gray-500">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="mt-2 text-sm font-semibold">{texts.placeholderTitle}</p>
                    <p className="mt-1 text-sm">{texts.placeholderDescription}</p>
                </div>
            )}
        </div>
    );
};

export default SvgPreview;
