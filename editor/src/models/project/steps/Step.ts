import { IParagraph } from "./paragraphs/IParagraph";

export class Step {
    name: string = '';
    onPreDisplayEvent: string = '';
    onDisplayedEvent: string = '';
    paragraphs: IParagraph[] = [];
    x: number = 0;
    y: number = 0;
}