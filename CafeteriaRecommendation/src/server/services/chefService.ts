import { menuRepository } from '../repositories/menuRepository';
import { notificationRepository } from '../repositories/notificationRepository';
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
    for (const mealTime of mealTimes) {
      const items = await menuRepository.getRecommendedItems(mealTime);
      recommendations.push(`Top recommended items for ${mealTime}: ${items.join(', ')}`);
      console.log(`Retrieved recommendations for ${mealTime}: ${items.join(', ')}`);
    }
    console.log('All recommendations fetched:', recommendations);
    callback({ success: true, items: recommendations });
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error retrieving recommendations:', error.message);
      callback({ success: false, error: 'Failed to retrieve recommendations' });
    } else {
      console.error('Unexpected error:', error);
      callback({ success: false, error: 'Unexpected error occurred' });
    }
  }
}

export async function rollOutNotification(mealTime: string, items: string[], callback: Function) {
  try {
    const message = await menuRepository.rollOutMenuItems(mealTime, items);
    console.log(`Rollout message: ${message}`);

    if (message.includes('already been rolled out')) {
      callback({ success: false, message });
    } else {
      await notificationRepository.addNotification('employee', `Chef has rolled out ${items.join(', ')} for tomorrow's ${mealTime}.`, 1);
      console.log(`Notification created: Chef has rolled out ${items.join(', ')} for tomorrow's ${mealTime}`);
      callback({ success: true });
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error rolling out food item:', error.message);
      callback({ success: false, error: 'Error rolling out food item' });
    } else {
      console.error('Unexpected error:', error);
      callback({ success: false, error: 'Unexpected error occurred' });
    }
  }
}

export async function checkVotes(callback: Function) {
  const mealTimes = ['breakfast', 'lunch', 'dinner'];
    let messages: string[] = [];
        for (const mealTime of mealTimes) {
            const message = await menuRepository.checkVotes(mealTime);
            messages.push(...message);
        }
        callback({ success: true, messages });  
}

export async function finalizeMenuForTomorrow(callback: Function) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const formattedDate = tomorrow.toISOString().slice(0, 10);
  const mealSchedule: any = {};

  const mealTypes = ['breakfast', 'lunch', 'dinner'];
  for (const mealType of mealTypes) {
    const selectedFoods = await menuRepository.fetchMenuItemsForMeal(formattedDate, mealType);
    mealSchedule[mealType] = selectedFoods.map((food: any) => ({
      name: food.name,
      votes: food.vote_count
    }));
  }

  callback({ success: true, meals: mealSchedule });
}

export async function saveSelectedMeal(selectedMeals: { mealForBreakfast: string; mealForLunch: string; mealForDinner: string; }, callback: Function) {
  try {
    const formattedMeals = {
      breakfast: selectedMeals.mealForBreakfast,
      lunch: selectedMeals.mealForLunch,
      dinner: selectedMeals.mealForDinner
    };

    await menuRepository.saveSelectedMeal(formattedMeals);
    callback({ success: true, message: 'The chosen meals have been successfully saved.' });
  } catch (error) {
    console.error('Failed to save selected meal:', error);
    callback({ success: false, message: 'An error occurred while saving the selected meal.' });
  }
}

