import { RowDataPacket } from "mysql2";
import connection from "../utils/database";
import { DiscardMenuItem, MenuItem, MenuItemPayload } from "../utils/types";
import { notificationRepository } from "./notificationRepository";

class MenuRepository {
  async findMenuItemByName(name: string): Promise<MenuItem | null> {
    const [rows] = await connection.query<MenuItem[]>(
      "SELECT * FROM menu_item WHERE name = ?",
      [name]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  async addMenuItem({ name, price, mealType, availability }: MenuItemPayload, profileData:any) {
    console.log(name, price, mealType, availability);
    const existingItem = await this.findMenuItemByName(name);
    if (existingItem) {
      throw new Error(`Menu item '${name}' already exists.`);
    }
    const [results] = await connection.query(
      "INSERT INTO menu_item (name, price,mealType, availability) VALUES (?, ?, ?,?)",
      [name, price, mealType, availability]
    );
    const [menu_item_id] = await connection.query<RowDataPacket[]>(
      'SELECT id FROM menu_item WHERE name = ?',
      [name]
  );
  if (menu_item_id.length > 0) {
    await connection.query('INSERT INTO Menu_Item_Attribute (menu_item_id, food_type, spice_level, cuisine, sweet_tooth) VALUES (?, ?, ?, ?, ?)', [menu_item_id[0].id, profileData.foodType, profileData.spiceLevel, profileData.cuisine, profileData.sweetTooth])
}
    return (results as any).insertId;
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

  async changeAvailability(id: number, availability: boolean) {
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

  async removeMenuItem(id: number) {
   
    try {
      // Delete related rows in menu_item_attribute
      await connection.query(
        "DELETE FROM menu_item_attribute WHERE menu_item_id = ?",
        [id]
      );
  
      // Delete the menu item
      await connection.query(
        "DELETE FROM menu_item WHERE id = ?",
        [id]
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
  
  async  selectMenuItem(menuItemName: string, mealTime: string, username: string): Promise<string> {
    const formattedName = `%${menuItemName}%`;
    const date = new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0];
  
    const [[user]] = await connection.query<RowDataPacket[]>('SELECT employeeId FROM User WHERE name = ?', [username]);
    if (!user) {
      return `User ${username} not found.`;
    }
  
    const [[existingSelection]] = await connection.query<RowDataPacket[]>(
      'SELECT * FROM Employee_Selection WHERE emp_id = ? AND date = ? AND mealType = ?',
      [user.employeeId, date, mealTime]
    );
    if (existingSelection) {
      return `You have already selected the ${mealTime} item for tomorrow.`;
    }
  
    const [[menuItem]] = await connection.query<RowDataPacket[]>(
      'SELECT id FROM menu_item WHERE name LIKE ? AND mealType = ?',
      [formattedName, mealTime]
    );
    if (!menuItem) {
      return `Menu item ${menuItemName} does not exist for ${mealTime}.`;
    }
  
    await connection.query(
      'INSERT INTO Employee_Selection (emp_id, menu_item_id, mealType, date) VALUES (?, ?, ?, ?)',
      [user.employeeId, menuItem.id, mealTime, date]
    );
    return `Menu item for ${mealTime} selected successfully.`;
  }

  async  isItemValid(mealType: string, item: string): Promise<boolean> {
    const searchPattern = `%${item.trim()}%`;
    const [menuEntry] = await connection.query<RowDataPacket[]>(
      'SELECT id FROM menu_item WHERE name LIKE ? AND mealType = ?',
      [searchPattern, mealType]
    );
    return menuEntry.length > 0;
  }

  async  checkVotes(mealTime: string): Promise<string[]> {
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
    
    responseMessages.push(`\x1b[34m=== Voting Results for ${mealTime} ===\x1b[0m`);

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

async fetchMenuItemsForMeal(tomorrow: string, mealTime: string): Promise<RowDataPacket[]> {
  const query = `
    SELECT menu_item.name, COUNT(Employee_Selection.menu_item_id) as votes
    FROM Employee_Selection
    JOIN menu_item ON Employee_Selection.menu_item_id = menu_item.id
    WHERE Employee_Selection.date = ? AND Employee_Selection.mealType = ?
    GROUP BY Employee_Selection.menu_item_id
    ORDER BY votes DESC
  `;
  
  const [results] = await connection.query<RowDataPacket[]>(query, [tomorrow, mealTime]);
  return results;
}

async saveSelectedMeal(meals: { breakfast: string, lunch: string, dinner: string }): Promise<string> {
  const currentDate = new Date().toISOString().split('T')[0];

  const [breakfastItem] = await connection.query<RowDataPacket[]>(
    'SELECT id FROM menu_item WHERE name = ?',
    [meals.breakfast]
  );
  const [lunchItem] = await connection.query<RowDataPacket[]>(
    'SELECT id FROM menu_item WHERE name = ?',
    [meals.lunch]
  );
  const [dinnerItem] = await connection.query<RowDataPacket[]>(
    'SELECT id FROM menu_item WHERE name = ?',
    [meals.dinner]
  );

  await connection.query(
    `INSERT INTO Selected_Meal (menu_item_id, mealType, date)
     VALUES (?, 'breakfast', ?), (?, 'lunch', ?), (?, 'dinner', ?)`,
    [breakfastItem[0].id, currentDate, lunchItem[0].id, currentDate, dinnerItem[0].id, currentDate]
  );

  await notificationRepository.addNotification(
    'employee', 
    `Tomorrow's meals: Breakfast - ${meals.breakfast}, Lunch - ${meals.lunch}, Dinner - ${meals.dinner}.`,
    1
  );

  return 'Meals for today have been successfully recorded.';
}


async logMonthlyUsage(usageType: string): Promise<void> {
  try {
      await connection.query('INSERT INTO Monthly_Usage_Log (usage_type, last_used) VALUES (?, CURDATE()) ON DUPLICATE KEY UPDATE last_used = CURDATE()', [usageType]);
  } catch (error) {
      console.error(`Failed to log monthly usage: ${error}`);
  }
}

async fetchDiscardMenuItems(): Promise<DiscardMenuItem[]> {
  try{
      const [rows] = await connection.query<DiscardMenuItem[]>(`
      SELECT m.id, m.name, s.average_rating, s.sentiment_score
      FROM menu_item m
      JOIN Sentiment s ON m.id = s.menu_item_id
      WHERE s.average_rating <= 2
      OR s.sentiment_score <= 20`);
      return rows;
  } catch (error) {
      console.error(`Failed to fetch discard menu items: ${error}`);
      throw new Error('Error fetching discard menu items.');
  }
}

async canUseFeature(usageType: string): Promise<boolean> {
  try {
      const [rows] = await connection.query<RowDataPacket[]>('SELECT last_used FROM Monthly_Usage_Log WHERE usage_type = ?', [usageType]);
      if (rows.length > 0) {
          const lastUsed = new Date(rows[0].last_used);
          const today = new Date();
          return lastUsed.getMonth() !== today.getMonth() || lastUsed.getFullYear() !== today.getFullYear();
      }
      return true;
  } catch (error) {
      console.error(`Failed to check feature usage: ${error}`);
      return false;
  }
}

async deleteMenuItemByName(name: string, availability: boolean):Promise<string> {

  const [availabilityStatus] = await connection.query<RowDataPacket[]>(
    "SELECT availability from  menu_item WHERE name = ?",
    [name]
  );
  console.log("availabilityStatus", availabilityStatus[0]);
  if(availabilityStatus[0].availability === 1){
  await connection.query("SET SQL_SAFE_UPDATES = 0");
  await connection.query(
    "UPDATE menu_item SET availability = ? WHERE name = ?",
    [availability, name]
  );
  await connection.query("SET SQL_SAFE_UPDATES = 1");
  return "Deleted";
}else{
  return "Already Deleted"
}
}

 async  getDiscardedItems(): Promise<string[]> {
  try {
    const [rows] = await connection.query<RowDataPacket[]>(`
      SELECT REPLACE(usage_type, 'getDetailedFeedback-', '') as item_name
      FROM Monthly_Usage_Log
      WHERE usage_type LIKE 'getDetailedFeedback-%'
    `);

    return rows.map(row => row.item_name);
  } catch (error) {
    console.error(`Failed to get discarded items for feedback: ${error}`);
    throw new Error('Error fetching discarded items for feedback.');
  }
}

async checkMenuItem(item: string): Promise<Array<string>> {
  const trimmedItem = item.trim().toLowerCase();
  const [rows] = await connection.query<RowDataPacket[]>(
    'SELECT * FROM menu_item WHERE LOWER(TRIM(name)) = ?',
    [trimmedItem]
  );
  return rows.map((row) => row.name);
}

}

export const menuRepository = new MenuRepository();
