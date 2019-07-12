import { bindable } from 'aurelia-framework';
import { IParagraph } from 'models/project/steps/paragraphs/IParagraph';

export class ParagraphTemplateSelector {
    @bindable() paragraph: IParagraph;
    @bindable() remove: any;
    @bindable() edit: (paragraph: IParagraph) => void;
}