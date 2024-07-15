import { 
    addMenuItem, 
    updateMenuItem, 
    removeMenuItem, 
    viewMenu, 
    checkIfItemExists, 
    changeAvailability 
  } from '../src/server/services/adminService';
  import { menuRepository } from '../src/server/repositories/menuRepository';
  import { MenuItemPayload } from '../src/server/utils/types';
  
  jest.mock('../src/server/repositories/menuRepository', () => ({
    menuRepository: {
      addMenuItem: jest.fn(),
      updateMenuItem: jest.fn(),
      removeMenuItem: jest.fn(),
      findMenuItemById: jest.fn(),
      viewMenu: jest.fn(),
      changeAvailability: jest.fn(),
    },
  }));
  
  describe('Admin Service', () => {
    it('should update an existing menu item', async () => {
      const updatedMenuItem: MenuItemPayload = { id: 1, name: 'Pizza', price: 10.99, mealType: 'Lunch', availability: true };
      (menuRepository.updateMenuItem as jest.Mock).mockResolvedValue({ success: true, menuItemId: 1 });
  
      const callback = jest.fn();
      await updateMenuItem(updatedMenuItem, callback);
  
      expect(callback).toHaveBeenCalledWith({ success: true, menuItemId: 1 });
    });
  
    it('should handle errors when updating a menu item', async () => {
      (menuRepository.updateMenuItem as jest.Mock).mockRejectedValue(new Error('Test Error'));
  
      const callback = jest.fn();
      await updateMenuItem({ id: 1, name: 'Pizza', price: 10.99, mealType: 'Lunch', availability: true }, callback);
  
      expect(callback).toHaveBeenCalledWith({ success: false, message: 'An unexpected error occurred.' });
    });
  
    it('should delete a menu item', async () => {
      (menuRepository.findMenuItemById as jest.Mock).mockResolvedValue(true);
      (menuRepository.removeMenuItem as jest.Mock).mockResolvedValue(undefined);
  
      const callback = jest.fn();
      await removeMenuItem(1, callback);
  
      expect(callback).toHaveBeenCalledWith({ success: true });
    });
  
    it('should handle errors when deleting a menu item', async () => {
      (menuRepository.findMenuItemById as jest.Mock).mockResolvedValue(true);
      (menuRepository.removeMenuItem as jest.Mock).mockRejectedValue(new Error('Test Error'));
  
      const callback = jest.fn();
      await removeMenuItem(1, callback);
  
      expect(callback).toHaveBeenCalledWith({ success: false, message: 'An unexpected error occurred.' });
    });
  
    it('should return "Item not found" when trying to delete a non-existing menu item', async () => {
      (menuRepository.findMenuItemById as jest.Mock).mockResolvedValue(false);
  
      const callback = jest.fn();
      await removeMenuItem(1, callback);
  
      expect(callback).toHaveBeenCalledWith({ success: false, message: 'Menu item not found.' });
    });
  
    it('should view the menu', async () => {
      const menuItems = [{ id: 1, name: 'Pizza', price: 9.99 }];
      (menuRepository.viewMenu as jest.Mock).mockResolvedValue(menuItems);
  
      const callback = jest.fn();
      await viewMenu(callback);
  
      expect(callback).toHaveBeenCalledWith({ success: true, menuItems });
    });
  
    it('should handle errors when viewing the menu', async () => {
      (menuRepository.viewMenu as jest.Mock).mockRejectedValue(new Error('Test Error'));
  
      const callback = jest.fn();
      await viewMenu(callback);
  
      expect(callback).toHaveBeenCalledWith({ success: false, message: 'An unexpected error occurred.' });
    });
  
    it('should check if a menu item exists', async () => {
      (menuRepository.findMenuItemById as jest.Mock).mockResolvedValue(true);
  
      const exists = await checkIfItemExists(1);
  
      expect(exists).toBe(true);
    });
  
    it('should handle errors when checking menu item existence', async () => {
      (menuRepository.findMenuItemById as jest.Mock).mockRejectedValue(new Error('Test Error'));
  
      const exists = await checkIfItemExists(1);
  
      expect(exists).toBe(false);
    });
  
    it('should change the availability of a menu item', async () => {
      (menuRepository.findMenuItemById as jest.Mock).mockResolvedValue(true);
      (menuRepository.changeAvailability as jest.Mock).mockResolvedValue(undefined);
  
      const callback = jest.fn();
      await changeAvailability(1, callback);
  
      expect(callback).toHaveBeenCalledWith({ success: true });
    });
  
    it('should handle errors when changing the availability of a menu item', async () => {
      (menuRepository.findMenuItemById as jest.Mock).mockResolvedValue(true);
      (menuRepository.changeAvailability as jest.Mock).mockRejectedValue(new Error('Test Error'));
  
      const callback = jest.fn();
      await changeAvailability(1, callback);
  
      expect(callback).toHaveBeenCalledWith({ success: false, message: 'An unexpected error occurred.' });
    });
  
    it('should return "Menu item not found" when changing availability of a non-existing menu item', async () => {
      (menuRepository.findMenuItemById as jest.Mock).mockResolvedValue(false);
  
      const callback = jest.fn();
      await changeAvailability(1, callback);
  
      expect(callback).toHaveBeenCalledWith({ success: false, message: 'Menu item not found.' });
    });
  });
  