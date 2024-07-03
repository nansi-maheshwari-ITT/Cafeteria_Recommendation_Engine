import { Request, Response } from 'express';
import { menuRepository } from '../repositories/menuRepository';
import { MenuItemPayload } from '../utils/types';

export async function addMenuItem({ name, price, mealType, availability }: MenuItemPayload): Promise<any> {
  try {
    const response = await menuRepository.addMenuItem({ name, price, mealType, availability });

    if (response.success) {
      return { success: true, menuItemId: response.menuItemId };
    } else {
      return { success: false, message: response.message };
    }
  } catch (err) {
    console.error('Error adding menu item:', err);
    return { success: false, message: 'Unexpected error occurred.' };
  }
}

export async function updateMenuItem({ id, name, price, mealType, availability }: MenuItemPayload): Promise<any> {
  try {
    const response = await menuRepository.updateMenuItem({ id, name, price, mealType, availability });

    if (response.success) {
      return { success: true, menuItemId: response.menuItemId };
    } else {
      return { success: false, message: response.message };
    }
  } catch (err) {
    console.error('Error updating menu item:', err);
    return { success: false, message: 'Unexpected error occurred.' };
  }
}

export async function deleteMenuItem(id: number): Promise<any> {
  try {
    const item = await menuRepository.findMenuItemById(id);

    if (item) {
      await menuRepository.deleteMenuItem(id, false);
      return { success: true };
    } else {
      return { success: false, message: 'Item not found' };
    }
  } catch (err) {
    console.error('Error deleting menu item:', err);
    return { success: false, message: 'Unexpected error occurred.' };
  }
}

export async function viewMenu(): Promise<any> {
  try {
    const menuItems = await menuRepository.viewMenu();
    return { success: true, menuItems };
  } catch (err) {
    console.error('Error viewing menu:', err);
    return { success: false, message: 'Unexpected error occurred.' };
  }
}

export async function checkIfItemExists(id: number): Promise<boolean> {
  try {
    const existingItem = await menuRepository.findMenuItemById(id);
    return !!existingItem;
  } catch (err) {
    console.error('Error checking menu item existence:', err);
    return false;
  }
}
