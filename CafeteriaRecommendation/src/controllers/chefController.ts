
import { Socket } from 'socket.io';
import { recommendMenu, viewMonthlyFeedback, viewFeedback, selectNextDayMenu } from '../services/chefService';
import { getFoodItemForNextDay } from '../utils/recommendationEngine';

export function handleChefActions(socket: Socket) {
  socket.on('recommendMenu', recommendMenu);
  socket.on('viewMonthlyFeedback', viewMonthlyFeedback);
  socket.on('viewFeedback', (itemId: number, callback: Function) => viewFeedback(itemId, callback));
  socket.on('getFoodItemForNextDay', async ({ menuType, returnItemListSize }, callback) => {
    const recommendedItems = await getFoodItemForNextDay(menuType, returnItemListSize);
    callback({ success: true, recommendedItems });
  });
  socket.on('selectNextDayMenu', async (itemIds: number[], callback: Function) => {
    console.log('itemIds', itemIds);
    console.log("i am here");
    const result = await selectNextDayMenu(itemIds);
    console.log('result', result);
    if (result.success) {
      socket.broadcast.emit('nextDayMenu', result.nextDayMenuItems);
    }
    callback(result);
  });
}
