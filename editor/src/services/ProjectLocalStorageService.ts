import { singleton, inject } from 'aurelia-framework';
import { Project } from 'models/project/Project';
import { ProjectJsonSerializationService } from './ProjectJsonSerializationService';

@singleton()
@inject(ProjectJsonSerializationService)
export class ProjectLocalStorageService {

    constructor(private projectJsonSerializationService: ProjectJsonSerializationService) { }

    save(project: Project) {
        localStorage.setItem('project', this.projectJsonSerializationService.serialize(project));
    }

    load(): Project {
        try {
            return this.projectJsonSerializationService.deserialize(localStorage.getItem('project'));
        } catch (exception) {
            console.error(exception);
            return null;
        }
    }
}