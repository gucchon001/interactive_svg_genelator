import { GoogleGenAI, Chat, Part, GenerateContentResponse } from "@google/genai";
import type { CollectedInfo, Language } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const model = 'gemini-2.5-pro';

const SYSTEM_INSTRUCTION_JA = `あなたは、教育コンテンツ（特に算数や数学）のためのSVG図を作成することに特化した、専門的なアシスタントです。
あなたの主な目的は、ユーザーとの対話を通じて要求を正確に把握し、最終的に白黒およびグレーを基調とした、シンプルで分かりやすいSVGコードを生成することです。

【SVG生成仕様】
- 配色: 基本は黒(#000000)、白(#FFFFFF)、グレー系を使用しますが、ユーザーから色の指定があればそちらを優先します。
- スタイル: SVG内に<style>タグを埋め込み、CSSでスタイルを定義してください。これにより、クリーンで管理しやすいコードを維持します。
- フォント: sans-serif系のフォントを基本とします。
- SVG内のテキスト: SVG内に含まれるすべてのテキストは、日本語で生成してください。
- 視認性: 図は教育目的で使われるため、線、文字、要素が明確に区別でき、分かりやすいことを最優先してください。
- 出力形式: 必ずMarkdownのファイルブロックにSVGコードを記述して出力します。例: \`\`\`svg\n<svg>...</svg>\`\`\`
- viewBox: 必ず適切なviewBox属性を設定してください。
- サイズ: width="100%" height="100%" を設定してください。
- コメント: SVGコード以外の説明やコメントは一切含めないでください。SVGコードブロックのみを出力してください。`;

const SYSTEM_INSTRUCTION_EN = `You are an expert assistant specialized in creating SVG diagrams for educational content, particularly for subjects like mathematics.
Your primary goal is to accurately understand user requirements through conversation and generate simple, easy-to-understand SVG code, primarily using black, white, and grayscale.

【SVG Generation Specifications】
- Color Palette: Primarily use black (#000000), white (#FFFFFF), and grayscale. However, prioritize any specific colors requested by the user.
- Styling: Embed a <style> tag within the SVG and define styles using CSS to maintain clean and manageable code.
- Font: Use a sans-serif font family as the default.
- Text in SVG: All text included within the SVG must be generated in English.
- Readability: Prioritize clarity and legibility, ensuring that lines, text, and elements are clearly distinguishable for educational purposes.
- Output Format: Always output the SVG code within a Markdown code block. Example: \`\`\`svg\n<svg>...</svg>\`\`\`
- viewBox: Always set an appropriate viewBox attribute.
- Sizing: Set width="100%" and height="100%".
- Comments: Do not include any explanations or comments outside of the SVG code. Output only the SVG code block.`;


const REVISION_SYSTEM_INSTRUCTION_JA = `あなたは、教育コンテンツ向けのSVG図を修正する、対話型の専門アシスタントです。
あなたの役割は、ユーザーとの対話を通じて修正指示を深く理解し、必要に応じて質問や提案を行いながら、協力してSVGを完成させることです。

【対話型修正の原則】
1.  **積極的な質問**: ユーザーの指示が曖昧な場合（例：「円を追加して」）、具体的な詳細（位置、サイズ、色、線の太さなど）を明らかにするための質問をしてください。例：「承知いたしました。円を追加しますね。どのあたりに追加しますか？大きさはどのくらいがよろしいでしょうか？」
2.  **意図の確認**: ユーザーの指示の背景にある「なぜそうしたいのか」を考え、より良い提案ができないか検討してください。例：「この線を強調したいのですね。太くする以外に、点線にしたり、色を少し濃くする方法もありますが、いかがでしょうか？」
3.  **簡易的な表現での確認**: SVGコードを生成する前に、変更内容をテキストで具体的に説明してください。座標やサイズなどの数値も使い、ユーザーが変更後のイメージを掴めるようにします。これは「簡易描画」の代わりです。例：「では、円の中心を(x=50, y=50)の位置に、半径20で、線は黒の1px、塗りはなしで描画します。よろしいですか？」
4.  **段階的な合意形成**: 複雑な修正の場合は、一度にすべてを決めようとせず、一つずつ確認を取りながら進めてください。ユーザーが「はい」「OK」などで明確に同意した場合にのみ、次のステップに進むか、SVGコードを生成してください。
5.  **SVGコードの生成**: ユーザーとの間で変更内容について完全に合意が取れた後、最終的なSVGコードを生成してください。

【SVG生成仕様】
- 以前の対話で生成されたSVGをベースに修正を加えてください。
- 配色: 基本は黒(#000000)、白(#FFFFFF)、グレー系を使用しますが、ユーザーから色の指定があればそちらを優先します。
- スタイル: SVG内に<style>タグを埋め込み、CSSでスタイルを定義してください。
- フォント: sans-serif系のフォントを基本とします。
- SVG内のテキスト: SVG内に含まれるすべてのテキストは、日本語で生成してください。
- 視認性: 図が教育目的で使われるため、分かりやすいことを最優先してください。
- 出力形式: ユーザーとの合意が形成された後、修正後のSVGコードのみをMarkdownのファイルブロックに記述して出力します。例: \`\`\`svg\n<svg>...</svg>\`\`\` それまでの対話ではSVGコードを出力しないでください。
- コメント: SVGコード以外の説明やコメントは一切含めないでください。SVGコードブロックのみを出力してください。`;

const REVISION_SYSTEM_INSTRUCTION_EN = `You are an interactive, expert assistant who revises SVG diagrams for educational content.
Your role is to deeply understand user revision instructions through dialogue, ask questions, make suggestions as needed, and collaboratively complete the SVG.

【Principles of Interactive Revision】
1.  **Ask Proactive Questions**: If a user's instruction is ambiguous (e.g., "add a circle"), ask questions to clarify specific details (position, size, color, line thickness, etc.). Example: "Certainly, I'll add a circle. Where would you like to place it? And what size should it be?"
2.  **Confirm Intent**: Consider the "why" behind the user's request and see if you can offer better suggestions. Example: "You want to emphasize this line. Besides making it thicker, we could also make it a dotted line or slightly darken the color. What do you think?"
3.  **Confirm with Simple Descriptions**: Before generating the SVG code, describe the changes in plain text. Use coordinates and sizes to help the user visualize the result. This serves as a "simple sketch." Example: "Okay, I will draw a circle centered at (x=50, y=50) with a radius of 20, a 1px black stroke, and no fill. Does that sound right?"
4.  **Seek Step-by-Step Agreement**: For complex revisions, don't try to decide everything at once. Proceed by confirming one change at a time. Only move to the next step or generate the SVG code after the user explicitly agrees with "yes," "OK," or similar confirmation.
5.  **Generate SVG Code**: After reaching a full agreement with the user on the changes, generate the final SVG code.

【SVG Generation Specifications】
- Modify the SVG based on the previously generated version.
- Color Palette: Primarily use black (#000000), white (#FFFFFF), and grayscale. However, prioritize any specific colors requested by the user.
- Styling: Embed a <style> tag within the SVG and define styles using CSS.
- Font: Use a sans-serif font family.
- Text in SVG: All text included within the SVG must be generated in English.
- Readability: Prioritize clarity for educational purposes.
- Output Format: After reaching an agreement with the user, output only the modified SVG code in a Markdown code block. Example: \`\`\`svg\n<svg>...</svg>\`\`\` Do not output SVG code during the conversation leading up to it.
- Comments: Do not include any explanations or comments outside of the SVG code. Output only the SVG code block.`;

const PLANNING_SYSTEM_INSTRUCTION_JA = `あなたは、ユーザーの要望からSVG図の作成計画を立てる、専門的なアシスタントです。
あなたの目的は、ユーザーが提供した情報（目的、テキスト、要素、配置、デザイン、参考図）を解釈し、これから作成するSVG図の具体的な内容を平易な言葉で説明することです。
これにより、本格的なSVG生成の前にユーザーとの認識を一致させ、手戻りを防ぎます。

【計画立案の原則】
1.  **要望の要約**: ユーザーからの指示を簡潔に要約してください。
2.  **簡易的な図形描画（テキストベース）**: 作成する図のイメージを、具体的な座標やサイズは使わずに、テキストで分かりやすく説明してください。例：「画面の中央に大きめの円を描き、その円の下に『点P』というラベルを配置します。円の右上からは、右肩上がりの点線の矢印を引きます。」
3.  **不明点の確認**: ユーザーの指示に曖昧な点や不足している情報があれば、具体的な質問をしてください。例：「『線Aと線Bを交差させる』とのことですが、どのくらいの角度で交差させますか？直角でよろしいでしょうか？」
4.  **確認の促し**: 最後に、この計画で進めて良いか、ユーザーに確認を求めてください。「この内容で図の作成を進めてよろしいでしょうか？『はい』と入力して続けるか、修正点を教えてください。」といった形で締めくくります。

【出力形式】
- フレンドリーで分かりやすい日本語の文章で計画を説明してください。
- SVGコードやMarkdownのコードブロックは一切含めないでください。
`;

const PLANNING_SYSTEM_INSTRUCTION_EN = `You are an expert assistant who creates a plan to generate an SVG diagram based on user requirements.
Your purpose is to interpret the information provided by the user (purpose, text, elements, placement, design, reference image) and explain the specifics of the SVG diagram to be created in plain language.
This helps align understanding with the user before full SVG generation, preventing rework.

【Planning Principles】
1.  **Summarize Requirements**: Briefly summarize the user's instructions.
2.  **Simple Text-Based Sketch**: Describe the image of the diagram to be created in an easy-to-understand text format, without using specific coordinates or sizes. Example: "I will draw a large circle in the center of the screen, and place a label 'Point P' below it. From the top-right of the circle, I will draw a dotted arrow pointing upwards and to the right."
3.  **Clarify Ambiguities**: If there are any ambiguous or missing pieces of information in the user's instructions, ask specific questions. Example: "You mentioned 'intersecting line A and line B.' At what angle should they intersect? Would a right angle be appropriate?"
4.  **Request Confirmation**: Finally, ask the user for confirmation to proceed with the plan. Conclude with something like, "Shall I proceed with creating the diagram based on this plan? Please enter 'yes' to continue, or let me know if you have any changes."

【Output Format】
- Explain the plan in friendly and clear English.
- Do not include any SVG code or Markdown code blocks.
`;


const getSystemInstruction = (type: 'main' | 'revision' | 'planning', lang: Language): string => {
    if (lang === 'ja') {
        if (type === 'main') return SYSTEM_INSTRUCTION_JA;
        if (type === 'revision') return REVISION_SYSTEM_INSTRUCTION_JA;
        if (type === 'planning') return PLANNING_SYSTEM_INSTRUCTION_JA;
    } else { // en
        if (type === 'main') return SYSTEM_INSTRUCTION_EN;
        if (type === 'revision') return REVISION_SYSTEM_INSTRUCTION_EN;
        if (type === 'planning') return PLANNING_SYSTEM_INSTRUCTION_EN;
    }
    throw new Error('Invalid instruction type or language');
};

const buildPrompt = (info: Partial<CollectedInfo>, lang: Language, type: 'plan' | 'generate'): string => {
    if (lang === 'ja') {
        const purpose = info.purpose === 'A' ? '問題文そのものを表す図' : '解答や解説を分かりやすくするための図';
        const base = type === 'plan' ? 
            `以下の情報に基づいて、SVGの作成計画を立案し、ユーザーに確認してください。` :
            `以下の情報に基づいてSVGコードを生成してください。`;
        
        return `${base}
- 作図の目的: ${purpose}
- 元になるテキスト: ${info.text}
- 図に含める要素: ${info.elements}
- 要素の配置: ${info.placement}
- デザインの希望: ${info.design}
${info.referenceImageNotes ? `- 参考図形に関する指示: ${info.referenceImageNotes}` : ''}
${(info as CollectedInfo).finalAdjustments ? `- 最終的な調整: ${(info as CollectedInfo).finalAdjustments}` : ''}

${type === 'plan' ? '【計画立案の原則】を厳守して、確認メッセージを生成してください。' : '【SVG生成仕様】を厳守して、SVGコードのみを生成してください。'}`;
    } else { // en
         const purpose = info.purpose === 'A' ? 'A diagram representing the problem statement' : 'A diagram to help explain the solution';
         const base = type === 'plan' ?
            `Based on the following information, create a plan for the SVG and confirm with the user.` :
            `Generate SVG code based on the following information.`;

        return `${base}
- Purpose of the diagram: ${purpose}
- Original text: ${info.text}
- Elements to include: ${info.elements}
- Element placement: ${info.placement}
- Design preferences: ${info.design}
${info.referenceImageNotes ? `- Instructions regarding the reference image: ${info.referenceImageNotes}` : ''}
${(info as CollectedInfo).finalAdjustments ? `- Final adjustments: ${(info as CollectedInfo).finalAdjustments}` : ''}

${type === 'plan' ? 'Strictly follow the 【Planning Principles】 to generate the confirmation message.' : 'Strictly follow the 【SVG Generation Specifications】 to generate only the SVG code.'}`;
    }
};

export const generatePlanStream = async (
    info: Partial<CollectedInfo>,
    language: Language
): Promise<AsyncGenerator<GenerateContentResponse, any, unknown>> => {
    const prompt = buildPrompt(info, language, 'plan');
    const parts: Part[] = [{ text: prompt }];

    if (info.referenceImage) {
        parts.push({
            inlineData: {
                mimeType: info.referenceImage.mimeType,
                data: info.referenceImage.data,
            }
        });
    }

    try {
        const stream = await ai.models.generateContentStream({
            model: model,
            contents: { parts: parts },
            config: {
                systemInstruction: getSystemInstruction('planning', language)
            }
        });
        return stream;
    } catch (error) {
        console.error("Error generating plan stream:", error);
        throw new Error("Failed to generate plan from Gemini API.");
    }
};


export const generateSvgStream = async (
    info: CollectedInfo,
    language: Language
): Promise<{ prompt: string, stream: AsyncGenerator<GenerateContentResponse, any, unknown> }> => {
    const prompt = buildPrompt(info, language, 'generate');
    const parts: Part[] = [{ text: prompt }];

    if (info.referenceImage) {
        parts.push({
            inlineData: {
                mimeType: info.referenceImage.mimeType,
                data: info.referenceImage.data,
            }
        });
    }

    try {
        const stream = await ai.models.generateContentStream({
            model: model,
            contents: { parts: parts },
            config: {
                systemInstruction: getSystemInstruction('main', language)
            }
        });

        return { prompt, stream };
    } catch (error) {
        console.error("Error generating SVG stream:", error);
        throw new Error("Failed to generate SVG from Gemini API.");
    }
};

export const createChatForRevisions = (initialPrompt: string, initialSvgResponse: string, info: CollectedInfo, language: Language): Chat => {
    const userParts: Part[] = [{ text: initialPrompt }];
    if (info.referenceImage) {
        userParts.push({
          inlineData: {
            mimeType: info.referenceImage.mimeType,
            data: info.referenceImage.data,
          }
        });
    }

    return ai.chats.create({
        model: model,
        history: [
            { role: 'user', parts: userParts },
            { role: 'model', parts: [{ text: initialSvgResponse }] }
        ],
        config: {
            systemInstruction: getSystemInstruction('revision', language),
        },
    });
};

export const continueChatStream = async (
    chatSession: Chat,
    message: string,
    image: { mimeType: string, data: string } | undefined
): Promise<AsyncGenerator<GenerateContentResponse, any, unknown>> => {
    try {
        const parts: Part[] = [{ text: message }];
        if (image) {
            parts.push({
                inlineData: {
                    mimeType: image.mimeType,
                    data: image.data
                }
            });
        }

        const stream = await chatSession.sendMessageStream({ message: parts });
        return stream;
    } catch (error) {
        console.error("Error continuing chat stream:", error);
        throw new Error("Failed to get revision from Gemini API.");
    }
};