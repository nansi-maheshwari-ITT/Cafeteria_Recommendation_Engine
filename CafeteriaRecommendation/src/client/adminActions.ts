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
      viewMenu();
      break;
    case "5":
      displayMonthlyFeedback();
      break;
    case "6":
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
    const price = await askQuestion("Enter item price: ");
    const mealType = await askQuestion("Enter meal type: ");
    const availability = await askQuestion("Is the item available (true/false): ");
    const foodType = await askQuestion("This Item comes in the category of - Vegetarian, Non Vegetarian, Eggetarian: ");
    const spiceLevel = await askQuestion("This Item comes in the category of(basis of spice level) - High, Medium, Low: ");
    const cuisine = await askQuestion("This Item comes in the category of - North Indian, South Indian, Other: ");
    const sweetTooth = await askQuestion("This item is sweet tooth? (Yes/No): ");

    const menuItem = {
      name,
      price: parseFloat(price),
      mealType,
      availability: availability === "true",
    };
    
    const profileData = {
      foodType: foodType.trim(),
      spiceLevel: spiceLevel.trim(),
      cuisine: cuisine.trim(),
      sweetTooth: sweetTooth.trim().toLowerCase() === "yes"
    };

    socket.emit("addMenuItem", menuItem, profileData, (response: any) => {
      console.log(response);
      if(response.success == true){
        console.log("Item added sucessfully");
      }else{
        console.log("Error adding item , try adding again");
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

async function removeMenuItem() {
  try {
    const id = await askQuestion("Enter the ID of the item to delete: ");
    const itemId = parseInt(id);

    socket.emit("deleteMenuItem", itemId, (response: any) => {
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
