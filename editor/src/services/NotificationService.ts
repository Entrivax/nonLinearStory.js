import { singleton } from 'aurelia-framework';
import { NotificationsContainer } from 'notifications/NotificationsContainer';
import { NotificationType } from 'models/ui/NotificationModel';

@singleton()
export class NotificationService {
    private container: NotificationsContainer;

    registerNotificationContainer(notificationContainer: NotificationsContainer) {
        this.container = notificationContainer;
    }

    openNotification(message: string, type: NotificationType = NotificationType.Info) {
        this.container.createNotification(message, type);
    }
}
