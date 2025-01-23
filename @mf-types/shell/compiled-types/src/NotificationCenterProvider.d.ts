import { Dispatch, FC, ReactNode } from 'react';
export type Notification = {
    id: string;
    title: string;
    description: string;
    severity: 'critical' | 'warning' | 'info';
    redirectUrl: string;
    createdOn: Date;
};
export type InternalNotification = Notification & {
    readOn?: Date;
};
export type NotificationCenterContextType = {
    notifications: InternalNotification[];
    dispatch: Dispatch<NotificationCenterActions>;
};
export declare const NotificationCenterContext: import("react").Context<NotificationCenterContextType>;
type NotificationCenterProviderProps = {
    children: ReactNode;
};
export declare enum NotificationActionType {
    PUBLISH = 0,
    UNPUBLISH = 1,
    READ_ALL = 2
}
export type NotificationCenterActions = {
    type: NotificationActionType.PUBLISH;
    notification: Notification;
} | {
    type: NotificationActionType.UNPUBLISH;
    id: string;
} | {
    type: NotificationActionType.READ_ALL;
};
declare const NotificationCenterProvider: FC<NotificationCenterProviderProps>;
export default NotificationCenterProvider;
