const previewTemplate = require('raw-loader!../templates/previewOutput.ejs');
const compiledTemplate = require('raw-loader!../templates/generatedOutput.ejs');
const storyTemplate = require('raw-loader!../templates/exportationTemplate.ejs');
const nlsLibraryTemplate = require('raw-loader!../../../non-linear-story.js');

import { Project } from 'models/project/Project';
import { singleton, inject } from 'aurelia-framework';
import * as _ from 'lodash';
import { FileSaveService } from './FileSaveService';

@singleton()
@inject(FileSaveService)
export class ProjectCompilerService {
    private previewTemplateCompiled: _.TemplateExecutor;
    private compiledTemplateCompiled: _.TemplateExecutor;
    private storyTemplate: _.TemplateExecutor;

    constructor(private fileSaveService: FileSaveService) { }

    preview(project: Project) {
        if (!this.previewTemplateCompiled) {
            this.previewTemplateCompiled = _.template(previewTemplate);
        }

        let outputHtml = this.previewTemplateCompiled({
            nlsScript: nlsLibraryTemplate,
            storyScript: this.compileStory(project),
            project: $.extend(true, {}, project)
        });

        let htmlBlob = new Blob([ outputHtml ], { type: 'text/html' });
        let url = URL.createObjectURL(htmlBlob);
        let preview = window.open(url);
        let openDate = new Date();
        let timer = setInterval(function() { 
            if (preview.closed) {
                let closeDate = new Date();
                if (closeDate.getTime() - openDate.getTime() < 800) {
                    alert('You seems to have an adblocker which is blocking the preview window. If you want to use this feature, please disable it.');
                }
                clearInterval(timer);
                URL.revokeObjectURL(url);
            }
        }, 500);
    }

    compile(project: Project) {
        if (!this.compiledTemplateCompiled) {
            this.compiledTemplateCompiled = _.template(compiledTemplate);
        }

        let outputHtml = this.compiledTemplateCompiled({
            project: $.extend(true, {}, project)
        });

        let zip = new JSZip();
        zip.file('index.html', outputHtml);
        var jsdir = zip.folder('js');
        jsdir.file('story.js', this.compileStory(project));
        jsdir.file('non-linear-story.js', nlsLibraryTemplate);
        var cssdir = zip.folder('css');
        cssdir.file('style.css', project.settings.customStyle);
        zip.generateAsync({type: 'blob'}).then((blob) => this.fileSaveService.saveFile(blob, (project.settings.projectName || 'build') + '.zip'));
    }

    compileStory(project: Project): string {
        if (!this.storyTemplate) {
            this.storyTemplate = _.template(storyTemplate);
        }

        let argument = $.extend(true, {
            escapeString: function(str) {
                return str ? str.replace(/\'/g, '\\\'').replace(/(?:\r\n|\r|\n)/g, '<br>') : ''
            }
        }, project);

        return this.storyTemplate(argument);
    }
}
