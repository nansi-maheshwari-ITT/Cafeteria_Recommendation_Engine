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

    async viewNotification() {
        try {
          const [rows] = await connection.query(
            'SELECT * FROM notification WHERE user_role = "employee" ORDER BY notification_date DESC LIMIT 10'
          );
          return rows;
        } catch (error) {
          console.error("Error fetching notifications:", error);
          throw error;
        }
      }

}

export const notificationRepository = new NotificationRepository();
