import readline from 'readline';
import { handleAdminChoice } from '../../client/adminActions';
import { handleChefChoice } from '../../client/chefActions';
import { handleEmployeeChoice } from '../../client/employeeActions';

export const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

export function askQuestion(query: string): Promise<string> {
  return new Promise((resolve) => rl.question(query, resolve));
}

export function askQuestionAsync(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer));
  });
}

export function promptUser(role: 'admin' | 'chef' | 'employee') {
  console.log('\nChoose an operation:');
  if (role === 'admin') {
    console.log('1. Add Menu Item');
    console.log('2. Update Menu Item');
    console.log('3. Delete Menu Item');
    console.log('4. View Menu');
    console.log('5. Generate monthly feedback report');
    console.log('6. Exit');
  } else if (role === 'chef') {
    console.log('1. View Menu');
    console.log('2. View Monthly Feedback Report');
    console.log('3. View Feedback For particular item');
    console.log('4. View recommended food items');
    console.log('5. RollOut menu options for tomorrow');
    console.log("6. Check votes for tomorrow's menu");
    console.log("7. Finalize menu for tomorrow");
    console.log('8. Exit');
  } else if (role === 'employee') {
    console.log('1. View Menu');
    console.log('3. View Notifications');
    console.log('2. Give Feedback');
    console.log('4. Give vote for tomorrow menu');
    console.log('5. Exit');
  }
  
  rl.question('Enter your choice: ', (choice) => {
    switch (role) {
      case 'admin':
        handleAdminChoice(choice);
        break;
      case 'chef':
        handleChefChoice(choice);
        break;
      case 'employee':
        handleEmployeeChoice(choice);
        break;
      default:
        console.log('Invalid role');
        promptUser(role);
        break;
    }
  });
}
