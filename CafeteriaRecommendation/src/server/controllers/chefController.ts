
import { Socket } from 'socket.io';
import { recommendMenu, viewMonthlyFeedback, getFeedbackById, selectNextDayMenu } from '../services/chefService';
import { getFoodItemForNextDay } from '../utils/recommendationEngine';

export function handleChefActions(socket: Socket) {
  socket.on('recommendMenu', recommendMenu);
  socket.on('viewMonthlyFeedback', viewMonthlyFeedback);
  socket.on('getFeedbackById', (itemId: number, callback: Function) => getFeedbackById(itemId, callback));
  socket.on('getFoodItemForNextDay', async ({ menuType, returnItemListSize }, callback) => {
    const recommendedItems = await getFoodItemForNextDay(menuType, returnItemListSize);
    callback({ success: true, recommendedItems });
  });
  socket.on('selectNextDayMenu', async (itemIds: number[], callback: Function) => {
    const result = await selectNextDayMenu(itemIds);
    if (result.success) {
      socket.broadcast.emit('nextDayMenu', result.nextDayMenuItems);
    }
    callback(result);
  });
}
