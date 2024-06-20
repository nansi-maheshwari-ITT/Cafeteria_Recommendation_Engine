
import { socket } from './client';
import { promptUser, rl } from '../utils/promptUtils';

export function handleEmployeeChoice(choice: string) {
  switch (choice) {
    case '1':
      socket.emit('viewMenu', (response: any) => {
        console.table(response.menuItems);
        promptUser('employee');
      });
      break;
    case '2':
      rl.question('Enter item ID to give feedback on: ', (itemId) => {
        rl.question('Enter your comment: ', (comment) => {
          rl.question('Enter your rating (1-5): ', (rating) => {
            socket.emit('giveFeedback', { itemId: parseInt(itemId), comment, rating: parseInt(rating) }, (response: any) => {
              console.log(response);
              promptUser('employee');
            });
          });
        });
      });
      break;
    case '3':
      rl.close();
      socket.close();
      console.log('Goodbye!');
      break;
    default:
      console.log('Invalid choice, please try again.');
      promptUser('employee');
      break;
  }
}
