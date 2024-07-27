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
  
    it('should update profile successfully', async () => {
      const profileData = { name: 'John Doe', email: 'john@example.com' };
      const employeeId = 1;
      (userRepository.updateProfile as jest.Mock).mockResolvedValue(profileData);
  
      const callback = jest.fn();
      await updateProfile(profileData, employeeId, callback);
  
      expect(callback).toHaveBeenCalledWith({ success: true, message: profileData });
    });
  
    it('should view discarded items successfully', async () => {
      const discardedItems = [{ id: 1, name: 'Expired Salad' }];
      (menuRepository.getDiscardedItems as jest.Mock).mockResolvedValue(discardedItems);
  
      const callback = jest.fn();
      await viewDiscardedItems(callback);
  
      expect(callback).toHaveBeenCalledWith({ success: true, discardedItems });
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
  
  });
  