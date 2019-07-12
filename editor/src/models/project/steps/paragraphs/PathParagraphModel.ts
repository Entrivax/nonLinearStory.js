import { IParagraph } from './IParagraph';

export class PathParagraphModel implements IParagraph {
    text: string;
    isVisibleJavascript: string;
    isTextJavascript: boolean;
    onClickEvent: string;
    toStep: string;
    type: 'path';

    constructor(text: string, toStep: string, isTextJavascript: boolean, isVisibleJavascript: string, onClickEvent: string) {
        this.type = 'path';
        this.text = text;
        this.toStep = toStep;
        this.isTextJavascript = isTextJavascript;
        this.isVisibleJavascript = isVisibleJavascript;
        this.onClickEvent = onClickEvent;
    }
}