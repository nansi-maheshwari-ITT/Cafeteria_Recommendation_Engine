import { RowDataPacket } from "mysql2";
import connection from "../utils/database";
import { FeedbackPayload } from "../utils/types";



class FeedbackRepository {
  async giveFeedback({ itemId, comment, rating }: FeedbackPayload) {
    const feedbackDate = new Date();
    await connection.query('INSERT INTO feedback (menu_item_id, comment, rating, feedback_date) VALUES (?, ?, ?, ?)', [itemId, comment, rating, feedbackDate]);
  }

  async fetchDetailedFeedback(menu_item_name: any): Promise<RowDataPacket[]> {
    let name:any = "menu _item name not correct";
    try{
        const [menu_item_id] = await connection.query<RowDataPacket[]>('SELECT id as menu_item_id FROM menu_item WHERE name = ?', [menu_item_name]);
        console.log("menu_item_id", menu_item_id.length);
        const [rows] = await connection.query<RowDataPacket[]>('SELECT employeeId, question, response, response_date FROM Feedbacks_Response WHERE menu_item_id = ?', menu_item_id[0].menu_item_id);
        return rows;
    } catch (error) {
        console.error(`Failed to get detailed feedback: ${error}`);
        throw new Error('Error fetching detailed feedback.');
    }
  }

  async  saveDetailedFeedback(menuItem: string, employeeId: number, questions: string[], feedback: string[]): Promise<void> {
    try {
      const [menuItemIdRows] = await connection.query<RowDataPacket[]>('SELECT id FROM menu_item WHERE name = ?', menuItem);
      
      if (menuItemIdRows.length === 0) {
        console.error(`Menu item '${menuItem}' not found.`);
        return;
      }
      
      const menuItemId = menuItemIdRows[0].id;
  
      const values: any[] = [];
      questions.forEach((question, index) => {
        values.push(menuItemId, employeeId, question, feedback[index]);
      });
  
      const query = `
        INSERT INTO Feedbacks_Response (menu_item_id, employeeId, question, response) 
        VALUES ${questions.map((_, index) => "(?, ?, ?, ?)").join(',')}
      `;
      
      await connection.query(query, values);
      
      console.log(`Detailed feedback saved for '${menuItem}' successfully.`);
    } catch (error) {
      console.error(`Failed to save detailed feedback for '${menuItem}':`, error);
      throw error;
    }
  }

  async viewMonthlyFeedback() {
    try {
      const [rows] = await connection.query(`
        SELECT menu_item.name, AVG(feedback.rating) as average_rating, COUNT(feedback.id) as feedback_count
        FROM feedback
        JOIN menu_item ON feedback.menu_item_id = menu_item.id
        WHERE feedback_date >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)
        GROUP BY menu_item.name
      `);
      return rows;
    } catch (error) {
      console.error("Error while fetching monthly feedback:", error);
      throw new Error("Unable to fetch monthly feedback.");
    }
  }

  async getFeedbackById(itemId: number) {
    try {
      const [rows] = await connection.query(
        `
        SELECT feedback.comment, feedback.rating, feedback.feedback_date
        FROM feedback
        WHERE feedback.menu_item_id = ?
      `,
        [itemId]
      );
      return rows;
    } catch (error) {
      console.error("Error while fetching feedback:", error);
      throw new Error("Unable to fetch feedback.");
    }
  }
  
}

export const feedbackRepository = new FeedbackRepository();
