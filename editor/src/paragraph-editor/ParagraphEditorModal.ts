import { TaskQueue, autoinject } from "aurelia-framework";
import { ParagraphEditorModalService } from "./ParagraphEditorModalService";

@autoinject()
export class ParagraphEditorModal {
    private originalParagraph: string;
    private paragraph: string;
    private modal: HTMLElement;
    private currentPromise: Promise<string>;
    private promiseResolve: (paragraph: string) => void;

    constructor(private taskQueue: TaskQueue, private paragraphEditorModalService: ParagraphEditorModalService) {
        this.paragraphEditorModalService.registerModal(this);
    }

    attached() {
        this.taskQueue.queueMicroTask(() => {
            let $modal = $(this.modal);
            $modal.modal({
                show: false,
                keyboard: false,
                backdrop: 'static',
                focus: false
            });
        });
    }

    show(paragraph: string): Promise<string> {
        this.currentPromise = new Promise((resolve) => {
            this.promiseResolve = resolve;
        });
        this.originalParagraph = this.paragraph = paragraph.replace(/\n/gm, '<br>');
        let $modal = $(this.modal);
        $modal.modal('show');
        return this.currentPromise;
    }

    close() {
        if (!this.currentPromise) {
            return;
        }
        let $modal = $(this.modal);
        $modal.modal('hide');
        this.promiseResolve(this.originalParagraph.replace(/<br>/gm, '\n').replace(/<div>(\n+)<\/div>/gm, '$1'));
        this.currentPromise = null;
        this.promiseResolve = null;
    }

    save() {
        if (!this.currentPromise) {
            return;
        }
        let $modal = $(this.modal);
        $modal.modal('hide');
        this.promiseResolve(this.paragraph.replace(/<br>/gm, '\n').replace(/<div>(\n+)<\/div>/gm, '$1'));
        this.currentPromise = null;
        this.promiseResolve = null;
    }
}