import { Request, Response } from 'express';
import { menuRepository } from '../repositories/menuRepository';
import { MenuItemPayload } from '../utils/types';

export async function addMenuItem({ name, price, mealType, availability }: MenuItemPayload, callback: Function) {
  try {
      const response = await menuRepository.addMenuItem({ name, price, mealType, availability });

      if (response.success) {
          callback({ success: true, menuItemId: response.menuItemId });
      } else {
          callback({ success: false, message: response.message });
      }
  } catch (err) {
      console.error('Error adding menu item:', err);
      callback({ success: false, message: 'Unexpected error occurred.' });
  }
}

export async function updateMenuItem({ id, name, price,mealType, availability }: MenuItemPayload, callback: Function) {
  try {
    const response = await menuRepository.addMenuItem({ name, price, mealType, availability });
    if (response.success) {
      callback({ success: true, menuItemId: response.menuItemId });
  } else {
      callback({ success: false, message: response.message });
  }
  } catch (err) {
    console.error('Error updating menu item:', err);
    callback({ success: false });
  }
}

export async function deleteMenuItem(id: number, callback: Function) {
    try {
        const item = await menuRepository.findMenuItemById(id);
        if (item) {
          await menuRepository.deleteMenuItem(id, false);
          callback({ success: true });
        } else {
          callback({ success: false, message: 'Item not found' });
        }
      } catch (err) {
        console.error('Error updating menu item availability:', err);
        callback({ success: false });
      }
}

export async function viewMenu(callback: Function) {
  try {
    const menuItems = await menuRepository.viewMenu();
    callback({ success: true, menuItems });
  } catch (err) {
    console.error('Error viewing menu:', err);
    callback({ success: false });
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


