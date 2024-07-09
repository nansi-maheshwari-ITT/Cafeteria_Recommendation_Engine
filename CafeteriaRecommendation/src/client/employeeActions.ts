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
