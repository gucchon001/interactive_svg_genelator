import { WorkflowStep } from '../types';
import { AppTexts } from './ja';

export const en: AppTexts = {
    title: "Interactive SVG Generator v1.2",
    description: "Create SVG diagrams for educational content through conversation.",
    languageSelect: "Select Language",

    initialMessage: `Hello! I'm the SVG creation assistant. I'll help you create a diagram.\nIs the diagram for **[A: The problem statement itself]** or **[B: A diagram to help explain the solution]**? Please answer with A or B.`,
    
    assistantMessages: {
        [WorkflowStep.AWAITING_TEXT]: 'Understood.\nPlease copy and paste the problem statement (or explanation text) that will be the basis for the diagram.',
        [WorkflowStep.AWAITING_ELEMENTS]: 'Thank you. To create a diagram from the text you provided, please tell me a few more things.\n\n**[Elements to include]:** List all the specific items to be drawn (e.g., circle, point, arrow, auxiliary line, person, number, label, etc.).',
        [WorkflowStep.AWAITING_PLACEMENT]: 'Got it.\n\n**[Element placement]:** Where and in what relationship should these elements be placed? (e.g., "Place point P at the center of the circle," "Draw a dotted arrow from A to B," etc.)',
        [WorkflowStep.AWAITING_DESIGN]: 'Understood.\n\n**[Design preferences]:** Are there any parts you want to emphasize? Please describe any design preferences, including line styles (solid, dotted, etc.), colors (e.g., "Make the circle red"), and fills. (e.g., "Make the auxiliary line dotted," "Fill a specific area with light gray," "Make this line thicker," etc.)',
        [WorkflowStep.AWAITING_REFERENCE_IMAGE]: '**[Reference Image]** Do you have a reference image? If so, please attach it and explain what you want to reference. (e.g., "I want to use an area chart for an easy-to-understand answer," "Make the background lines of the graph light gray.")\n\nIf you don\'t have a reference image, please enter "none".',
        [WorkflowStep.AWAITING_REVISIONS]: 'How does this look? Please feel free to let me know if you have any revisions.',
    },

    errorMessages: {
        invalidInput: 'Invalid input. Please answer with "A" or "B".',
        generalError: 'An error occurred: ',
        svgGenerationFailed: 'Failed to generate SVG.',
        svgExtractionFailed: 'Failed to extract SVG code from the response.',
        chatNotInitialized: "Chat session not initialized.",
    },
    
    chatInterface: {
        placeholder: "Enter a message...",
        problemButton: "A: Problem Diagram",
        explanationButton: "B: Explanation Diagram",
        previewAlt: "Preview",
    },

    preview: {
        title: "Preview",
        exportButtonTitle: "Export as PNG",
        placeholderTitle: "SVG Preview",
        placeholderDescription: "The generated SVG will be displayed here.",
    },

    code: {
        title: "SVG Code",
        copyButtonTitle: "Copy to Clipboard",
        placeholder: "// Generated SVG code will be displayed here...",
    },

    app: {
        restartButton: "Start Over",
    }
};