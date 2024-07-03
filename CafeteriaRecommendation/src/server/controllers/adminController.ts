import { Socket } from 'socket.io';
import { addMenuItem, updateMenuItem, deleteMenuItem, viewMenu, checkIfItemExists } from '../services/adminService';

export function handleAdminActions(socket: Socket) {
  socket.on('addMenuItem', (data, callback) => {
    addMenuItem(data)
      .then(response => callback(response))
      .catch(error => callback({ success: false, error }));
  });

  socket.on('updateMenuItem', (data, callback) => {
    updateMenuItem(data)
      .then(response => callback(response))
      .catch(error => callback({ success: false, error }));
  });

  socket.on('deleteMenuItem', (data, callback) => {
    deleteMenuItem(data)
      .then(response => callback(response))
      .catch(error => callback({ success: false, error }));
  });

  socket.on('viewMenu', (callback) => {
    viewMenu()
      .then(menuItems => callback({ success: true, menuItems }))
      .catch(error => callback({ success: false, error }));
  });

  socket.on('checkIfItemExists', (itemId, callback) => {
    checkIfItemExists(itemId)
      .then(exists => callback(exists))
      .catch(() => callback(false));
  });
}
