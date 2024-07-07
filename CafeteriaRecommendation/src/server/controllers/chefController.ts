import { Socket } from 'socket.io';
import { recommendMenu, viewMonthlyFeedback, getFeedbackById, getMenu, getRecommendation, rollOutMenu } from '../services/chefService';

export function handleChefActions(socket: Socket) {
  socket.on('getMenu', (callback: Function) => getMenu(callback));
  socket.on('recommendMenu', (itemIds: number[], callback: Function) => recommendMenu(itemIds, callback));
  socket.on('viewMonthlyFeedback', (callback: Function) => viewMonthlyFeedback(callback));
  socket.on('getRecommendation', (callback: Function) => getRecommendation(callback));
  socket.on('getFeedbackById', (itemId: number, callback: Function) => getFeedbackById(itemId, callback));
  socket.on('rollOutMenu', (callback: Function) => rollOutMenu(callback));
}
