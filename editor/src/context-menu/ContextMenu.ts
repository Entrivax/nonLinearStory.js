import { TaskQueue, inject } from "aurelia-framework";
import { Vector2 } from "models/math/Vector2";

@inject(TaskQueue)
export class ContextMenu {
    private contextMenu: HTMLElement;

    private clickOutsideFunc;

    constructor(private taskQueue: TaskQueue) { }

    attached() {
        this.taskQueue.queueMicroTask(() => {
            this.clickOutsideFunc = this.clickOutside.bind(this);
            $(document).bind('mousedown', this.clickOutsideFunc);
            $(this.contextMenu).hide(0);
        })
    }

    detached() {
        $(document).unbind('mousedown', this.clickOutsideFunc);
    }

    show(position: Vector2) {
        let $contextMenu = $(this.contextMenu);
        $contextMenu.finish();
        $contextMenu.show(200).css({
            left: position.x + 'px',
            top: position.y + 'px',
        });
    }

    hide() {
        let $contextMenu = $(this.contextMenu);
        $contextMenu.hide(100);
    }

    private clickOutside(event) {
        let $contextMenu = $(this.contextMenu);
        if ($(event.target).closest($contextMenu[0]).length === 0) {
            this.hide();
        }
    }
}