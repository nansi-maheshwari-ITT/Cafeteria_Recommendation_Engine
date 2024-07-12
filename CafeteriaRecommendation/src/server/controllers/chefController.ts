import { Socket } from 'socket.io';
import { recommendMenu, viewMonthlyFeedback, getFeedbackById, getMenu, getRecommendation, getRecommendedFoodItems, rollOutNotification, checkVotes, finalizeMenuForTomorrow, saveSelectedMeal, viewDiscardList, checkMonthlyUsage, sendFeedbackQuestion, fetchDetailedFeedback, deleteMenuItemByName } from '../services/chefService';

export function handleChefActions(socket: Socket) {
  socket.on('getMenu', (callback: Function) => getMenu(callback));
  socket.on('recommendMenu', (itemIds: number[], callback: Function) => recommendMenu(itemIds, callback));
  socket.on('viewMonthlyFeedback', (callback: Function) => viewMonthlyFeedback(callback));
  socket.on('getRecommendation', (callback: Function) => getRecommendation(callback));
  socket.on('getFeedbackById', (itemId: number, callback: Function) => getFeedbackById(itemId, callback));
  socket.on('getRecommendedFoodItems', (callback: Function) => getRecommendedFoodItems(callback));
  socket.on('rollOutNotification', (mealTime: string, items: string[],callback: Function) => rollOutNotification(mealTime,items,callback));
  socket.on('checkVotes',checkVotes);
  socket.on('finalizeMenuForTomorrow', finalizeMenuForTomorrow);
  socket.on('saveSelectedMeal',saveSelectedMeal);
  socket.on('removeFoodItem',deleteMenuItemByName);
  socket.on("viewDiscardList", viewDiscardList);
  socket.on("checkMonthlyUsage", checkMonthlyUsage);
  socket.on('sendFeedbackQuestion',sendFeedbackQuestion);
  socket.on("fetchDetailedFeedback", fetchDetailedFeedback);
}

