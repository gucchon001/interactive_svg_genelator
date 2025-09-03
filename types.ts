export interface ChatMessage {
    id: number;
    role: 'user' | 'assistant';
    content: string;
}

export enum WorkflowStep {
    AWAITING_PURPOSE = 'AWAITING_PURPOSE',
    AWAITING_TEXT = 'AWAITING_TEXT',
    AWAITING_ELEMENTS = 'AWAITING_ELEMENTS',
    AWAITING_PLACEMENT = 'AWAITING_PLACEMENT',
    AWAITING_DESIGN = 'AWAITING_DESIGN',
    AWAITING_REFERENCE_IMAGE = 'AWAITING_REFERENCE_IMAGE',
    AWAITING_CONFIRMATION = 'AWAITING_CONFIRMATION',
    GENERATING = 'GENERATING',
    AWAITING_REVISIONS = 'AWAITING_REVISIONS',
}

export type WorkflowState = WorkflowStep;

export type LoadingState = 'idle' | 'waiting' | 'streaming';

export type Language = 'ja' | 'en';

export interface CollectedInfo {
    purpose: 'A' | 'B';
    text: string;
    elements: string;
    placement: string;
    design: string;
    referenceImage?: {
        mimeType: string;
        data: string; // base64
    };
    referenceImageNotes?: string;
    finalAdjustments?: string;
}