
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
        rl.question("Enter item ID to view feedback: ", (id) => {
          const itemId = parseInt(id);
          socket.emit("checkFoodItemExistence", itemId, (exists: boolean) => {
            if (exists) {
              socket.emit('viewFeedback', itemId, (response: any) => {
                if (response.success) {
                  console.table(response.feedback);
                } else {
                  console.log("Failed to fetch feedback or no feedback available.");
                }
                promptUser('chef');
              });
            } else {
              console.log(`Menu item with ID ${itemId} does not exist.`);
              promptUser('chef');
            }
          });
        });
        break;
    case '4':
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
