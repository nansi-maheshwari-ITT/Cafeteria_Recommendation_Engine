import { menuRepository } from '../repositories/menuRepository';
import { MenuItemPayload } from '../utils/types';

export async function addMenuItem({ name, price, mealType, availability }: MenuItemPayload, profileData: any) {
  try {
    const menuItemId = await menuRepository.addMenuItem({ name, price, mealType, availability }, profileData);
    return { success: true, menuItemId };
  } catch (err) {
    console.error('Error adding menu item:', err);
    return { success: false };
  }
}

export async function updateMenuItem(data: MenuItemPayload, callback: Function) {
  try {
    const result = await menuRepository.updateMenuItem(data);
    if (result.success) {
      callback({ success: true, menuItemId: result.menuItemId });
    } else {
      callback({ success: false, message: result.message });
    }
  } catch (error) {
    console.error('Failed to update menu item:', error);
    callback({ success: false, message: 'An unexpected error occurred.' });
  }
}

export async function changeAvailability(id: number, callback: Function) {
  try {
    const item = await menuRepository.findMenuItemById(id);
    if (item) {
      await menuRepository.changeAvailability(id, false);
      callback({ success: true });
    } else {
      callback({ success: false, message: 'Menu item not found.' });
    }
  } catch (error) {
    console.error('Failed to change the availability menu item:', error);
    callback({ success: false, message: 'An unexpected error occurred.' });
  }
}

export async function removeMenuItem(id: number, callback: Function) {
  try {
    const item = await menuRepository.findMenuItemById(id);
    if (item) {
      await menuRepository.removeMenuItem(id);
      callback({ success: true });
    } else {
      callback({ success: false, message: 'Menu item not found.' });
    }
  } catch (error) {
    console.error('Failed to delete menu item:', error);
    callback({ success: false, message: 'An unexpected error occurred.' });
  }
}

export async function viewMenu(callback: Function) {
  try {
    const menuItems = await menuRepository.viewMenu();
    callback({ success: true, menuItems });
  } catch (error) {
    console.error('Failed to view menu:', error);
    callback({ success: false, message: 'An unexpected error occurred.' });
  }
}

export async function checkIfItemExists(id: number): Promise<boolean> {
  try {
    const itemExists = await menuRepository.findMenuItemById(id);
    return itemExists !== null;
  } catch (error) {
    console.error('Failed to check if item exists:', error);
    return false;
  }
}
