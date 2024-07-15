import { 
    getMenu, 
    recommendMenu, 
    getRecommendation, 
    viewMonthlyFeedback, 
    getFeedbackById, 
    getRecommendedFoodItems, 
    rollOutNotification, 
    checkVotes, 
    finalizeMenuForTomorrow, 
    saveSelectedMeal, 
    sendFeedbackQuestion, 
    viewDiscardList, 
    fetchDetailedFeedback, 
    checkMonthlyUsage, 
    deleteMenuItemByName
  } from '../src/server/services/chefService';
  import { feedbackRepository } from '../src/server/repositories/feedbackRepository';
  import { menuRepository } from '../src/server/repositories/menuRepository';
  import { notificationRepository } from '../src/server/repositories/notificationRepository';
  import { recommendationRepository } from '../src/server/repositories/recommendationRepository';
  import { updateSentimentScores } from '../src/server/services/recommendationService';
  
  jest.mock('../src/server/repositories/feedbackRepository', () => ({
    feedbackRepository: {
      viewMonthlyFeedback: jest.fn(),
      getFeedbackById: jest.fn(),
      fetchDetailedFeedback: jest.fn(),
    },
  }));
  
  jest.mock('../src/server/repositories/menuRepository', () => ({
    menuRepository: {
      getMenu: jest.fn(),
      recommendMenu: jest.fn(),
      checkVotes: jest.fn(),
      fetchMenuItemsForMeal: jest.fn(),
      saveSelectedMeal: jest.fn(),
      fetchDiscardMenuItems: jest.fn(),
      findMenuItemByName: jest.fn(),
      canUseFeature: jest.fn(),
      deleteMenuItemByName: jest.fn(),
    },
  }));
  
  jest.mock('../src/server/repositories/notificationRepository', () => ({
    notificationRepository: {
      addNotification: jest.fn(),
    },
  }));
  
  jest.mock('../src/server/repositories/recommendationRepository', () => ({
    recommendationRepository: {
      getRecommendations: jest.fn(),
      getRecommendedItems: jest.fn(),
      rollOutMenuItems: jest.fn(),
    },
  }));
  
  jest.mock('../src/server/services/recommendationService', () => ({
    updateSentimentScores: jest.fn(),
  }));
  
  describe('Admin Service', () => {
    it('should get the menu', async () => {
      (updateSentimentScores as jest.Mock).mockResolvedValue(undefined);
      const menuItems = [{ id: 1, name: 'Pizza', price: 9.99 }];
      (menuRepository.getMenu as jest.Mock).mockResolvedValue(menuItems);
  
      const callback = jest.fn();
      await getMenu(callback);
  
      expect(callback).toHaveBeenCalledWith({ success: true, menuItems });
    });
  
    it('should handle errors when getting the menu', async () => {
      (updateSentimentScores as jest.Mock).mockResolvedValue(undefined);
      (menuRepository.getMenu as jest.Mock).mockRejectedValue(new Error('Test Error'));
  
      const callback = jest.fn();
      await getMenu(callback);
  
      expect(callback).toHaveBeenCalledWith({ success: false, message: 'Unable to fetch menu items at this time.' });
    });
  
    it('should recommend menu items', async () => {
      const recommendedItems = [{ id: 1, name: 'Pizza', price: 9.99 }];
      (menuRepository.recommendMenu as jest.Mock).mockResolvedValue(recommendedItems);
  
      const callback = jest.fn();
      await recommendMenu([1], callback);
  
      expect(callback).toHaveBeenCalledWith({ success: true, recommendedItems });
    });
  
    it('should handle errors when recommending menu items', async () => {
      (menuRepository.recommendMenu as jest.Mock).mockRejectedValue(new Error('Test Error'));
  
      const callback = jest.fn();
      await recommendMenu([1], callback);
  
      expect(callback).toHaveBeenCalledWith({ success: false, message: 'Menu recommendation failed.' });
    });
  
    it('should get recommendations with formatted sentiment comments', async () => {
      (updateSentimentScores as jest.Mock).mockResolvedValue(undefined);
      const menuItems = [
        { id: 1, name: 'Pizza', positiveWords: 'Delicious', negativeWords: '', neutralWords: 'Okay' },
      ];
      (recommendationRepository.getRecommendations as jest.Mock).mockResolvedValue(menuItems);
  
      const callback = jest.fn();
      await getRecommendation(callback);
  
      const formattedMenuItems = [
        {
          id: 1,
          name: 'Pizza',
          positiveWords: 'Delicious',
          negativeWords: '',
          neutralWords: 'Okay',
          sentimentComments: 'Positive: Delicious, Neutral: Okay',
        },
      ];
  
      expect(callback).toHaveBeenCalledWith({ success: true, menuItems: formattedMenuItems });
    });
  
    it('should handle errors when getting recommendations', async () => {
      (updateSentimentScores as jest.Mock).mockResolvedValue(undefined);
      (recommendationRepository.getRecommendations as jest.Mock).mockRejectedValue(new Error('Test Error'));
  
      const callback = jest.fn();
      await getRecommendation(callback);
  
      expect(callback).toHaveBeenCalledWith({ success: false, message: 'Unable to retrieve recommendations at this time.' });
    });
  
    it('should view monthly feedback', async () => {
      const feedbackReport = [{ id: 1, feedback: 'Good' }];
      (feedbackRepository.viewMonthlyFeedback as jest.Mock).mockResolvedValue(feedbackReport);
  
      const callback = jest.fn();
      await viewMonthlyFeedback(callback);
  
      expect(callback).toHaveBeenCalledWith({ success: true, feedbackReport });
    });
  
    it('should handle errors when viewing monthly feedback', async () => {
      (feedbackRepository.viewMonthlyFeedback as jest.Mock).mockRejectedValue(new Error('Test Error'));
  
      const callback = jest.fn();
      await viewMonthlyFeedback(callback);
  
      expect(callback).toHaveBeenCalledWith({ success: false, message: 'Failed to fetch monthly feedback report.' });
    });
  
    it('should get feedback by ID', async () => {
      const feedback = { id: 1, feedback: 'Good' };
      (feedbackRepository.getFeedbackById as jest.Mock).mockResolvedValue(feedback);
  
      const callback = jest.fn();
      await getFeedbackById(1, callback);
  
      expect(callback).toHaveBeenCalledWith({ success: true, feedback });
    });
  
    it('should return "No feedbacks available for this item." when feedback is not found', async () => {
      (feedbackRepository.getFeedbackById as jest.Mock).mockResolvedValue(null);
  
      const callback = jest.fn();
      await getFeedbackById(1, callback);
  
      expect(callback).toHaveBeenCalledWith({ success: false, message: "No feedbacks available for this item." });
    });
  
    it('should handle errors when getting feedback by ID', async () => {
      (feedbackRepository.getFeedbackById as jest.Mock).mockRejectedValue(new Error('Test Error'));
  
      const callback = jest.fn();
      await getFeedbackById(1, callback);
  
      expect(callback).toHaveBeenCalledWith({ success: false, message: 'Unable to retrieve feedback for the specified item.' });
    });
  
    it('should get recommended food items', async () => {
      const breakfastItems = ['Pancakes', 'Omelette'];
      const lunchItems = ['Pizza', 'Burger'];
      const dinnerItems = ['Steak', 'Salad'];
      (recommendationRepository.getRecommendedItems as jest.Mock)
        .mockResolvedValueOnce(breakfastItems)
        .mockResolvedValueOnce(lunchItems)
        .mockResolvedValueOnce(dinnerItems);
  
      const callback = jest.fn();
      await getRecommendedFoodItems(callback);
  
      expect(callback).toHaveBeenCalledWith({ success: true, items: [
        `Top recommended items for breakfast: Pancakes, Omelette`,
        `Top recommended items for lunch: Pizza, Burger`,
        `Top recommended items for dinner: Steak, Salad`,
      ]});
    });
  
    it('should handle errors when getting recommended food items', async () => {
      (recommendationRepository.getRecommendedItems as jest.Mock).mockRejectedValue(new Error('Test Error'));
  
      const callback = jest.fn();
      await getRecommendedFoodItems(callback);
  
      expect(callback).toHaveBeenCalledWith({ success: false, error: 'Failed to retrieve recommendations' });
    });
  
    it('should roll out notification successfully', async () => {
      (recommendationRepository.rollOutMenuItems as jest.Mock).mockResolvedValue('Menu items rolled out successfully');
      (notificationRepository.addNotification as jest.Mock).mockResolvedValue(undefined);
  
      const callback = jest.fn();
      await rollOutNotification('lunch', ['Pizza'], callback);
  
      expect(notificationRepository.addNotification).toHaveBeenCalledWith('employee', "Chef has rolled out Pizza for tomorrow's lunch.", 1);
      expect(callback).toHaveBeenCalledWith({ success: true });
    });
  
    it('should handle errors when rolling out notification', async () => {
      (recommendationRepository.rollOutMenuItems as jest.Mock).mockRejectedValue(new Error('Test Error'));
  
      const callback = jest.fn();
      await rollOutNotification('lunch', ['Pizza'], callback);
  
      expect(callback).toHaveBeenCalledWith({ success: false, error: 'Error rolling out food item' });
    });
  
})
  