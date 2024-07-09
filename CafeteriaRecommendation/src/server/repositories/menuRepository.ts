import { RowDataPacket } from "mysql2";
import connection from "../utils/database";
import { MenuItem, MenuItemPayload } from "../utils/types";

class MenuRepository {
  async findMenuItemByName(name: string): Promise<MenuItem | null> {
    const [rows] = await connection.query<MenuItem[]>(
      "SELECT * FROM menu_item WHERE name = ?",
      [name]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  async addMenuItem(data: MenuItemPayload) {
    const existingItem = await this.findMenuItemByName(data.name);
    if (existingItem) {
      return { success: false, message: `The menu item '${data.name}' already exists.` };
    }

    try {
      const [result] = await connection.query(
        "INSERT INTO menu_item (name, price, mealType, availability) VALUES (?, ?, ?, ?)",
        [data.name, data.price, data.mealType, data.availability]
      );
      return { success: true, menuItemId: (result as any).insertId };
    } catch (error) {
      console.error("Error while adding menu item:", error);
      return { success: false, message: "Unable to add menu item." };
    }
  }

  async updateMenuItem(data: MenuItemPayload) {
    const existingItem = await this.findMenuItemByName(data.name);
    if (existingItem) {
      throw new Error(`Menu item '${data.name}' already exists.`);
    }
    try {
      await connection.query(
        "UPDATE menu_item SET name = ?, price = ?, mealType = ?, availability = ? WHERE id = ?",
        [data.name, data.price, data.mealType, data.availability, data.id]
      );
      return { success: true, menuItemId: data.id };
    } catch (error) {
      console.error("Error while updating menu item:", error);
      return { success: false, message: "Unable to update menu item." };
    }
  }

  async findMenuItemById(id: number): Promise<MenuItem | null> {
    const [rows] = await connection.query<MenuItem[]>(
      "SELECT * FROM menu_item WHERE id = ?",
      [id]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  async deleteMenuItem(id: number, availability: boolean) {
    try {
      await connection.query(
        "UPDATE menu_item SET availability = ? WHERE id = ?",
        [availability, id]
      );
      return { success: true };
    } catch (error) {
      console.error("Error while deleting menu item:", error);
      return { success: false, message: "Unable to delete menu item." };
    }
  }

  async viewMenu(): Promise<MenuItem[]> {
    try {
      const [rows] = await connection.query<MenuItem[]>(
        "SELECT id, name, price, mealType, availability FROM menu_item"
      );
      return rows;
    } catch (error) {
      console.error("Error while fetching menu:", error);
      throw new Error("Unable to fetch menu.");
    }
  }

  async recommendMenu(itemIds: number[]) {
    try {
      const [rows] = await connection.query(
        "SELECT * FROM menu_item WHERE id IN (?)",
        [itemIds]
      );
      return rows;
    } catch (error) {
      console.error("Error while recommending menu:", error);
      throw new Error("Unable to recommend menu.");
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

  async setNextDayMenu(itemIds: number[]) {
    try {
      await connection.query("UPDATE menu_item SET next_day_menu = FALSE");
      await connection.query(
        "UPDATE menu_item SET next_day_menu = TRUE WHERE id IN (?)",
        [itemIds]
      );
      return { success: true };
    } catch (error) {
      console.error("Error while setting next day menu:", error);
      return { success: false, message: "Unable to set next day menu." };
    }
  }

  async getNextDayMenuItems() {
    try {
      const [rows] = await connection.query(
        "SELECT * FROM menu_item WHERE next_day_menu = TRUE"
      );
      return rows;
    } catch (error) {
      console.error("Error while fetching next day menu items:", error);
      throw new Error("Unable to fetch next day menu items.");
    }
  }

  async getMenu(): Promise<MenuItem[]> {
    try {
        const query = `
        SELECT m.*, s.sentiment, s.average_rating, s.sentiment_score 
        FROM menu_item m 
        LEFT JOIN Sentiment s ON m.id = s.menu_item_id`;
        const [menuItems] = await connection.query<MenuItem[]>(query);
        return menuItems;
    } catch (error) {
        console.error(`Failed to insert sentiments: ${error}`);
        throw new Error('Error inserting sentiments.');
    }
  }

  async getRecommendations(): Promise<MenuItem[]> {
    try {
        const query = `
        SELECT m.*, s.sentiment, s.average_rating, s.sentiment_score 
        FROM menu_item m 
        LEFT JOIN Sentiment s ON m.id = s.menu_item_id 
        ORDER BY s.average_rating DESC 
        LIMIT 10`;
        const [menuItems] = await connection.query<MenuItem[]>(query);
        return menuItems;
    } catch (error) {
        console.error(`Failed to insert sentiments: ${error}`);
        throw new Error('Error inserting sentiments.');
    }
  }
  

  async getRecommendedItems(mealTime: string): Promise<string[]> {
    const [recommendedItems] = await connection.query<RowDataPacket[]>(
        `SELECT menu_item.name
        FROM menu_item
        JOIN Sentiment ON menu_item.id = Sentiment.menu_item_id
        WHERE menu_item.mealType = ?
        ORDER BY Sentiment.sentiment_score DESC, Sentiment.average_rating DESC
        LIMIT 5`,
        [mealTime]
    );
    console.log("recommendedItems:01", recommendedItems);
  
    return recommendedItems.map(item => item.name);
  }
  
  async  rollOutMenuItems(mealType: string, items: string[]): Promise<string> {
    const today = new Date().toISOString().split('T')[0];
  
    const [existingRollouts] = await connection.query<RowDataPacket[]>(
      'SELECT * FROM Rolledout_Item WHERE date = ? AND mealType = ?',
      [today, mealType]
    );
  
    if (existingRollouts.length > 0) {
      return `Today's menu for ${mealType} has already been set. Please update tomorrow.`;
    }
  
    for (const item of items) {
      const trimmedItem = item.trim();
      const searchPattern = `%${trimmedItem}%`;
  
      const [menuEntry] = await connection.query<RowDataPacket[]>(
        'SELECT id FROM menu_item WHERE name LIKE ? AND mealType = ?',
        [searchPattern, mealType]
      );
  
      if (menuEntry.length === 0) {
        return `The item "${trimmedItem}" is not found in the ${mealType} menu.`;
      }
  
      await connection.query(
        'INSERT INTO Rolledout_Item (menu_item_id, mealType, date) VALUES (?, ?, ?)',
        [menuEntry[0].id, mealType, today]
      );
    }
  
    return `The menu items for ${mealType} have been successfully rolled out.`;
  }  

  async selectMenuItem(menuItemName: string, mealTime: string, username: string): Promise<string> {
    const formattedName = `%${menuItemName}%`;
    const date = new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0];

    const [[user]] = await connection.query<RowDataPacket[]>('SELECT employeeId FROM User WHERE name = ?', [username]);
    if (!user) {
      const message = `User ${username} not found.`;
      console.log(message);
      return message;
    }

    const [[existingSelection]] = await connection.query<RowDataPacket[]>(
      'SELECT * FROM Employee_Selection WHERE emp_id = ? AND date = ? AND mealType = ?',
      [user.employeeId, date, mealTime]
    );
    if (existingSelection) {
      const message = `You have already selected the ${mealTime} item for tomorrow.`;
      console.log(message);
      return message;
    }

    const [[menuItem]] = await connection.query<RowDataPacket[]>(
      'SELECT id FROM menu_item WHERE name LIKE ? AND mealType = ?',
      [formattedName, mealTime]
    );
    if (!menuItem) {
      const message = `Menu item ${menuItemName} does not exist for ${mealTime}.`;
      console.log(message);
      return message;
    }

    await connection.query(
      'INSERT INTO Employee_Selection (emp_id, menu_item_id, mealType, date) VALUES (?, ?, ?, ?)',
      [user.employeeId, menuItem.id, mealTime, date]
    );
    const successMessage = `Menu item for ${mealTime} selected successfully.`;
    console.log(successMessage);
    return successMessage;
  }

  async getRolledOutItems(mealType: string, user: any) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const [rows] = await connection.query<RowDataPacket[]>(
        `SELECT Menu_Item.name
           FROM Rolledout_Item
           JOIN Menu_Item ON Rolledout_Item.menu_item_id = Menu_Item.id
           WHERE Rolledout_Item.date = ? AND Rolledout_Item.mealType = ?`,
        [today, mealType]
      );
      const items = rows.map(row => row.name);
      console.log(`Rolled out items for ${mealType}: ${items.join(', ')}`);
      return items;
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error fetching rolled out items:", error.message);
      } else {
        console.error("Unexpected error:", error);
      }
      throw error;
    }
  }
}


export const menuRepository = new MenuRepository();
