import { feedbackRepository } from '../repositories/feedbackRepository';
import { menuRepository } from '../repositories/menuRepository';
import { notificationRepository } from '../repositories/notificationRepository';
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
  try {
    const messages: string[] = [];

    for (const mealType of mealTypes) {
      const rolledOutItems = await menuRepository.getRolledOutItems(mealType, user);

      if (rolledOutItems.length > 0) {
        const message = `Rolled out item for ${mealType} is: ${rolledOutItems.join(', ')}`;
        messages.push(message);
       
      }
    }
    if(messages.length>0){
      callback({ status: 'printMessage', message: messages.join('\n') });
    }else{
      callback({ status: 'empty', message: 'No rolled out items for selection' });
    }
   
  } catch (err) {
    console.error('Error getting rollout items:', err);
    callback({ status: 'error', message: 'Error getting rollout items' });
  }
}

export async function submitVote(item: string, mealType: string, username: string, callback: Function) {
  try {
    const result = await menuRepository.selectMenuItem(item, mealType, username);
    const success = result === `Menu item for ${mealType} selected successfully.`;
    callback({ success, message: result });
  } catch (err) {
    console.error('Error voting for food:', err);
    callback({ success: false, message: 'Error voting for food' });
  }
}


export async function viewNotification(callback: Function) {
  try {
    const notification = await notificationRepository.viewNotification();
    callback({ success: true, notification });
  } catch (err) {
    console.error('Error viewing notification:', err);
    callback({ success: false });
  }
}
