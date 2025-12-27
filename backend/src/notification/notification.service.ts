import { Injectable } from '@nestjs/common';

export interface Notification {
    type: 'ESCROW_CREATED' | 'ESCROW_FUNDED' | 'ESCROW_RELEASED' | 'ESCROW_REFUNDED' | 'DISPUTE_OPENED' | 'DISPUTE_RESOLVED';
    escrowId: string;
    message: string;
    timestamp: Date;
    data?: any;
}

@Injectable()
export class NotificationService {
    private notifications: Map<string, Notification[]> = new Map();

    addNotification(address: string, notification: Notification) {
        const userNotifications = this.notifications.get(address.toLowerCase()) || [];
        userNotifications.push(notification);
        this.notifications.set(address.toLowerCase(), userNotifications);

        // Keep only last 50 notifications per user
        if (userNotifications.length > 50) {
            userNotifications.shift();
        }
    }

    getNotifications(address: string): Notification[] {
        return this.notifications.get(address.toLowerCase()) || [];
    }

    clearNotifications(address: string) {
        this.notifications.delete(address.toLowerCase());
    }
}
