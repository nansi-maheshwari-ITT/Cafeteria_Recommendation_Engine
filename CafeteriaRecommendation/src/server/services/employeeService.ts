import { feedbackRepository } from '../repositories/feedbackRepository';
import { menuRepository } from '../repositories/menuRepository';
import { FeedbackPayload } from '../utils/types';


export async function viewMenu(callback: Function) {
  try {
    const menuItems = await menuRepository.viewMenu();
    callback({ success: true, menuItems });
  } catch (err) {
    console.error('Error viewing menu:', err);
    callback({ success: false });
  }
}

export async function giveFeedback({ itemId, comment, rating }: FeedbackPayload, callback: Function) {
  try {
    await feedbackRepository.giveFeedback({ itemId, comment, rating });
    callback({ success: true });
  } catch (err) {
    console.error('Error giving feedback:', err);
    callback({ success: false });
  }
}

export async function getRolloutItems(user: any, callback: Function) {
  const mealTypes = ['breakfast', 'lunch', 'dinner'];
  let allRolledOutItems: string[] = [];
  try {
    const messages: string[] = [];

    for (const mealType of mealTypes) {
      const rolledOutItems = await menuRepository.getRolledOutItems(mealType, user);
      console.log("nitin00", rolledOutItems);

      if (rolledOutItems.length > 0) {
        const message = `Rolled out item for ${mealType} is: ${rolledOutItems.join(', ')}`;
        messages.push(message);
      }
    }

    callback({ status: 'printMessage', message: messages.join('\n') });
  } catch (err) {
    console.error('Error getting rollout items:', err);
    callback({ status: 'error', message: 'Error getting rollout items' });
  }
}

export async function submitVote(item: string, mealType: string, username: string, callback: Function) {
  try {
    const exists = await menuRepository.selectMenuItem(item, mealType, username);
    callback(exists);
  } catch (err) {
    console.error('Error voting for food:', err);
    callback(false);
  }
}
