import { singleton } from 'aurelia-framework';
import { SettingsModal } from 'settings/SettingsModal';

@singleton()
export class SettingsModalService {
    private settingsModal: SettingsModal;

    registerModal(settingsModal: SettingsModal) {
        this.settingsModal = settingsModal;
    }

    show() {
        this.settingsModal.show();
    }
}
