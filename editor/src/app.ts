import { ProjectManagerService } from 'services/ProjectManagerService';
import { inject } from 'aurelia-framework';

@inject(ProjectManagerService)
export class App {
    constructor(private projectManagerService: ProjectManagerService) { }

    attached() {
        this.projectManagerService.initialLoad();
    }
}
