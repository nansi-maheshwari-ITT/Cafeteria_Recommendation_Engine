import connection from "../utils/database";
import { RowDataPacket } from "mysql2";

interface User extends RowDataPacket {
  id: number;
  employeeId: string;
  name: string;
  role: 'admin' | 'chef' | 'employee';
}

class UserRepository {
  async login(employeeId: string, name: string): Promise<User | null> {
    const [rows] = await connection.query<User[]>('SELECT * FROM user WHERE employeeId = ? AND name = ?', [employeeId, name]);
    return rows.length > 0 ? rows[0] : null;
  }

  async logLogout(employee_id:any,logType: string ): Promise<void> {
    const date = new Date();
    try {
        await connection.query('INSERT INTO Login_Log (employee_id, log_type, date) VALUES (?, ?, ?)', [employee_id, logType, date]);
    } catch (error) {
        console.error(`Failed to log login: ${error}`);
        throw new Error('Error logging login.');
    }
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
    await connection.query(query, [empId, foodType, spiceLevel, cuisine, sweetTooth]);
    return "Your Profile has been updated successfully.";
  } catch (error) {
    throw new Error("Failed to update profile.");
  }
}

}
export const userRepository = new UserRepository();
