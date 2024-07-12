
import { Socket } from 'socket.io';
import { checkIfItemExists, viewMenu } from '../services/adminService';
import { getRolloutItems, giveFeedback, saveDetailedFeedback, submitVote, updateProfile, viewDiscardedItems, viewNotification } from '../services/employeeService';

export function handleEmployeeActions(socket: Socket) {
  socket.on('viewMenu', viewMenu);
  socket.on('viewNotification', viewNotification);
  socket.on('giveFeedback', giveFeedback);
  socket.on('getRolloutItems', getRolloutItems);
  socket.on('submitVote', submitVote);
  socket.on('updateProfile',updateProfile);
  socket.on('viewDiscardedItems',viewDiscardedItems);
  socket.on("saveDetailedFeedback", saveDetailedFeedback);
  socket.on('checkIfItemExists', (itemId, callback) => {
    checkIfItemExists(itemId)
      .then((exists: boolean) => callback(exists))
      .catch(() => callback(false)); 
  });
}
