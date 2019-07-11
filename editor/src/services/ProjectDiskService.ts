import { singleton, inject } from 'aurelia-framework';
import { ProjectJsonSerializationService } from './ProjectJsonSerializationService';
import { FileSaveService } from './FileSaveService';
import { Project } from 'models/project/Project';
import { NotificationService } from 'services/NotificationService';
import { NotificationType } from 'models/ui/NotificationModel';

@singleton()
@inject(ProjectJsonSerializationService, FileSaveService, NotificationService)
export class ProjectDiskService {
    private fileInput = $('<input type="file" accept=".json">') as JQuery<HTMLInputElement>;

    constructor(private projectJsonSerializationService: ProjectJsonSerializationService, private fileSaveService: FileSaveService, private notificationService: NotificationService) { }

    open(callback: (project: Project) => void): void {
        this.fileInput.change(() => {
            var reader = new FileReader();

            reader.onload = () => {
                try {
                    callback(this.projectJsonSerializationService.deserialize(<string>reader.result));
                } catch (exception) {
                    this.notificationService.openNotification(exception, NotificationType.StackTrace);
                }
            }

            reader.readAsText(this.fileInput[0].files[0]);
            this.fileInput = $('<input type="file" accept=".json">') as JQuery<HTMLInputElement>;
        })
        this.fileInput.click();
    }

    save(project: Project) {
        this.fileSaveService.saveFile(new Blob([ this.projectJsonSerializationService.serialize(project) ], { type: 'application/json' }), (project.settings.projectName || 'project') + '.json')
    }
}
