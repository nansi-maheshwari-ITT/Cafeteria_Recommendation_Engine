import { feedbackRepository } from '../repositories/feedbackRepository';
import { menuRepository } from '../repositories/menuRepository';
import { notificationRepository } from '../repositories/notificationRepository';
import { recommendationRepository } from '../repositories/recommendationRepository';
import { userRepository } from '../repositories/userRepository';
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
    callback({ success: true,message:'Feedback added successfully' });
  } catch (err) {
    console.error('Error giving feedback:', err);
    callback({ success: false });
  }
}

export async function getRolloutItems(user: any, callback: Function) {
  const mealTypes = ['breakfast', 'lunch', 'dinner'];
  console.log("abc", user);
  try {
    const messages: string[] = [];

    for (const mealType of mealTypes) {
      const rolledOutItems = await recommendationRepository.getRolledOutItems(mealType, user);

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

export async function updateProfile(profileData:any,employeeId:number,  callback: Function) {
  try {
    const profile = await userRepository.updateProfile(profileData,employeeId);
    console.log('profile', profile);
    callback({ success: true, message : profile});
  } catch (err) {
    console.error('Error updating profile:', err);
    callback({ success: false, message : "You Have entered wrong data. Please try again."});
  }
}

export async function viewDiscardedItems(callback: Function) {
  try {
    const discardedItems = await menuRepository.getDiscardedItems();
    callback({ success: true, discardedItems });
  } catch (err) {
    console.error('Error viewing discarded items:', err);
    callback({ success: false });
  }
}

export async function saveDetailedFeedback(menuItem:any ,employeeId:any, question:any, feedback:any, callback: Function){
  const data = await feedbackRepository.saveDetailedFeedback(menuItem,employeeId, question, feedback);
  callback(data);
}

export async function LogLogout(employeeId: number, logType:string, callback: Function) {
  try {
    const message = await userRepository.logLogout(employeeId, logType);
    callback({ success: true, message });
  } catch (err) {
    console.error('Error logging out:', err);
    callback({ success: false, message: 'Failed to logout!!'});
  }
}