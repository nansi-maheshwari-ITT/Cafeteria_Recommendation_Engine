import { socket, loggedInUser } from "./client";
import { promptUser, rl, askQuestion } from "../server/utils/promptUtils";

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
      gatherVotesForMenu(loggedInUser.name);
    } else {
      console.log("User is not logged in");
      promptUser("employee");
    }
  });
}

async function gatherVotesForMenu(username: string) {
  const meals = ["breakfast", "lunch", "dinner"];
  
  for (const meal of meals) {
    let selectedItem: string;
    let isValid = false;
    
    while (!isValid) {
      selectedItem = await askQuestion(`Please choose an item for ${meal}: `);
      await new Promise<void>((resolve) => {
        socket.emit("submitVote", selectedItem, meal, username, (result: string) => {
          isValid = result === "true";
          console.log(result);
          resolve();
        });
      });
    }
  }

  console.log("Your selections have been successfully recorded.\n");
  promptUser("employee");
}


function viewNotification(): void {
  
}
