import { singleton } from 'aurelia-framework';
import { Project } from 'models/project/Project';
import { Step } from 'models/project/steps/Step';
import { TextParagraphModel } from 'models/project/steps/paragraphs/TextParagraphModel';
import { PathParagraphModel } from 'models/project/steps/paragraphs/PathParagraphModel';

@singleton()
export class ProjectJsonSerializationService {
    serialize(project: Project): string {
        return JSON.stringify(project);
    }

    deserialize(jsonProject: string): Project {
        let project = new Project();
        let localProject = JSON.parse(jsonProject);
        
        for (let key in localProject.settings) {
            project.settings[key] = localProject.settings[key];
        }

        for (let i = 0; i < localProject.steps.length; i++) {
            let localStep = <Step>localProject.steps[i];
            let step = new Step();
            step.name = localStep.name;
            step.onDisplayedEvent = localStep.onDisplayedEvent;
            step.onPreDisplayEvent = localStep.onPreDisplayEvent;
            step.x = localStep.x;
            step.y = localStep.y;
            for (let j = 0; j < localStep.paragraphs.length; j++) {
                let localParagraph = localStep.paragraphs[j];
                if (localParagraph.type === 'text') {
                    let localTextParagraph = <TextParagraphModel>localParagraph;
                    step.paragraphs.push(
                        new TextParagraphModel(localTextParagraph.text, localTextParagraph.isTextJavascript,
                            localTextParagraph.isVisibleJavascript)
                    );
                } else if (localParagraph.type === 'path') {
                    let localPathParagraph = <PathParagraphModel>localParagraph;
                    step.paragraphs.push(
                        new PathParagraphModel(localPathParagraph.text, localPathParagraph.toStep,
                            localPathParagraph.isTextJavascript, localPathParagraph.isVisibleJavascript,
                            localPathParagraph.onClickEvent)
                    );
                }
            }

            project.steps.push(step);
        }

        return project;
    }
}