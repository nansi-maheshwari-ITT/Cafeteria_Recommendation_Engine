import { menuRepository } from "../server/repositories/menuRepository";
import {
  askQuestion,
  askQuestionAsync,
  promptUser,
  rl,
} from "../server/utils/promptUtils";
import { MenuItem } from "../server/utils/types";
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
        await checkVotes();
        break;
      case "7":
        await finalizeMenuForTomorrow();
        break;
      case "8":
        await viewDiscardList();
        break;
      case "9":
        await rollOutFeedbackQuestionsForDiscard();
        break;
      case "10":
        await checkFeedbackForDiscardItems();
        break;
      case "11":
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
    const id = await askQuestionAsync(
      "Enter the food item id to view feedback: "
    );
    const itemId = parseInt(id);
    socket.emit("checkIfItemExists", itemId, (exists: boolean) => {
      if (exists) {
        socket.emit("getFeedbackById", itemId, (response: any) => {
          if (response.success) {
            console.table(response.feedback);
          } else {
            console.log(response.message)
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
    if (response.success) {
      const tableData = response.menuItems.map((item: any) => ({
        Name: item.name,
        Rating: item.average_rating,
        Sentiment: item.sentiment,
        Score: item.sentiment_score,
        SentimentComments: item.sentimentComments,
      }));
      console.table(tableData);
    } else {
      console.error(response.message);
    }
    promptUser("chef");
  });
}

function viewMenu() {
  socket.emit("getMenu", (response: any) => {
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
      const numberOfItemsInput = await askQuestionAsync(
        `Please enter the number of items you want to roll out for ${mealTime}: `
      );
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
          console.log(
            `The item "${item}" is not found in the ${mealTime} menu. Please enter a valid option.`
          );
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

function checkVotes() {
  socket.emit("checkVotes", (response: any) => {
    if (response.success) {
      response.messages.forEach((message: any) => {
        console.log(message);
      });
    } else {
      console.log("Failed to fetch responses.");
    }
    promptUser("chef");
  });
}

async function finalizeMenuForTomorrow() {
  try {
    socket.emit("finalizeMenuForTomorrow", (response: any) => {
      if (response.success) {
        const { meals } = response;

        console.log("\x1b[32m=== Tomorrow's Menu ===\x1b[0m");

        if (meals.breakfast && meals.breakfast.length > 0) {
          console.log("\x1b[36m=== Breakfast Options ===\x1b[0m");
          meals.breakfast.forEach((meal: any) => {
            console.log(`Dish: ${meal.name}, Votes: ${meal.votes}`);
          });
        } else {
          console.log("\x1b[31mNo breakfast choices selected.\x1b[0m");
        }

        if (meals.lunch && meals.lunch.length > 0) {
          console.log("\x1b[36m=== Lunch Options ===\x1b[0m");
          meals.lunch.forEach((meal: any) => {
            console.log(`Dish: ${meal.name}, Votes: ${meal.votes}`);
          });
        } else {
          console.log("\x1b[31mNo lunch choices selected.\x1b[0m");
        }

        if (meals.dinner && meals.dinner.length > 0) {
          console.log("\x1b[36m=== Dinner Options ===\x1b[0m");
          meals.dinner.forEach((meal: any) => {
            console.log(`Dish: ${meal.name}, Votes: ${meal.votes}`);
          });
        } else {
          console.log("\x1b[31mNo dinner choices selected.\x1b[0m");
        }

        if (loggedInUser) {
          const anyMealsSelected = meals.breakfast.length > 0 || meals.lunch.length > 0 || meals.dinner.length > 0;

          if (!anyMealsSelected) {
            askQuestionAsync("No votes yet for the meal. Do you still want to finalize? (yes/no): ").then((answer) => {
              if (answer.toLowerCase() === 'yes') {
                selectMeal();
              } else {
                promptUser("chef");
              }
            }).catch((error) => {
              console.error("Error processing user response:", error);
              promptUser("chef");
            });
          } else {
            selectMeal();
          }
        } else {
          console.log("\x1b[31mUser is not logged in.\x1b[0m");
          promptUser("chef");
        }
      } else {
        console.log("\x1b[31mUnable to retrieve tomorrow's menu.\x1b[0m");
        promptUser("chef");
      }
    });
  } catch (error) {
    console.error("Error finalizing menu for tomorrow:", error);
    promptUser("chef");
  }
}

async function selectMeal() {
  try {
    const mealForBreakfast = await askQuestionAsync(
      "Please enter the meal for breakfast: "
    );
    const mealForLunch = await askQuestionAsync(
      "Please enter the meal for lunch: "
    );
    const mealForDinner = await askQuestionAsync(
      "Please enter the meal for dinner: "
    );

    const meals = { mealForBreakfast, mealForLunch, mealForDinner };
    socket.emit("saveSelectedMeal", meals, (response: any) => {
      console.log(
        "\x1b[32mMeals have been saved successfully.\x1b[0m",
        response
      );
    });
  } catch (error) {
    console.error("\x1b[31mError during meal selection:\x1b[0m", error);
  } finally {
    setTimeout(() => {
      promptUser("chef");
    }, 200);
  }
}

async function viewDiscardList() {
  socket.emit("viewDiscardList", (response: any) => {
    if (response.discardMenuItems && response.discardMenuItems.length > 0) {
      console.table(response.discardMenuItems, [
        "id",
        "name",
        "average_rating",
        "sentiment_score",
      ]);
      askDiscardItemToRemove(response.discardMenuItems);
    } else {
      console.log("No items are scheduled for discard.");
      promptUser("chef");
    }
  });
}

async function askDiscardItemToRemove(discardMenuItems: any[]) {
  const itemId = await askQuestionAsync("Enter the ID of the item to remove: ");
  const item = discardMenuItems.find((item) => item.id === parseInt(itemId));
  if (item) {
    removeFoodItem(item.name);
  } else {
    console.log("Invalid ID. Returning to main menu.");
    promptUser("chef");
  }
}

async function removeFoodItem(itemName: string) {
  socket.emit("removeFoodItem", itemName, (response: any) => {
    console.log(response.message);
    promptUser("chef");
  });
}

async function rollOutFeedbackQuestionsForDiscard() {
  let item: string | undefined;

  while (!item) {
    item = await askQuestion("Enter the item you want to ask feedback for: ");

    if (!item) {
      console.log("Item cannot be empty. Please enter a valid item.");
      continue;
    }

    const isValidItem = await isMenuItemValid(item);
    
    if (!isValidItem) {
      console.log(`Item '${item}' is invalid. Please enter a valid item.`);
      item = undefined;
    }
  }

  socket.emit("checkMonthlyUsage", item, async (response: any) => {
    if (response.canUse) {
      await menuRepository.logMonthlyUsage(`getDetailedFeedback-${item}`);
      console.log(`Collecting detailed feedback for: ${item}`);

      const questions = [
        `What did you dislike about ${item}?`,
        `How can we improve the taste of ${item}?`,
        `Can you share a recipe for ${item}?`,
      ];

      for (const question of questions) {
        await submitFeedbackQuestion(item, question);
      }

      console.log("Feedback collection complete.");
      setTimeout(() => {
        promptUser("chef");
      }, 200);
    } else {
      console.log(`Feedback for ${item} has already been requested this month. Try again later.`);
      promptUser("chef");
    }
  });
}

function submitFeedbackQuestion(item: string, question: string) {
  return new Promise((resolve) => {
    socket.emit(
      "sendFeedbackQuestion",
      { discardedItem: item, question },
      (res: any) => {
        resolve(res);
      }
    );
  });
}

async function checkFeedbackForDiscardItems() {
  let itemName: string | undefined;

  while (!itemName) {
    itemName = await askQuestionAsync("Enter the item name to retrieve feedback: ");

    if (!itemName) {
      console.log("Item name cannot be empty. Please enter a valid item name.");
      continue;
    }

    const isValidItem = await isMenuItemValid(itemName);

    if (!isValidItem) {
      console.log(`Item '${itemName}' is invalid. Please enter a valid item name.`);
      itemName = undefined;
    }
  }

  socket.emit("fetchDetailedFeedback", itemName, (response: any) => {
    if (response.feedback.length > 0) {
      console.log("Feedback for:", itemName);

      const feedbackByQuestion = response.feedback.reduce(
        (acc: any, feedback: any) => {
          if (!acc[feedback.question]) {
            acc[feedback.question] = [];
          }
          acc[feedback.question].push(feedback.response);
          return acc;
        },
        {}
      );

      for (const question in feedbackByQuestion) {
        console.log(`Q: ${question}`);
        console.log(`A: ${feedbackByQuestion[question].join(", ")}`);
        console.log("--------");
      }
    } else {
      console.log("No feedback available for this item.");
    }
    promptUser("chef");
  });
}

export async function isMenuItemValid(item: string): Promise<boolean> {
  const trimmedItem = item.trim().toLowerCase();
  const menuItems = await menuRepository.checkMenuItem(trimmedItem); // Fetch all menu items from the database
  return menuItems.map(menuItem => menuItem.trim().toLowerCase()).includes(trimmedItem);
}
