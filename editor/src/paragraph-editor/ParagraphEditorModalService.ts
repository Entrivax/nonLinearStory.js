import { singleton } from 'aurelia-framework';
import { ParagraphEditorModal } from './ParagraphEditorModal';

@singleton()
export class ParagraphEditorModalService {
    private paragraphEditorModal: ParagraphEditorModal;

    registerModal(paragraphEditorModal: ParagraphEditorModal) {
        this.paragraphEditorModal = paragraphEditorModal;
    }

    show(paragraph: string): Promise<string> {
        return this.paragraphEditorModal.show(paragraph);
    }
}
