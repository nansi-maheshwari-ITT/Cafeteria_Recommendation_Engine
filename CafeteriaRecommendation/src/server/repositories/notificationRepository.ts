import connection from "../utils/database";

export class NotificationRepository {
    constructor() {}

    async addNotification(role: string, messageContent: string, userId: number): Promise<void> {
        try {
            await connection.query(
                'INSERT INTO Notification (user_role, message, user_id) VALUES (?, ?, ?)',
                [role, messageContent, userId]
            );
            console.log('Notification added successfully.');
        } catch (error) {
            console.error(`Error adding notification: ${error}`);
            throw new Error('Failed to add notification.');
        }
    }

}

export const notificationRepository = new NotificationRepository();
