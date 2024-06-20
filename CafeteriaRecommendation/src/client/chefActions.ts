
import { promptUser, rl } from '../utils/promptUtils';
import { socket } from './client';

export function handleChefChoice(choice: string) {
  switch (choice) {
    case '1':
      rl.question('Enter items to recommend (comma-separated IDs): ', (items) => {
        const itemIds = items.split(',').map(id => parseInt(id.trim()));
        socket.emit('recommendMenu', itemIds, (response: any) => {
          console.log(response);
          promptUser('chef');
        });
      });
      break;
    case '2':
      socket.emit('viewMonthlyFeedback', (response: any) => {
        console.log(response);
        promptUser('chef');
      });
      break;
    case '3':
      rl.close();
      socket.close();
      console.log('Goodbye!');
      break;
    default:
      console.log('Invalid choice, please try again.');
      promptUser('chef');
      break;
  }
}
