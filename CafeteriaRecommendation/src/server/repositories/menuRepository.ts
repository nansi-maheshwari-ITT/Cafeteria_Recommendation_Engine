import { RowDataPacket } from "mysql2";
import connection from "../utils/database";
import { MenuItem, MenuItemPayload } from "../utils/types";
import { notificationRepository } from "./notificationRepository";

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
      return {
        success: false,
        message: `The menu item '${data.name}' already exists.`,
      };
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
      throw new Error("Error inserting sentiments.");
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
      throw new Error("Error inserting sentiments.");
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

    return recommendedItems.map((item) => item.name);
  }

  async rollOutMenuItems(mealType: string, items: string[]): Promise<string> {
    const today = new Date().toISOString().split("T")[0];

    const [existingRollouts] = await connection.query<RowDataPacket[]>(
      "SELECT * FROM Rolledout_Item WHERE date = ? AND mealType = ?",
      [today, mealType]
    );

    if (existingRollouts.length > 0) {
      return `Today's menu for ${mealType} has already been set. Please update tomorrow.`;
    }

    for (const item of items) {
      const trimmedItem = item.trim();
      const searchPattern = `%${trimmedItem}%`;

      const [menuEntry] = await connection.query<RowDataPacket[]>(
        "SELECT id FROM menu_item WHERE name LIKE ? AND mealType = ?",
        [searchPattern, mealType]
      );

      if (menuEntry.length === 0) {
        return `The item "${trimmedItem}" is not found in the ${mealType} menu.`;
      }

      await connection.query(
        "INSERT INTO Rolledout_Item (menu_item_id, mealType, date) VALUES (?, ?, ?)",
        [menuEntry[0].id, mealType, today]
      );
    }

    return `The menu items for ${mealType} have been successfully rolled out.`;
  }

  async selectMenuItem(
    menuItemName: string,
    mealTime: string,
    username: string
  ): Promise<string> {
    const formattedName = `%${menuItemName}%`;
    const date = new Date(new Date().setDate(new Date().getDate() + 1))
      .toISOString()
      .split("T")[0];

    const [[user]] = await connection.query<RowDataPacket[]>(
      "SELECT employeeId FROM User WHERE name = ?",
      [username]
    );
    if (!user) {
      return `User ${username} not found.`;
    }

    const [[existingSelection]] = await connection.query<RowDataPacket[]>(
      "SELECT * FROM Employee_Selection WHERE emp_id = ? AND date = ? AND mealType = ?",
      [user.employeeId, date, mealTime]
    );
    if (existingSelection) {
      return `You have already selected the ${mealTime} item for tomorrow.`;
    }

    const [[menuItem]] = await connection.query<RowDataPacket[]>(
      "SELECT id FROM menu_item WHERE name LIKE ? AND mealType = ?",
      [formattedName, mealTime]
    );
    if (!menuItem) {
      return `Menu item ${menuItemName} does not exist for ${mealTime}.`;
    }

    await connection.query(
      "INSERT INTO Employee_Selection (emp_id, menu_item_id, mealType, date) VALUES (?, ?, ?, ?)",
      [user.employeeId, menuItem.id, mealTime, date]
    );
    return `Menu item for ${mealTime} selected successfully.`;
  }

  async getRolledOutItems(mealType: string, user: any) {
    try {
      const [userAttributes] = await connection.query<RowDataPacket[]>(
        "SELECT food_preference, spice_level, cuisine, sweet_tooth FROM employee_profile WHERE employee_id = ?",
        [user.employeeId]
      );
      const today = new Date().toISOString().split("T")[0];
      const [rows] = await connection.query<RowDataPacket[]>(
        `SELECT Menu_Item.name
           FROM Rolledout_Item ri
         INNER JOIN Menu_Item m ON ri.menu_item_id = m.id
            INNER JOIN Menu_Item_Attribute mia ON m.id = mia.menu_item_id
            WHERE ri.date = ? AND ri.meal_time = ?
            ORDER BY (CASE WHEN mia.food_type = ? THEN 0 ELSE 1 END),
            (CASE WHEN mia.spice_level = ? THEN 0 ELSE 1 END),
            (CASE WHEN mia.cuisine = ? THEN 0 ELSE 1 END),
            (CASE WHEN mia.sweet_tooth = ? THEN 0 ELSE 1 END) DESC`,
        [
          today,
          mealType,
          userAttributes[0].food_preference,
          userAttributes[0].spice_level,
          userAttributes[0].cuisine,
          userAttributes[0].sweet_tooth,
        ]
      );
      const items = rows.map((row) => row.name);
      console.log(`Rolled out items for ${mealType}: ${items.join(", ")},`);
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

  async isItemValid(mealType: string, item: string): Promise<boolean> {
    const searchPattern = `%${item.trim()}%`;
    const [menuEntry] = await connection.query<RowDataPacket[]>(
      "SELECT id FROM menu_item WHERE name LIKE ? AND mealType = ?",
      [searchPattern, mealType]
    );
    return menuEntry.length > 0;
  }

  async checkVotes(mealTime: string): Promise<string[]> {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const formattedDate = tomorrow.toISOString().slice(0, 10);
    console.log("tomorrow:", formattedDate, mealTime);

    const [responses] = await connection.query<RowDataPacket[]>(
      `SELECT menu_item.name, COUNT(Employee_Selection.menu_item_id) as vote_count
       FROM Employee_Selection
       JOIN menu_item ON Employee_Selection.menu_item_id = menu_item.id
       WHERE Employee_Selection.date = ? AND Employee_Selection.mealType = ?
       GROUP BY Employee_Selection.menu_item_id`,
      [formattedDate, mealTime]
    );

    let responseMessages: string[] = [];

    responseMessages.push(
      `\x1b[34m=== Voting Results for ${mealTime} ===\x1b[0m`
    );

    if (responses.length > 0) {
      responses.forEach((response: any) => {
        const itemMessage = `\n\x1b[33mMenu Item:\x1b[0m ${response.name}\n\x1b[32mVotes Received:\x1b[0m ${response.vote_count}\n`;
        responseMessages.push(itemMessage);
      });
    } else {
      const noVotesMessage = `\n\x1b[31mNo votes recorded for ${mealTime} tomorrow.\x1b[0m\n`;
      responseMessages.push(noVotesMessage);
    }

    responseMessages.push(`\n\x1b[34m==============================\x1b[0m\n`);

    return responseMessages;
  }

  async fetchMenuItemsForMeal(
    tomorrow: string,
    mealTime: string
  ): Promise<RowDataPacket[]> {
    const query = `
    SELECT menu_item.name, COUNT(Employee_Selection.menu_item_id) as votes
    FROM Employee_Selection
    JOIN menu_item ON Employee_Selection.menu_item_id = menu_item.id
    WHERE Employee_Selection.date = ? AND Employee_Selection.mealType = ?
    GROUP BY Employee_Selection.menu_item_id
    ORDER BY votes DESC
  `;

    const [results] = await connection.query<RowDataPacket[]>(query, [
      tomorrow,
      mealTime,
    ]);
    return results;
  }

  async saveSelectedMeal(meals: {
    breakfast: string;
    lunch: string;
    dinner: string;
  }): Promise<string> {
    const currentDate = new Date().toISOString().split("T")[0];

    const [breakfastItem] = await connection.query<RowDataPacket[]>(
      "SELECT id FROM menu_item WHERE name = ?",
      [meals.breakfast]
    );
    const [lunchItem] = await connection.query<RowDataPacket[]>(
      "SELECT id FROM menu_item WHERE name = ?",
      [meals.lunch]
    );
    const [dinnerItem] = await connection.query<RowDataPacket[]>(
      "SELECT id FROM menu_item WHERE name = ?",
      [meals.dinner]
    );

    await connection.query(
      `INSERT INTO Selected_Meal (menu_item_id, mealType, date)
     VALUES (?, 'breakfast', ?), (?, 'lunch', ?), (?, 'dinner', ?)`,
      [
        breakfastItem[0].id,
        currentDate,
        lunchItem[0].id,
        currentDate,
        dinnerItem[0].id,
        currentDate,
      ]
    );

    await notificationRepository.addNotification(
      "employee",
      `Today's meals: Breakfast - ${meals.breakfast}, Lunch - ${meals.lunch}, Dinner - ${meals.dinner}.`,
      1
    );

    return "Meals for today have been successfully recorded.";
  }

  async updateProfile(profileData: any, empId: number): Promise<string> {
    const { foodType, spiceLevel, cuisine, sweetTooth } = profileData;
    const query = `
    INSERT INTO employee_profile (
      employee_id, food_type, spice_level, cuisine, sweet_tooth
    ) VALUES (?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE 
      food_type = VALUES(food_type), 
      spice_level = VALUES(spice_level), 
      cuisine = VALUES(cuisine), 
      sweet_tooth = VALUES(sweet_tooth)
  `;
    try {
      await connection.query(query, [
        empId,
        foodType,
        spiceLevel,
        cuisine,
        sweetTooth,
      ]);
      return "Your profile has been updated successfully.";
    } catch (error) {
      throw new Error("Failed to update profile.");
    }
  }
}

export const menuRepository = new MenuRepository();
