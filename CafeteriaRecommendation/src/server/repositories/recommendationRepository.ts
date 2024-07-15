import { RowDataPacket } from "mysql2";
import connection from "../utils/database";
import { MenuItem, RatingComment, SentimentData } from "../utils/types";

class RecommendationRepository {
  async getRecentComments(threeMonthsAgo: string): Promise<RatingComment[]> {
    try {
      const [rows] = await connection.query<RatingComment[]>(
        `SELECT menu_item_id, rating, comment 
                FROM Feedback 
                WHERE feedback_date >= ?`,
        [threeMonthsAgo]
      );
      return rows;
    } catch (error) {
      console.error(`Failed to retrieve recent comments: ${error}`);
      throw new Error("Error retrieving recent comments.");
    }
  }

  async getExistingSentiment(menuItemId: number): Promise<SentimentData[]> {
    try {
      const [existingSentiment] = await connection.query<SentimentData[]>(
        "SELECT * FROM Sentiment WHERE menu_item_id = ?",
        [menuItemId]
      );
      return existingSentiment;
    } catch (error) {
      console.error(`Failed to retrieve existing sentiments: ${error}`);
      throw new Error("Error retrieving existing sentiments.");
    }
  }

  async updateSentiments(
    menuItemId: number,
    sentiment: string,
    averageRating: number,
    score: number
  ) {
    try {
      await connection.query(
        "UPDATE Sentiment SET sentiment = ?, average_rating = ?, sentiment_score = ?, date_calculated = CURDATE() WHERE menu_item_id = ?",
        [sentiment, averageRating.toFixed(2), score, menuItemId]
      );
    } catch (error) {
      console.error(`Failed to update sentiments: ${error}`);
      throw new Error("Error updating sentiments.");
    }
  }

  async insertSentiments(
    menuItemId: number,
    sentiment: string,
    averageRating: number,
    score: number
  ) {
    console.log(menuItemId, sentiment, averageRating, score);
    try {
      await connection.query(
        "INSERT INTO Sentiment (menu_item_id, sentiment, average_rating, sentiment_score, date_calculated) VALUES (?, ?, ?, ?, CURDATE())",
        [menuItemId, sentiment, averageRating.toFixed(2), score]
      );
    } catch (error) {
      console.error(`Failed to insert sentiments: ${error}`);
      throw new Error("Error inserting sentiments.");
    }
  }

  async getRolledOutItems(mealType: string, user: any) {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const [userAttributes] = await connection.query<RowDataPacket[]>(
        "SELECT food_type, spice_level, cuisine, sweet_tooth FROM employee_profile WHERE employee_id = ?",
        [user.employeeId]
      );

      console.log("todcay:01", today);
      const [rows] = await connection.query<RowDataPacket[]>(
        `SELECT m.name
                FROM Rolledout_Item ri
                INNER JOIN Menu_Item m ON ri.menu_item_id = m.id
                INNER JOIN Menu_Item_Attribute mia ON m.id = mia.menu_item_id
                WHERE ri.date = ? AND ri.mealType= ?
                ORDER BY (CASE WHEN mia.food_type = ? THEN 0 ELSE 1 END),
                (CASE WHEN mia.spice_level = ? THEN 0 ELSE 1 END),
                (CASE WHEN mia.cuisine = ? THEN 0 ELSE 1 END),
                (CASE WHEN mia.sweet_tooth = ? THEN 0 ELSE 1 END) DESC`,
        [
          today,
          mealType,
          userAttributes[0].food_type,
          userAttributes[0].spice_level,
          userAttributes[0].cuisine,
          userAttributes[0].sweet_tooth,
        ]
      );
      console.log("rows:01", rows);
      return rows.map((row) => row.name);
    } catch (err) {
      console.error("Error fetching rolled out items:", err);
      throw err;
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
}

export const recommendationRepository = new RecommendationRepository();
