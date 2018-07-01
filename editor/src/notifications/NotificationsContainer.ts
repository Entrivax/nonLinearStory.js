import { NotificationService } from 'services/NotificationService';
import { inject } from 'aurelia-framework';
import { NotificationModel, NotificationType } from 'models/ui/NotificationModel';

@inject(NotificationService)
export class NotificationsContainer {
    private notifications: NotificationModel[];

    constructor(private notificationService: NotificationService) {
        this.notifications = [];
        this.notificationService.registerNotificationContainer(this);
    }

    createNotification(message: string, type: NotificationType) {
        let notification = new NotificationModel();
        notification.message = message;
        notification.type = type;
        this.notifications.push(notification);
    }
    
    removeNotif(notification: NotificationModel) {
        for (let i = 0; i < this.notifications.length; i++) {
            if (this.notifications[i] === notification) {
                this.notifications.splice(i, 1);
                break;
            }
        }
    }
}
