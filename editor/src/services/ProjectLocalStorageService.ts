import { singleton, inject } from 'aurelia-framework';
import { Project } from 'models/project/Project';
import { ProjectJsonSerializationService } from './ProjectJsonSerializationService';
import { NotificationService } from 'services/NotificationService';
import { NotificationType } from 'models/ui/NotificationModel';

@singleton()
@inject(ProjectJsonSerializationService, NotificationService)
export class ProjectLocalStorageService {

    constructor(private projectJsonSerializationService: ProjectJsonSerializationService, private notificationService: NotificationService) { }

    save(project: Project) {
        localStorage.setItem('project', this.projectJsonSerializationService.serialize(project));
    }

    load(): Project {
        try {
            return this.projectJsonSerializationService.deserialize(localStorage.getItem('project'));
        } catch (exception) {
            this.notificationService.openNotification(exception.stack, NotificationType.StackTrace);
            return null;
        }
    }
}
