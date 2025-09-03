import { WorkflowStep } from '../types';

export const ja = {
    title: "インタラクティブSVGジェネレーター v1.2",
    description: "対話形式で教育用のSVG図を作成します。",
    languageSelect: "言語を選択",
    
    initialMessage: `こんにちは！SVG作図アシスタントです。これから図の作成をお手伝いします。\n作成したいのは**【A：問題文そのものを表す図】**ですか？ それとも **【B：解答や解説を分かりやすくするための図】**ですか？ AかBでお答えください。`,
    
    assistantMessages: {
        [WorkflowStep.AWAITING_TEXT]: '承知いたしました。\nそれでは、図の元になる問題文（または解説文）をコピー＆ペーストで入力してください。',
        [WorkflowStep.AWAITING_ELEMENTS]: 'ありがとうございます。入力いただいた内容から図を作成するために、いくつか追加で教えてください。\n\n**【図に含める要素】：**図に描くべき具体的なモノ（例：円、点、矢印、補助線、人物、数字、ラベルなど）をすべて挙げてください。',
        [WorkflowStep.AWAITING_PLACEMENT]: '承知いたしました。\n\n**【要素の配置】：**それらの要素を、どの位置に、どのような関係で配置しますか？（例：「円の中心に点Pを置く」「AからBに向かって点線の矢印を引く」など）',
        [WorkflowStep.AWAITING_DESIGN]: '承知いたしました。\n\n**【デザインの希望】：**特に強調したい部分はありますか？線の種類（実線、点線など）、色の指定（例：「円を赤色にする」）、塗りつぶしなど、デザインに関する希望を教えてください。（例：「補助線は点線にする」「特定の領域を薄いグレーで塗る」「この線だけ太くする」など）',
        [WorkflowStep.AWAITING_REFERENCE_IMAGE]: '【参考図形】参考になる図形はありますか？ある場合は、画像を添付して、何を参考にしたいのか具体的に教えてください。（例：面積図でわかりやすく回答をしたい、グラフの背景の線は薄いグレーにして）\n\n参考画像がなければ、「なし」と入力してください。',
        [WorkflowStep.AWAITING_REVISIONS]: 'こちらでいかがでしょうか？ 修正したい点があれば、お気軽にお申し付けください。',
    },

    errorMessages: {
        invalidInput: '無効な入力です。「A」または「B」でお答えください。',
        generalError: 'エラーが発生しました: ',
        svgGenerationFailed: 'SVGの生成に失敗しました。',
        svgExtractionFailed: 'Failed to extract SVG code from the response.',
        chatNotInitialized: "Chat session not initialized.",
    },

    chatInterface: {
        placeholder: "メッセージを入力...",
        problemButton: "A：問題文の図",
        explanationButton: "B：解説の図",
        previewAlt: "Preview",
    },

    preview: {
        title: "プレビュー",
        exportButtonTitle: "PNG形式でエクスポート",
        placeholderTitle: "SVGプレビュー",
        placeholderDescription: "生成されたSVGがここに表示されます。",
    },

    code: {
        title: "SVGコード",
        copyButtonTitle: "クリップボードにコピー",
        placeholder: "// 生成されたSVGコードがここに表示されます...",
    },

    app: {
        restartButton: "最初からやり直す",
    }
};

export type AppTexts = typeof ja;