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
  async addMenuItem({ name, price, mealType, availability }: MenuItemPayload) {
    const existingItem = await this.findMenuItemByName(name);
    if (existingItem) {
      return { success: false, message: `Menu item '${name}' already exists.` };
    }
    try {
      const [results] = await connection.query(
        "INSERT INTO menu_item (name, price, mealType, availability) VALUES (?, ?, ?, ?)",
        [name, price, mealType, availability]
      );
      return { success: true, menuItemId: (results as any).insertId };
    } catch (err) {
      console.error("Error adding menu item:", err);
      return { success: false, message: "Error adding menu item." };
    }
  }
  async updateMenuItem({ id, name, price, mealType, availability }: MenuItemPayload) {
    // Check if there is another item with the same name
    const existingItem = await connection.query(
      "SELECT id FROM menu_item WHERE name = ? AND id != ?",
      [name, id]
    );
  
    if (existingItem.length > 0) {
      return { success: false, message: `Menu item '${name}' already exists.` };
    }
  
    try {
      const [results] = await connection.query(
        "UPDATE menu_item SET name = ?, price = ?, mealType = ?, availability = ? WHERE id = ?",
        [name, price, mealType, availability, id]
      );
  
      if ((results as any).affectedRows > 0) {
        return { success: true, menuItemId: id };
      } else {
        return { success: false, message: 'Item not found or no changes made.' };
      }
    } catch (err) {
      console.error("Error updating menu item:", err);
      return { success: false, message: "Error updating menu item." };
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
    await connection.query(
      "UPDATE menu_item SET availability = ? WHERE id = ?",
      [availability, id]
    );
  }
  async viewMenu(): Promise<MenuItem[]> {
    const [rows] = await connection.query<MenuItem[]>(
      "SELECT id, name, price,mealType, availability FROM menu_item"
    );
    return rows;
  }

  async recommendMenu(itemIds: number[]) {
    const [rows] = await connection.query(
      "SELECT * FROM menu_item WHERE id IN (?)",
      [itemIds]
    );
    return rows;
  }

  async viewMonthlyFeedback() {
    const [rows] = await connection.query(`
      SELECT menu_item.name, AVG(feedback.rating) as average_rating, COUNT(feedback.id) as feedback_count
      FROM feedback
      JOIN menu_item ON feedback.menu_item_id = menu_item.id
      WHERE feedback_date >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)
      GROUP BY menu_item.name
    `);
    return rows;
  }

  async getFeedbackById(itemId: number) {
    const [rows] = await connection.query(
      `
      SELECT feedback.comment, feedback.rating, feedback.feedback_date
      FROM feedback
      WHERE feedback.menu_item_id = ?
    `,
      [itemId]
    );
    return rows;
  }

  async setNextDayMenu(itemIds: number[]) {
    await connection.query("UPDATE menu_item SET next_day_menu = FALSE");
    await connection.query(
      "UPDATE menu_item SET next_day_menu = TRUE WHERE id IN (?)",
      [itemIds]
    );
  }

  async getNextDayMenuItems() {
    const [rows] = await connection.query(
      "SELECT * FROM menu_item WHERE next_day_menu = TRUE"
    );
    return rows;
  }
}

export const menuRepository = new MenuRepository();
