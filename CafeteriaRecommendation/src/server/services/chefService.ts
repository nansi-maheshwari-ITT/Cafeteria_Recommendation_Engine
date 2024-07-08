import { menuRepository } from '../repositories/menuRepository';
import { updateSentimentScores } from './recommendationService';

export async function getMenu(callback: Function) {
  try {
    await updateSentimentScores();
    const menuItems = await menuRepository.getMenu();
    callback({ success: true, menuItems });
  } catch (error) {
    console.error('Menu retrieval error:', error);
    callback({ success: false, message: 'Unable to fetch menu items at this time.' });
  }
}

export async function recommendMenu(itemIds: number[], callback: Function) {
  try {
    const recommendedItems = await menuRepository.recommendMenu(itemIds);
    callback({ success: true, recommendedItems });
  } catch (error) {
    console.error('Error in menu recommendation:', error);
    callback({ success: false, message: 'Menu recommendation failed.' });
  }
}

export async function getRecommendation(callback: Function) {
  try {
    await updateSentimentScores();
    const menuItems = await menuRepository.getRecommendations();
    callback({ success: true, menuItems });
  } catch (error) {
    console.error('Recommendation retrieval error:', error);
    callback({ success: false, message: 'Unable to retrieve recommendations at this time.' });
  }
}

export async function viewMonthlyFeedback(callback: Function) {
  try {
    const feedbackReport = await menuRepository.viewMonthlyFeedback();
    callback({ success: true, feedbackReport });
  } catch (error) {
    console.error('Error fetching monthly feedback:', error);
    callback({ success: false, message: 'Failed to fetch monthly feedback report.' });
  }
}

export async function getFeedbackById(itemId: number, callback: Function) {
  try {
    const feedback = await menuRepository.getFeedbackById(itemId);
    callback({ success: true, feedback });
  } catch (error) {
    console.error('Error fetching feedback by ID:', error);
    callback({ success: false, message: 'Unable to retrieve feedback for the specified item.' });
  }
}

export async function getRecommendedFoodItems(callback: Function) {
  const mealTimes = ["breakfast", "lunch", "dinner"];
  const recommendations: string[] = [];

  try {
    await Promise.all(mealTimes.map(async (mealTime) => {
      const items = await menuRepository.getRecommendedItems(mealTime);
      console.log(`Items recommended for ${mealTime}:`, items);
      const message = `Top recommended items for ${mealTime}: ${items.join(', ')}`;
      recommendations.push(message);
    }));

    console.log('All Recommendations:', recommendations);
    callback({ success: true, items: recommendations });
  } catch (error) {
    console.error('Failed to retrieve recommendations:', error);
    throw new Error('Failed to retrieve recommendations');
  }
}
