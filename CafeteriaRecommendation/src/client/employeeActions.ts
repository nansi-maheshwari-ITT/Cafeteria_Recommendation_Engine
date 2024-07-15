import { socket, loggedInUser } from "./client";
import { promptUser, rl, askQuestion, askQuestionAsync } from "../server/utils/promptUtils";
import { MenuItem } from "../server/utils/types";
import { resolve } from "path";

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
  try {
    socket.emit("viewMenu", (response:any) => {
      if (response.success) {
        const formattedMenuItems = response.menuItems.map(
          (item: MenuItem) => ({
            id: item.id,
            name: item.name,
            price: item.price,
            mealType: item.mealType,
            availability: item.availability ? "Available" : "Not available",
          })
        );
        console.table(formattedMenuItems);
      } else {
        console.log("Unable to retrieve menu items at this time.");
      }
      promptUser("employee");
    });
  } catch (error) {
    console.error("Error viewing menu:", error);
    promptUser("employee");
  }
}

function giveFeedback(): void {
  try {
    rl.question("Enter the item ID you want to give feedback on: ", (itemId) => {
      const id = parseInt(itemId);
      if (isNaN(id)) {
        console.log("Invalid item ID. Please enter a valid number.");
        promptUser("employee");
        return;
      }

      socket.emit("checkIfItemExists", id, (exists: boolean) => {
        if (exists) {
          rl.question("Provide your comments: ", (comment) => {
            rl.question("Rate the item (1-5): ", (rating) => {
              const ratingValue = parseInt(rating);
              if (isNaN(ratingValue) || ratingValue < 1 || ratingValue > 5) {
                console.log("Invalid rating. Please enter a number between 1 and 5.");
                promptUser("employee");
                return;
              }

              socket.emit(
                "giveFeedback",
                {
                  itemId: id,
                  comment,
                  rating: ratingValue,
                },
                (response: any) => {
                  console.log(response.message);
                  console.log("Successfully added")
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
  } catch (error) {
    console.error("Error giving feedback:", error);
    promptUser("employee");
  }
}

function voteForTomorrowMenu(): void {
  try {
    socket.emit("getRolloutItems", loggedInUser, (response: any) => {
      if (loggedInUser) {
        if (response.status !== 'empty') {
          console.log(response.message)
          gatherVotesForMenu(loggedInUser.name);
        } else {
          console.log("No items available for voting.");
          promptUser("employee");
        }
      } else {
        console.log("User is not logged in.");
        promptUser("employee");
      }
    });
  } catch (error) {
    console.error("Error voting for tomorrow's menu:", error);
    promptUser("employee");
  }
}

async function gatherVotesForMenu(username: string) {
  const mealTypes = ["breakfast", "lunch", "dinner"];
  try {
    for (const mealType of mealTypes) {
      let item: string;
      let exists = "false";
      do {
        item = await askQuestion(`Please select one item for ${mealType}: `);
        await new Promise<void>((resolve) => {
          socket.emit("submitVote", item, mealType, username, (result: string) => {
            exists = result;
            if (exists === "false") {
              console.log(`Item '${item}' does not exist. Please select a valid item.`);
            }
            resolve();
          });
        });
      } while (!exists);
    }
    console.log("Your responses have been recorded successfully.\n");
  } catch (error) {
    console.error("Error gathering votes:", error);
  }
  promptUser("employee");
}

function viewNotification() {
  try {
    socket.emit("viewNotification", (response: any) => {
      if (response.success && response.notification && response.notification.length > 0) {
        // Format the notification data
        const formattedNotification = response.notification.map((item: any) => ({
          message: item.message,
          notification_date: item.notification_date
        }));

        console.table(formattedNotification);
      } else if (response.success) {
        console.log("No notifications found.");
      } else {
        console.log("Failed to retrieve notifications.");
      }
      promptUser("employee");
    });
  } catch (error) {
    console.error("Error viewing notifications:", error);
    promptUser("employee");
  }
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
    promptUser("employee");
  }
}

async function viewDiscardedItems() {
  try {
    socket.emit("viewDiscardedItems", async (response: any) => {
      if (response.discardedItems && response.discardedItems.length > 0) {
        console.table(response.discardedItems);

        while (true) {
          const selectedItem = await askQuestionAsync("Enter the item name to provide feedback (or type 'exit' to return to main menu): ");

          if (selectedItem.toLowerCase() === 'exit') {
            promptUser("employee");
            return;
          }
          const isValidItem = response.discardedItems.some((item: any) => item && item.trim().toLowerCase() == selectedItem.trim().toLowerCase());

          if (!isValidItem) {
            console.log(`Item '${selectedItem}' is not in the discarded list. Please select a valid item.`);
            continue;
          }

          const question1 = `What did you dislike about ${selectedItem}?`;
          const question2 = `How can we improve the taste of ${selectedItem}?`;
          const question3 = `Can you share a recipe for ${selectedItem}?`;

          const inputQ1 = await askQuestion(`Q1: ${question1}: `);
          const inputQ2 = await askQuestion(`Q2: ${question2}: `);
          const inputQ3 = await askQuestion(`Q3: ${question3}: `);

          socket.emit('saveDetailedFeedback', selectedItem, loggedInUser?.employeeId,
            [question1, question2, question3],
            [inputQ1, inputQ2, inputQ3],
            (response: any) => {
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
  } catch (error) {
    console.error("Error viewing discarded items:", error);
    promptUser("employee");
  }
}


async function logLogout() {
  try {
    if (loggedInUser) {
      socket.emit("LogLogout", loggedInUser.employeeId, "logout", (response: any) => {
        console.log(response.message);
      });
    }
  } catch (error) {
    console.error("Error logging out:", error);
  }
}
