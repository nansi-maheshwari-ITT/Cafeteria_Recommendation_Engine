
import { Socket } from 'socket.io';
import { viewMenu } from '../services/adminService';
import { giveFeedback } from '../services/employeeService';

export function handleEmployeeActions(socket: Socket) {
  socket.on('viewMenu', viewMenu);
  socket.on('giveFeedback', giveFeedback);
}
