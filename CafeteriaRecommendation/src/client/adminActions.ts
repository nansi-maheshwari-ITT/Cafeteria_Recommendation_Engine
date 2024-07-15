import { askQuestion, promptUser, rl } from "../server/utils/promptUtils";
import { MenuItem } from "../server/utils/types";
import { socket } from "./client";

export async function handleAdminChoice(choice: string) {
  switch (choice) {
    case "1":
      await addMenuItem();
      break;
    case "2":
      await updateMenuItem();
      break;
    case "3":
      await removeMenuItem();
      break;
    case "4":
      await changeAvailability();
    case "5":
      viewMenu();
      break;
    case "6":
      displayMonthlyFeedback();
      break;
    case "7":
      rl.close();
      socket.close();
      console.log("Logging out the admin console.");
      break;
    default:
      console.log("Invalid choice. Please choose a valid option.");
      promptUser("admin");
      break;
  }
}

async function addMenuItem() {
  try {
    const name = await askQuestion("Enter item name: ");

    let price: number;
    while (true) {
      const priceInput = await askQuestion("Enter item price: ");
      price = parseFloat(priceInput);
      if (!isNaN(price)) break;
      console.log("Invalid price. Please enter a valid number.");
    }

    let mealType: string;
    const validMealTypes = ["breakfast", "lunch", "dinner"];
    while (true) {
      mealType = (await askQuestion("Enter meal type (breakfast, lunch, dinner): ")).trim().toLowerCase();
      if (validMealTypes.includes(mealType)) break;
      console.log("Invalid meal type. Please enter 'breakfast', 'lunch', or 'dinner'.");
    }

    let availability: boolean;
    while (true) {
      const availabilityInput = (await askQuestion("Is the item available (true/false): ")).trim().toLowerCase();
      if (availabilityInput === "true" || availabilityInput === "false") {
        availability = availabilityInput === "true";
        break;
      }
      console.log("Invalid input. Please enter 'true' or 'false'.");
    }

    let foodType: string;
    const validFoodTypes = ["vegetarian", "non vegetarian", "eggetarian","other"];
    while (true) {
      foodType = (await askQuestion("This Item comes in the category of - Vegetarian, Non Vegetarian, Eggetarian,other: ")).trim().toLowerCase();
      if (validFoodTypes.includes(foodType)) break;
      console.log("Invalid food type. Please enter 'Vegetarian', 'Non Vegetarian', or 'Eggetarian'.");
    }

    let spiceLevel: string;
    const validSpiceLevels = ["high", "medium", "low"];
    while (true) {
      spiceLevel = (await askQuestion("This Item comes in the category of(basis of spice level) - High, Medium, Low: ")).trim().toLowerCase();
      if (validSpiceLevels.includes(spiceLevel)) break;
      console.log("Invalid spice level. Please enter 'High', 'Medium', or 'Low'.");
    }

    let cuisine: string;
    const validCuisines = ["north indian", "south indian", "other"];
    while (true) {
      cuisine = (await askQuestion("This Item comes in the category of - North Indian, South Indian, Other: ")).trim().toLowerCase();
      if (validCuisines.includes(cuisine)) break;
      console.log("Invalid cuisine. Please enter 'North Indian', 'South Indian', or 'Other'.");
    }

    let sweetTooth: boolean;
    while (true) {
      const sweetToothInput = (await askQuestion("This item is sweet tooth? (Yes/No): ")).trim().toLowerCase();
      if (sweetToothInput === "yes" || sweetToothInput === "no") {
        sweetTooth = sweetToothInput === "yes";
        break;
      }
      console.log("Invalid input. Please enter 'Yes' or 'No'.");
    }

    const menuItem = {
      name,
      price,
      mealType,
      availability,
    };

    const profileData = {
      foodType,
      spiceLevel,
      cuisine,
      sweetTooth,
    };

    socket.emit("addMenuItem", menuItem, profileData, (response: any) => {
      console.log(response);
      if (response.success === true) {
        console.log("Item added successfully.");
      } else {
        console.log("Error adding item. Please try again.");
      }
      promptUser("admin");
    });
  } catch (error) {
    console.error("Error adding menu item:", error);
  }
}

async function updateMenuItem() {
  try {
    const id = await askQuestion("Enter the ID of the item to update: ");
    const itemId = parseInt(id);

    socket.emit("checkIfItemExists", itemId, async (exists: boolean) => {
      if (exists) {
        const name = await askQuestion("Enter the new name for the item: ");
        const price = await askQuestion("Enter the new price for the item: ");
        const mealType = await askQuestion("Enter the meal type: ");
        const availability = await askQuestion("Is the item available? (true/false): ");

        const updatedItem = {
          id: itemId,
          name,
          price: parseFloat(price),
          mealType,
          availability: availability === "true",
        };

        socket.emit("updateMenuItem", updatedItem, (response: any) => {
          console.log(response);
          if (response.success) {
            console.log("Menu item updated successfully!");
          } else {
            console.log("Error updating item. Please try again.");
          }
          promptUser("admin");
        });
      } else {
        console.log(`No menu item found with ID ${itemId}.`);
        promptUser("admin");
      }
    });
  } catch (error) {
    console.error("An error occurred while updating the menu item:", error);
  }
}

async function changeAvailability() {
  try {
    const id = await askQuestion("Enter the ID of the item to change availability: ");
    const itemId = parseInt(id);

    socket.emit("changeAvailability", itemId, (response: any) => {
      console.log(response);
      if (response.success) {
        console.log("Menu item deleted successfully!");
      } else {
        console.log("Error deleting item. Please try again.");
      }
      promptUser("admin");
    });
  } catch (error) {
    console.error("An error occurred while changing availability the menu item:", error);
  }
}

async function removeMenuItem() {
  try {
    const id = await askQuestion("Enter the ID of the item to delete: ");
    const itemId = parseInt(id);

    socket.emit("removeMenuItem", itemId, (response: any) => {
      console.log(response);
      if (response.success) {
        console.log("Menu item deleted successfully!");
      } else {
        console.log("Error deleting item. Please try again.");
      }
      promptUser("admin");
    });
  } catch (error) {
    console.error("An error occurred while deleting the menu item:", error);
  }
}


function viewMenu() {
  socket.emit("viewMenu", (response: any) => {
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
    promptUser("admin");
  });
}

function displayMonthlyFeedback() {
  socket.emit("viewMonthlyFeedback", (response: any) => {
    if (response.success) {
      console.log("Monthly Feedback Report:");
      console.table(response.feedbackReport);
    } else {
    console.log("Failed to load monthly feedback.");
    }
    promptUser("admin");
  });
}
