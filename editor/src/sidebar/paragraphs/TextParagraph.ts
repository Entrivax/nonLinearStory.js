import { bindable, bindingMode } from 'aurelia-framework';
import { TextParagraphModel } from 'models/project/steps/paragraphs/TextParagraphModel';

export class TextParagraph {
    @bindable() paragraph: TextParagraphModel;
    @bindable() remove: any;
}