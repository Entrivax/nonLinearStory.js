import { Settings } from './settings/Settings';
import { Step } from './steps/Step';

export class Project {
    steps: Step[] = [];
    settings: Settings = new Settings();
}