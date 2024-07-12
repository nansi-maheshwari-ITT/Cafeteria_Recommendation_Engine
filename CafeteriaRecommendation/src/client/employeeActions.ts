import { socket, loggedInUser } from "./client";
import { promptUser, rl, askQuestion, askQuestionAsync } from "../server/utils/promptUtils";

export function handleEmployeeChoice(choice: string) {
  switch (choice) {
    case "1":
      viewMenu();
      break;
    case "2":
      viewNotification();  
      break;
      case "3":
      giveFeedback();
      break;
    case "4":
      voteForTomorrowMenu();
      break;
      case "5":
        updateProfile();
        break;
        case "6":
          viewDiscardedItems();
          break;
    case "7":
      logLogout();
      rl.close();
      socket.close();
      console.log("Logging out the employee console!");
      break;
    default:
      console.log("Invalid option. Please choose a valid option.");
      promptUser("employee");
      break;
  }
}

function viewMenu(): void {
  socket.emit("viewMenu", (response: { menuItems: any[] }) => {
    console.table(response.menuItems);
    promptUser("employee");
  });
}

function giveFeedback(): void {
  rl.question("Enter the item ID you want to give feedback on: ", (itemId) => {
    const id = parseInt(itemId);

    socket.emit("checkIfItemExists", id, (exists: boolean) => {
      if (exists) {
        rl.question("Provide your comments: ", (comment) => {
          rl.question("Rate the item (1-5): ", (rating) => {
            socket.emit(
              "giveFeedback",
              {
                itemId: id,
                comment,
                rating: parseInt(rating),
              },
              (response: any) => {
                console.log(response);
                promptUser("employee");
              }
            );
          });
        });
      } else {
        console.log(`No menu item found with ID ${itemId}.`);
        promptUser("employee");
      }
    });
  });
}

function voteForTomorrowMenu(): void {
  socket.emit("getRolloutItems", loggedInUser, (response: any) => {
    console.log(response);
    if (loggedInUser) {
      if( response.status!=='empty'){
        gatherVotesForMenu(loggedInUser.name);
      }
      else{
        promptUser("employee");
      }
    } else {
      console.log("User is not logged in");
      promptUser("employee");
    }
  });
}

async function gatherVotesForMenu(username: string) {
  const mealTypes = ["breakfast", "lunch", "dinner"];
  for (const mealType of mealTypes) {
    let item: string;
    let exists = "false";
    do {
      item = await askQuestion(`Please select one item for ${mealType}: `);
      await new Promise<void>((resolve) => {
        socket.emit("submitVote", item, mealType, username, (result: string) => {
          exists = result;
          console.log(exists);
          resolve();
        });
      });
    } while (!exists);
  }
  console.log("Your responses have been recorded successfully.\n");
  promptUser("employee");
}




function viewNotification() {
  socket.emit("viewNotification", (response: any) => {
    console.table(response.notification);
    promptUser("employee");
  });
}

async function updateProfile() {
  console.log("Let's update your preferences. Please answer the following questions:");

  try {
    const questions = [
      { question: "1) Choose one - Vegetarian (1), Non Vegetarian (2), Eggetarian (3): ", key: 'foodType', options: ['Vegetarian', 'Non Vegetarian', 'Eggetarian'] },
      { question: "2) What is your preferred spice level - High (1), Medium (2), Low (3): ", key: 'spiceLevel', options: ['High', 'Medium', 'Low'] },
      { question: "3) Which cuisine do you prefer - North Indian (1), South Indian (2), Other (3): ", key: 'cuisine', options: ['North Indian', 'South Indian', 'Other'] },
      { question: "4) Do you enjoy sweets? Yes (1), No (2): ", key: 'sweetTooth', options: ['Yes', 'No'] }
    ];

    const profileData: { [key: string]: string | boolean } = {};

    for (const item of questions) {
      let validAnswer = false;
      while (!validAnswer) {
        const answer = await askQuestion(item.question);
        const index = parseInt(answer.trim(), 10) - 1;
        if (index >= 0 && index < item.options.length) {
          profileData[item.key] = item.key === 'sweetTooth' ? item.options[index].toLowerCase() === "yes" : item.options[index];
          validAnswer = true;
        } else {
          console.log("Invalid selection. Please enter a valid number.");
        }
      }
    }

    socket.emit("updateProfile", profileData, loggedInUser?.employeeId, (response: { message: any; }) => {
      console.log("Profile update response:", response.message);
      setTimeout(() => {
        console.log("Returning to employee menu...");
        promptUser("employee");
      }, 200);
    });

  } catch (error) {
    console.error("An error occurred while updating your profile:", error);
  }
}

async function viewDiscardedItems() {
  socket.emit("viewDiscardedItems", async (response: any) => {
    console.table(response.discardedItems);

    if (response.discardedItems.length > 0) {
      while (true) {
        const selectedItem = await askQuestionAsync("Enter the item name to provide feedback (or type 'exit' to return to main menu): ");
        
        if (selectedItem.toLowerCase() === 'exit') {
          promptUser("employee");
          return;
        }
        
        if (!response.discardedItems.includes(selectedItem)) {
          console.log(`Item '${selectedItem}' is not in the discarded list. Please select a valid item.`);
          continue;
        }

        const question1 = `What did you dislike about ${selectedItem}?`;
        const question2 = `How can we improve the taste of ${selectedItem}?`;
        const question3 = `Can you share a recipe for ${selectedItem}`;

        const inputQ1 = await askQuestion(`Q1: ${question1}: `);
        const inputQ2 = await askQuestion(`Q2: ${question2}: `);
        const inputQ3 = await askQuestion(`Q3: ${question3}: `);

        socket.emit('saveDetailedFeedback', selectedItem, loggedInUser?.employeeId, 
          [question1, question2, question3], 
          [inputQ1, inputQ2, inputQ3],
          (response: any) => {
            console.log(response);
          }
        );

        const continueFeedback = await askQuestionAsync("Do you want to provide feedback for another item? (yes/no): ");
        if (continueFeedback.toLowerCase() !== 'yes') {
          break;
        }
      }
    } else {
      console.log("Chef has not asked for detailed feedback of any menu item.");
    }
    
    promptUser("employee");
  });
}

async function logLogout() {
  if(loggedInUser){
    socket.emit("LogLogout", loggedInUser.employeeId, "logout", (response: any) => {
      console.log(response.message);
    });
  }
}
