import { inject, TaskQueue } from 'aurelia-framework';
import { Step } from 'models/project/steps/Step';
import { ProjectManagerService } from 'services/ProjectManagerService';
import { ContextMenu } from 'context-menu/ContextMenu';
import { Vector2 } from 'models/math/Vector2';
import { TextParagraphModel } from 'models/project/steps/paragraphs/TextParagraphModel';
import { PathParagraphModel } from 'models/project/steps/paragraphs/PathParagraphModel';
import { IParagraph } from 'models/project/steps/paragraphs/IParagraph';

@inject(ProjectManagerService, TaskQueue)
export class Sidebar {
    step: Step;
    sidebar: HTMLElement;
    contextMenuViewModel: ContextMenu;
    sortable: HTMLElement;
    sortableInstance: Sortable;
    remove: (IParagraph) => void;

    constructor(private projectManagerService: ProjectManagerService, private taskQueue: TaskQueue) {
        this.projectManagerService.registerSelectStepEventListener(this.onSelectStep.bind(this));
        this.remove = (paragraph: IParagraph) => this.removeParagraph(paragraph);
    }

    get stepName() {
        if (this.step)
            return this.step.name;
        return undefined;
    }

    set stepName(newName: string) {
        if (this.step == null) {
            return;
        }
        this.projectManagerService.renameStep(this.step, newName);
        this.projectManagerService.requestRedraw();
    }

    attached() {
        this.taskQueue.queueMicroTask(() => {
            $(this.sidebar).finish();
            $(this.sidebar).hide(0);
            this.sortableInstance = Sortable.create(this.sortable, {
                handle: '.sort-handle',
                draggable: '.sortable-item',
                onUpdate: (event) => this.changeOrder(event)
            });
        });
    }

    onSelectStep(steps: Step[]) {
        if (steps.length === 1) {
            this.taskQueue.queueMicroTask(() => {
                $(this.sidebar).finish();
                this.step = steps[0];
                this.taskQueue.queueMicroTask(() => {
                    $(this.sidebar).show(200);
                });
            });
        } else {
            this.taskQueue.queueMicroTask(() => {
                $(this.sidebar).finish();
                $(this.sidebar).hide(200, () => {
                    this.step = null;
                });
            });
        }
    }

    removeParagraph(paragraph: IParagraph) {
        for (let i = 0; i < this.step.paragraphs.length; i++) {
            if (this.step.paragraphs[i] === paragraph) {
                this.step.paragraphs.splice(i, 1);
                break;
            }
        }
        this.projectManagerService.requestRedraw();
    }

    changeOrder(event) {
        this.step.paragraphs.splice(event.oldIndex, 0, this.step.paragraphs.splice(event.newIndex, 1)[0]);
    }

    openNewParagraphContextMenu(event) {
        this.contextMenuViewModel.show(new Vector2(event.pageX, event.pageY));
    }

    newTextParagraph() {
        this.step.paragraphs.push(new TextParagraphModel('', false, ''));
        this.contextMenuViewModel.hide();
    }

    newPathParagraph() {
        this.step.paragraphs.push(new PathParagraphModel('', '', false, '', ''));
        this.contextMenuViewModel.hide();
    }
}
