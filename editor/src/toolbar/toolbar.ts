import { inject } from 'aurelia-framework';
import { SettingsModalService } from 'settings/SettingsModalService';
import { ProjectCompilerService } from 'services/ProjectCompilerService';
import { ProjectManagerService } from 'services/ProjectManagerService';
import { ProjectDiskService } from 'services/ProjectDiskService';

@inject(SettingsModalService, ProjectManagerService, ProjectCompilerService, ProjectDiskService)
export class Toolbar {

    constructor(
        private settingsModalService: SettingsModalService,
        private projectManagerService: ProjectManagerService,
        private projectCompilerService: ProjectCompilerService,
        private projectDiskService: ProjectDiskService) { }

    openProjectSettings() {
        this.settingsModalService.show();
    }

    openProject() {
        this.projectDiskService.open((project) => {
            this.projectManagerService.useProject(project);
        });
    }

    saveProject() {
        this.projectDiskService.save(this.projectManagerService.getProject());
    }

    compileProject() {
        this.projectCompilerService.compile(this.projectManagerService.getProject());
    }

    openPreview() {
        this.projectCompilerService.preview(this.projectManagerService.getProject());
    }
}
