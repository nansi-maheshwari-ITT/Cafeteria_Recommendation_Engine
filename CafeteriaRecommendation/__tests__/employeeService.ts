import { 
    viewMenu, 
    giveFeedback, 
    getRolloutItems, 
    submitVote, 
    viewNotification, 
    updateProfile, 
    viewDiscardedItems, 
    saveDetailedFeedback, 
    LogLogout 
  } from '../src/server/services/employeeService';
  
  import { menuRepository } from '../src/server/repositories/menuRepository';
  import { feedbackRepository } from '../src/server/repositories/feedbackRepository';
  import { recommendationRepository } from '../src/server/repositories/recommendationRepository';
  import { notificationRepository } from '../src/server/repositories/notificationRepository';
  import { userRepository } from '../src/server/repositories/userRepository';
  
  jest.mock('../src/server/repositories/menuRepository', () => ({
    menuRepository: {
      viewMenu: jest.fn(),
      selectMenuItem: jest.fn(),
      getDiscardedItems: jest.fn(),
    },
  }));
  
  jest.mock('../src/server/repositories/feedbackRepository', () => ({
    feedbackRepository: {
      giveFeedback: jest.fn(),
      saveDetailedFeedback: jest.fn(),
    },
  }));
  
  jest.mock('../src/server/repositories/recommendationRepository', () => ({
    recommendationRepository: {
      getRolledOutItems: jest.fn(),
    },
  }));
  
  jest.mock('../src/server/repositories/notificationRepository', () => ({
    notificationRepository: {
      viewNotification: jest.fn(),
    },
  }));
  
  jest.mock('../src/server/repositories/userRepository', () => ({
    userRepository: {
      updateProfile: jest.fn(),
      logLogout: jest.fn(),
    },
  }));
  
  describe('User Service', () => {
    it('should view menu successfully', async () => {
      const menuItems = [{ id: 1, name: 'Pizza', price: 9.99 }];
      (menuRepository.viewMenu as jest.Mock).mockResolvedValue(menuItems);
  
      const callback = jest.fn();
      await viewMenu(callback);
  
      expect(callback).toHaveBeenCalledWith({ success: true, menuItems });
    });
  
    it('should handle errors when viewing menu', async () => {
      (menuRepository.viewMenu as jest.Mock).mockRejectedValue(new Error('Test Error'));
  
      const callback = jest.fn();
      await viewMenu(callback);
  
      expect(callback).toHaveBeenCalledWith({ success: false });
    });
  
    it('should give feedback successfully', async () => {
      const feedbackData = { itemId: 1, comment: 'Delicious!', rating: 5 };
      (feedbackRepository.giveFeedback as jest.Mock).mockResolvedValue(undefined);
  
      const callback = jest.fn();
      await giveFeedback(feedbackData, callback);
  
      expect(callback).toHaveBeenCalledWith({ success: true, message: 'Feedback added successfully' });
    });
  
    it('should handle errors when giving feedback', async () => {
      (feedbackRepository.giveFeedback as jest.Mock).mockRejectedValue(new Error('Test Error'));
  
      const callback = jest.fn();
      await giveFeedback({ itemId: 1, comment: 'Delicious!', rating: 5 }, callback);
  
      expect(callback).toHaveBeenCalledWith({ success: false });
    });
  
    it('should get rollout items successfully', async () => {
      const rolledOutItems = ['Pizza', 'Burger'];
      (recommendationRepository.getRolledOutItems as jest.Mock).mockResolvedValue(rolledOutItems);
  
      const user = { id: 1, username: 'user1' };
      const callback = jest.fn();
      await getRolloutItems(user, callback);
  
      expect(callback).toHaveBeenCalledWith({ status: 'printMessage', message: 'Rolled out item for breakfast is: Pizza\nRolled out item for lunch is: Burger' });
    });
  
    it('should handle no rollout items', async () => {
      (recommendationRepository.getRolledOutItems as jest.Mock).mockResolvedValue([]);
  
      const user = { id: 1, username: 'user1' };
      const callback = jest.fn();
      await getRolloutItems(user, callback);
  
      expect(callback).toHaveBeenCalledWith({ status: 'empty', message: 'No rolled out items for selection' });
    });
  
    it('should handle errors when getting rollout items', async () => {
      (recommendationRepository.getRolledOutItems as jest.Mock).mockRejectedValue(new Error('Test Error'));
  
      const user = { id: 1, username: 'user1' };
      const callback = jest.fn();
      await getRolloutItems(user, callback);
  
      expect(callback).toHaveBeenCalledWith({ status: 'error', message: 'Error getting rollout items' });
    });
  
    it('should submit vote successfully', async () => {
      const item = 'Pizza';
      const mealType = 'lunch';
      const username = 'user1';
      (menuRepository.selectMenuItem as jest.Mock).mockResolvedValue(`Menu item for ${mealType} selected successfully.`);
  
      const callback = jest.fn();
      await submitVote(item, mealType, username, callback);
  
      expect(callback).toHaveBeenCalledWith({ success: true, message: `Menu item for ${mealType} selected successfully.` });
    });
  
    it('should handle errors when submitting vote', async () => {
      (menuRepository.selectMenuItem as jest.Mock).mockRejectedValue(new Error('Test Error'));
  
      const callback = jest.fn();
      await submitVote('Pizza', 'lunch', 'user1', callback);
  
      expect(callback).toHaveBeenCalledWith({ success: false, message: 'Error voting for food' });
    });
  
    it('should view notifications successfully', async () => {
      const notifications = [{ id: 1, message: 'Notification 1' }];
      (notificationRepository.viewNotification as jest.Mock).mockResolvedValue(notifications);
  
      const callback = jest.fn();
      await viewNotification(callback);
  
      expect(callback).toHaveBeenCalledWith({ success: true, notification: notifications });
    });
  
    it('should handle errors when viewing notifications', async () => {
      (notificationRepository.viewNotification as jest.Mock).mockRejectedValue(new Error('Test Error'));
  
      const callback = jest.fn();
      await viewNotification(callback);
  
      expect(callback).toHaveBeenCalledWith({ success: false });
    });
  
    it('should update profile successfully', async () => {
      const profileData = { name: 'John Doe', email: 'john@example.com' };
      const employeeId = 1;
      (userRepository.updateProfile as jest.Mock).mockResolvedValue(profileData);
  
      const callback = jest.fn();
      await updateProfile(profileData, employeeId, callback);
  
      expect(callback).toHaveBeenCalledWith({ success: true, message: profileData });
    });
  
    it('should handle errors when updating profile', async () => {
      (userRepository.updateProfile as jest.Mock).mockRejectedValue(new Error('Test Error'));
  
      const callback = jest.fn();
      await updateProfile({ name: 'John Doe', email: 'john@example.com' }, 1, callback);
  
      expect(callback).toHaveBeenCalledWith({ success: false, message: "You Have entered wrong data. Please try again." });
    });
  
    it('should view discarded items successfully', async () => {
      const discardedItems = [{ id: 1, name: 'Expired Salad' }];
      (menuRepository.getDiscardedItems as jest.Mock).mockResolvedValue(discardedItems);
  
      const callback = jest.fn();
      await viewDiscardedItems(callback);
  
      expect(callback).toHaveBeenCalledWith({ success: true, discardedItems });
    });
  
    it('should handle errors when viewing discarded items', async () => {
      (menuRepository.getDiscardedItems as jest.Mock).mockRejectedValue(new Error('Test Error'));
  
      const callback = jest.fn();
      await viewDiscardedItems(callback);
  
      expect(callback).toHaveBeenCalledWith({ success: false });
    });
  
    it('should save detailed feedback successfully', async () => {
      const menuItem = 'Pizza';
      const employeeId = 1;
      const question = 'How was the taste?';
      const feedback = 'It was delicious!';
      const feedbackData = { success: true, message: 'Feedback saved successfully' };
      (feedbackRepository.saveDetailedFeedback as jest.Mock).mockResolvedValue(feedbackData);
  
      const callback = jest.fn();
      await saveDetailedFeedback(menuItem, employeeId, question, feedback, callback);
  
      expect(callback).toHaveBeenCalledWith(feedbackData);
    });
  
    it('should handle errors when saving detailed feedback', async () => {
      (feedbackRepository.saveDetailedFeedback as jest.Mock).mockRejectedValue(new Error('Test Error'));
  
      const callback = jest.fn();
      await saveDetailedFeedback('Pizza', 1, 'How was the taste?', 'It was delicious!', callback);
  
      expect(callback).toHaveBeenCalledWith({ success: false });
    });
  
    it('should log logout successfully', async () => {
      const employeeId = 1;
      const logType = 'logout';
      const message = 'Logout successful';
      (userRepository.logLogout as jest.Mock).mockResolvedValue(message);
  
      const callback = jest.fn();
      await LogLogout(employeeId, logType, callback);
  
      expect(callback).toHaveBeenCalledWith({ success: true, message });
    });
  
    it('should handle errors when logging out', async () => {
      (userRepository.logLogout as jest.Mock).mockRejectedValue(new Error('Test Error'));
  
      const callback = jest.fn();
      await LogLogout(1, 'logout', callback);
  
      expect(callback).toHaveBeenCalledWith({ success: false, message: 'Failed to logout!!' });
    });
  });
  