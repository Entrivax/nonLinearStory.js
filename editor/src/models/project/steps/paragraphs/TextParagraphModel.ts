import { IParagraph } from './IParagraph';

export class TextParagraphModel implements IParagraph {
    text: string;
    isVisibleJavascript: string;
    isTextJavascript: boolean;
    type: 'text';

    constructor(text: string, isTextJavascript: boolean, isVisibleJavascript: string) {
        this.type = 'text';
        this.text = text;
        this.isTextJavascript = isTextJavascript;
        this.isVisibleJavascript = isVisibleJavascript;
    }
}