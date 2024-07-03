
import { Socket } from 'socket.io';
import { checkIfItemExists, viewMenu } from '../services/adminService';
import { giveFeedback } from '../services/employeeService';

export function handleEmployeeActions(socket: Socket) {
  socket.on('viewMenu', viewMenu);
  socket.on('giveFeedback', giveFeedback);
  socket.on('checkIfItemExists', (itemId, callback) => {
    checkIfItemExists(itemId)
      .then((exists: boolean) => callback(exists))
      .catch(() => callback(false)); // Handle errors, return false for simplicity
  });
}
