import { promptUser, rl } from "../utils/promptUtils";
import { MenuItem } from "../utils/types";
import { socket } from "./client";

export function handleAdminChoice(choice: string) {
  switch (choice) {
    case "1":
      rl.question("Enter item name: ", (name) => {
        rl.question("Enter item price: ", (price) => {
            rl.question("Enter meal type: ", (mealType) => {
          rl.question(
            "Is the item available (true/false): ",
            (availability) => {
              socket.emit(
                "addMenuItem",
                {
                  name,
                  price: parseFloat(price),
                  mealType:mealType,
                  availability: availability === "true",
                },
                (response: any) => {
                  console.log(response);
                  promptUser("admin");
                }
              );
            }
          );
        });
    });
      });
      break;
      case "2":
  rl.question("Enter item ID to update: ", (id) => {
    const itemId = parseInt(id);

    // Emit checkFoodItemExistence event to check if the item exists
    socket.emit("checkFoodItemExistence", itemId, (exists: boolean) => {
      if (exists) {
        // Item exists, prompt for new item details
        rl.question("Enter new item name: ", (name) => {
          rl.question("Enter new item price: ", (price) => {
            rl.question("Enter meal type: ", (mealType) => {
            rl.question(
              "Is the item available (true/false): ",
              (availability) => {
                // Convert availability string to boolean
                const isAvailable = availability === "true";

                // Once all information is gathered, emit updateMenuItem event
                socket.emit(
                  "updateMenuItem",
                  {
                    id: itemId,
                    name,
                    price: parseFloat(price),
                    mealType:mealType,
                    availability: isAvailable,
                  },
                  (response: any) => {
                    console.log(response);
                    promptUser("admin");
                  }
                );
              }
            );
          });
        });
        });
      } else {
        // Item does not exist, notify and prompt for valid ID
        console.log(`Menu item with ID ${itemId} does not exist.`);
        promptUser("admin");
      }
    });
  });
  break;
    case "3":
      rl.question("Enter item ID to delete: ", (id) => {
        socket.emit("deleteMenuItem", parseInt(id), (response: any) => {
          console.log(response);
          promptUser("admin");
        });
      });
      break;
    case "4":
      socket.emit("viewMenu", (response: any) => {
        if (response.success) {
          const formattedMenuItems = response.menuItems.map(
            (item: MenuItem) => ({
              id: item.id,
              name: item.name,
              price: item.price,
              mealType:item.mealType,
              availability: item.availability ? "available" : "not available",
            })
          );

          console.table(formattedMenuItems);
        } else {
          console.log("Failed to retrieve menu items.");
        }
        promptUser("admin");
      });
      break;
    case "5":
      socket.emit("viewMonthlyFeedback", (response: any) => {
        console.log(response.feedbackReport);
        promptUser("admin");
      });
      break;
    case "6":
      rl.close();
      socket.close();
      console.log("Goodbye!");
      break;
    default:
      console.log("Invalid choice, please try again.");
      promptUser("admin");
      break;
  }
}
