
import { Socket } from 'socket.io';
import { recommendMenu, viewMonthlyFeedback } from '../services/chefService';

export function handleChefActions(socket: Socket) {
  socket.on('recommendMenu', recommendMenu);
  socket.on('viewMonthlyFeedback', viewMonthlyFeedback);
}
