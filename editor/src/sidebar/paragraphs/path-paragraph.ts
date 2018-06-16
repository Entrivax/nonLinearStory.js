import { bindable, inject, BindingEngine } from 'aurelia-framework';
import { PathParagraphModel } from 'models/project/steps/paragraphs/PathParagraphModel';
import { ProjectManagerService } from 'services/ProjectManagerService';
import { Step } from 'models/project/steps/Step';

@inject(ProjectManagerService, BindingEngine)
export class PathParagraph {
    @bindable() paragraph: PathParagraphModel;
    @bindable() remove: any;
    steps: Step[];

    private subscription;

    constructor(private projectManagerService: ProjectManagerService, private bindingEngine: BindingEngine) {
        this.steps = projectManagerService.getProject().steps;
    }

    paragraphChanged(newValue, oldValue) {
        if (this.subscription) {
            this.subscription.dispose();
            this.subscription = null;
        }
        
        if (newValue) {
            this.subscription = this.bindingEngine.propertyObserver(newValue, 'toStep')
                .subscribe((newValue, oldValue) => this.projectManagerService.requestRedraw());
        }
    }
}