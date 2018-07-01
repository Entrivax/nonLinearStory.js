import { Project } from 'models/project/Project';
import { singleton, inject } from 'aurelia-framework';
import { CanvasRenderer } from 'canvas/renderer/CanvasRenderer';
import { Step } from 'models/project/steps/Step';
import { Vector2 } from 'models/math/Vector2';
import { PathParagraphModel } from 'models/project/steps/paragraphs/PathParagraphModel';
import { ProjectLocalStorageService } from './ProjectLocalStorageService';

@singleton()
@inject(ProjectLocalStorageService)
export class ProjectManagerService {
    private project: Project;
    private canvasRenderer: CanvasRenderer;
    private selectedSteps: Step[];

    private selectStepEventListeners: ((selectedSteps: Step[]) => any)[];

    constructor(private projectLocalStorageService: ProjectLocalStorageService) {
        this.selectStepEventListeners = [];
        this.selectedSteps = [];
    }

    initialLoad() {
        let project = this.projectLocalStorageService.load();
        if (!project) {
            this.initProject();
        } else {
            this.project = project;
        }
    }

    initProject() {
        this.project = new Project();
        this.selectedSteps = [];
        let step = new Step();
        step.name = 'startStep';
        step.x = 5;
        step.y = 5;
        this.project.steps.push(step);
        this.project.settings.startingStep = step.name;
    }

    newStep(name: string, position: Vector2) {
        let step = new Step();
        step.x = position.x;
        step.y = position.y;
        this.project.steps.push(step);
        this.renameStep(step, name);
    }

    registerCanvasRenderer(canvasRenderer: CanvasRenderer) {
        this.canvasRenderer = canvasRenderer;
    }

    useProject(project: Project) {
        this.project = project;
        this.requestRedraw();
    }

    getProject() {
        return this.project;
    }

    getSelectedSteps() {
        return this.selectedSteps;
    }

    requestRedraw() {
        if (this.canvasRenderer) {
            this.canvasRenderer.redraw();
        }
    }

    requestSave() {
        this.projectLocalStorageService.save(this.project);
    }

    registerSelectStepEventListener(listener: (selectedSteps: Step[]) => void) {
        if (this.selectStepEventListeners.indexOf(listener) < 0) {
            this.selectStepEventListeners.push(listener);
        }
    }

    unregisterSelectStepEventListener(listener: (selectedSteps: Step[]) => void) {
        let index;
        if ((index = this.selectStepEventListeners.indexOf(listener)) >= 0) {
            this.selectStepEventListeners.splice(index, 1);
        }
    }

    selectStep(step: Step, invert: boolean) {
        if (!invert) {
            this.selectedSteps.length = 0;
        }
        
        var indexOfStep = this.selectedSteps.indexOf(step)
        if (!invert || indexOfStep === -1) {
            if (step != null) {
                this.selectedSteps.push(step);
            }
        } else if (invert && indexOfStep !== -1) {
            this.selectedSteps.splice(indexOfStep, 1);
        }

        this.selectStepEventListeners.forEach((listener) => {
            listener(this.selectedSteps);
        });

        if (this.selectedSteps.length === 0) {
            this.projectLocalStorageService.save(this.project);
        }
    }

    renameStep(step: Step, newName: string) {
        if (this.project.settings.startingStep === step.name && step.name != '') {
            this.project.settings.startingStep = newName;
        }

        let stepWithTheSameName = 0;
        while (this.checkIfStepNameExist(stepWithTheSameName === 0 ? newName : newName + '_' + stepWithTheSameName)) {
            stepWithTheSameName++;
        }
        newName = stepWithTheSameName === 0 ? newName : newName + '_' + stepWithTheSameName;

        if (step.name != '') {
            for (let i = 0; i < this.project.steps.length; i++) {
                let currentStep = this.project.steps[i];
                for (let j = 0; j < currentStep.paragraphs.length; j++) {
                    let paragraph = currentStep.paragraphs[j];
                    if (paragraph.type !== 'path') {
                        continue;
                    }

                    let pathParagraph = (<PathParagraphModel>paragraph);
                    if (pathParagraph.toStep === step.name) {
                        pathParagraph.toStep = newName;
                    }
                }
            }
        }

        step.name = newName;
    }

    removeSteps(steps: Step[]) {
        for (let i = 0; i < this.project.steps.length; i++) {
            let currentStep = this.project.steps[i];
            for (let j = 0; j < currentStep.paragraphs.length; j++) {
                let paragraph = currentStep.paragraphs[j];
                if (paragraph.type !== 'path') {
                    continue;
                }

                let pathParagraph = (<PathParagraphModel>paragraph);
                for (let k = 0; k < steps.length; k++) {
                    if (pathParagraph.toStep === steps[k].name) {
                        pathParagraph.toStep = '';
                    }
                }
            }
        }

        for (let i = 0; i < steps.length; i++) {
            let indexOfStep = this.project.steps.indexOf(steps[i]);
            if (indexOfStep >= 0) {
                this.project.steps.splice(indexOfStep, 1);
            }

            if (steps[i].name == this.project.settings.startingStep) {
                this.project.settings.startingStep = '';
            }
        }
    }

    private checkIfStepNameExist(stepName: string) {
        for (let i = 0; i < this.project.steps.length; i++) {
            let currentStep = this.project.steps[i];
            if (currentStep.name === stepName) {
                return true;
            }
        }
        return false;
    }
}
