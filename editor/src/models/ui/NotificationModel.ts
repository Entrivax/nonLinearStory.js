export class NotificationModel {
    type: NotificationType;
    message: string;
}

export enum NotificationType {
    Info = 'info',
    Error = 'error',
    StackTrace = 'stack-trace',
}
