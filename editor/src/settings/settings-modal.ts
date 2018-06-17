import { ProjectManagerService } from 'services/ProjectManagerService';
import { inject, TaskQueue } from 'aurelia-framework';
import { SettingsModalService } from 'settings/settings-modal-service';
import { Step } from 'models/project/steps/Step';

@inject(ProjectManagerService, TaskQueue, SettingsModalService)
export class SettingsModal {
    private projectName: string;
    private startingStep: string;
    private customStyle: string;
    private modal: HTMLElement;
    private steps: Step[];

    constructor(private projectManagerService: ProjectManagerService, private taskQueue: TaskQueue, private settingsModalService: SettingsModalService) {
        this.settingsModalService.registerModal(this);
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

    show() {
        let project = this.projectManagerService.getProject();
        this.projectName = project.settings.projectName;
        this.steps = project.steps;
        this.startingStep = project.settings.startingStep;
        this.customStyle = project.settings.customStyle;
        let $modal = $(this.modal);
        $modal.modal('show');
    }

    close() {
        let $modal = $(this.modal);
        $modal.modal('hide');
    }

    save() {
        let project = this.projectManagerService.getProject();
        project.settings.projectName = this.projectName;
        project.settings.startingStep = this.startingStep;
        project.settings.customStyle = this.customStyle;
        this.projectManagerService.requestSave();
        let $modal = $(this.modal);
        $modal.modal('hide');
        this.projectManagerService.requestRedraw();
    }
}