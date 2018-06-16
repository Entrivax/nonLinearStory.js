import { IParagraph } from "./paragraphs/IParagraph";

export class Step {
    name: string = '';
    onDisplayEvent: string = '';
    paragraphs: IParagraph[] = [];
    x: number = 0;
    y: number = 0;
}