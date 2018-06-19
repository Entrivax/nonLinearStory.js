import { singleton, inject } from 'aurelia-framework';
import { ProjectJsonSerializationService } from './ProjectJsonSerializationService';
import { FileSaveService } from './FileSaveService';
import { Project } from 'models/project/Project';

@singleton()
@inject(ProjectJsonSerializationService, FileSaveService)
export class ProjectDiskService {
    private fileInput = $('<input type="file" accept=".json">') as JQuery<HTMLInputElement>;

    constructor(private projectJsonSerializationService: ProjectJsonSerializationService, private fileSaveService: FileSaveService) { }

    open(callback: (project: Project) => void): void {
        let _this_ = this;
        this.fileInput.change(function() {
            var reader = new FileReader();

            reader.onload = function() {
                try {
                    callback(_this_.projectJsonSerializationService.deserialize(reader.result));
                } catch (exception) {
                    console.error(exception);
                }
            }

            reader.readAsText(this.files[0]);
            _this_.fileInput = $('<input type="file" accept=".json">') as JQuery<HTMLInputElement>;
        })
        this.fileInput.click();
    }

    save(project: Project) {
        this.fileSaveService.saveFile(new Blob([ this.projectJsonSerializationService.serialize(project) ], { type: 'application/json' }), (project.settings.projectName || 'project') + '.json')
    }
}