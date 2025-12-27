import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { NotificationService } from './notification.service';

@WebSocketGateway({
    cors: {
        origin: '*',
    },
})
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(NotificationGateway.name);
    private connectedClients: Map<string, Socket> = new Map();

    constructor(private notificationService: NotificationService) { }

    handleConnection(client: Socket) {
        this.logger.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected: ${client.id}`);
        // Remove from connected clients
        for (const [address, socket] of this.connectedClients.entries()) {
            if (socket.id === client.id) {
                this.connectedClients.delete(address);
                break;
            }
        }
    }

    @SubscribeMessage('subscribe')
    handleSubscribe(client: Socket, address: string) {
        const normalizedAddress = address.toLowerCase();
        this.connectedClients.set(normalizedAddress, client);
        this.logger.log(`Client ${client.id} subscribed to ${normalizedAddress}`);

        // Send existing notifications
        const notifications = this.notificationService.getNotifications(normalizedAddress);
        client.emit('notifications', notifications);
    }

    @SubscribeMessage('unsubscribe')
    handleUnsubscribe(client: Socket, address: string) {
        const normalizedAddress = address.toLowerCase();
        this.connectedClients.delete(normalizedAddress);
        this.logger.log(`Client ${client.id} unsubscribed from ${normalizedAddress}`);
    }

    sendNotification(address: string, notification: any) {
        const normalizedAddress = address.toLowerCase();
        const client = this.connectedClients.get(normalizedAddress);

        if (client) {
            client.emit('notification', notification);
        }

        // Store notification
        this.notificationService.addNotification(normalizedAddress, notification);
    }

    broadcastNotification(notification: any) {
        this.server.emit('notification', notification);
    }
}
