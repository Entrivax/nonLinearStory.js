import { TaskQueue, inject } from 'aurelia-framework';

@inject(TaskQueue)
export class Expander {
    private toggleButton: HTMLElement;
    private content: HTMLElement;
    private opened: boolean = false;

    constructor(private taskQueue: TaskQueue) { }

    attached() {
        this.taskQueue.queueMicroTask(() => {
            let $button = $(this.toggleButton);
            let $content = $(this.content);
            $button.click(() => {
                if (this.opened) {
                    $content.slideUp(300);
                    this.opened = false;
                } else {
                    $content.slideDown(300);
                    this.opened = true;
                }
            })

            if (!this.opened) {
                $content.slideUp(0);
            } else {
                $content.slideDown(0);
            }
        });
    }
}