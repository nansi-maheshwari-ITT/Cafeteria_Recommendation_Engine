
import { menuRepository } from "../server/repositories/menuRepository";
import { askQuestionAsync, promptUser, rl } from "../server/utils/promptUtils";
import { loggedInUser, socket } from "./client";

export async function handleChefChoice(choice: string) {
  try {
    switch (choice) {
      case "1":
        await viewMenu();
        break;
      case "2":
        await viewMonthlyFeedback();
        break;
      case "3":
        await viewFeedbackForItem();
        break;
      case "4":
        await viewRecommendations();
        break;
      case "5":
        await rollOutMenu();
        break;
      case "6":
        rl.close();
        socket.close();
        console.log("Logging out the chef console!");
        break;
      default:
        console.log("Invalid option. Please choose a valid option.");
        promptUser("chef");
        break;
    }
  } catch (error) {
    console.error("Error processing chef choice:", error);
  }
}

function viewMonthlyFeedback() {
  socket.emit("viewMonthlyFeedback", (response: any) => {
    console.table(response.feedbackReport);
    promptUser("chef");
  });
}

async function viewFeedbackForItem() {
  try {
    const id = await askQuestionAsync("Enter the food item id to view feedback: ");
    const itemId = parseInt(id);
    socket.emit("checkIfItemExists", itemId, (exists: boolean) => {
      if (exists) {
        socket.emit("getFeedbackById", itemId, (response: any) => {
          if (response.success) {
            console.table(response.feedback);
          } else {
            console.log("Failed to fetch or no feedback available.");
          }
          promptUser("chef");
        });
      } else {
        console.log(`Item with ID ${itemId} does not exist.`);
        promptUser("chef");
      }
    });
  } catch (error) {
    console.error("Error viewing feedback:", error);
  }
}

function viewRecommendations() {
  socket.emit("getRecommendation", (response: any) => {
    console.table(response.menuItems);
    promptUser("chef");
  });
}

function viewMenu() {
  socket.emit("getMenu", (response: any) => {
    console.table(response.menuItems);
    promptUser("chef");
  });
}

async function rollOutMenu() {
  socket.emit("getRecommendedFoodItems", (response: any) => {
    console.table(response.items);
    if (loggedInUser) {
      rollOutNotification();
    } else {
      console.log("User not logged in");
      promptUser("chef");
    }
  });
}

async function rollOutNotification() {
  const mealTimes = ["breakfast", "lunch", "dinner"];
  
  for (const mealTime of mealTimes) {
    let numberOfItems: number;
    
    while (true) {
      const numberOfItemsInput = await askQuestionAsync(`Please enter the number of items you want to roll out for ${mealTime}: `);
      numberOfItems = Number(numberOfItemsInput);

      if (!isNaN(numberOfItems) && numberOfItems > 0) {
        break;
      } else {
        console.log("Please enter a valid number greater than 0.");
      }
    }
 const items: Array<string> = [];
    
    for (let i = 0; i < Number(numberOfItems); i++) {
      let item;
      while (true) {
        item = await askQuestionAsync(`Enter item ${i + 1}: `);
        const isValid = await menuRepository.isItemValid(mealTime, item);
        if (isValid) {
          items.push(item);
          break;
        } else {
          console.log(`The item "${item}" is not found in the ${mealTime} menu. Please enter a valid option.`);
        }
      }
    }
    
    socket.emit("rollOutNotification", mealTime, items, (response: any) => {
      if (!response.success) {
        console.error(response.message);
      }
    });
  }
  
  console.log("Items rolled out successfully.\n");
  promptUser("chef");
}

