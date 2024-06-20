
import { Socket } from 'socket.io';
import { recommendMenu, viewMonthlyFeedback, viewFeedback } from '../services/chefService';

export function handleChefActions(socket: Socket) {
  socket.on('recommendMenu', recommendMenu);
  socket.on('viewMonthlyFeedback', viewMonthlyFeedback);
  socket.on('viewFeedback', (itemId: number, callback: Function) => viewFeedback(itemId, callback));
}
