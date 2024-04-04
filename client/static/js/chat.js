const chatLog = $("chat_log");
const chatForm = $("chat_form");
const chatInput = $("chat_input");
const chatPlayers = $("chat_players");

appendLog(`Welcome ${nickname}!`);
for (const nickname in clients) {
  appendPlayerCostume(clients[nickname], nickname);
}
appendPlayerCostume(costume, nickname);

function appendLog(msg) {
  const chatBubble = document.createElement("div");
  const text = document.createElement("div");
  chatBubble.classList.add("chat_bubble");
  text.innerText = msg;
  chatBubble.appendChild(text);
  chatLog.prepend(chatBubble);
}

function appendPlayerCostume(playerCostume, playerNickname) {
  const playerCostume = document.createElement("div");
  playerCostume.classList.add("player_costume", "guest");
  if (nickname === playerNickname) {
    playerNickname += " (You)";
  }
  playerCostume.setAttribute("data-nickname", playerNickname);
  const [head, eye, mouth] = [
    document.createElement("img"),
    document.createElement("img"),
    document.createElement("img"),
  ];
  eye.src = `img/player/eye/${playerCostume[0]}.svg`;
  mouth.src = `img/player/mouth/${playerCostume[1]}.svg`;
  head.src = `img/player/head/${playerCostume[2]}.svg`;
  head.classList.add("player_head", `colour_${playerCostume[3]}`);
  playerCostume.appendChild(head);
  playerCostume.appendChild(eye);
  playerCostume.appendChild(mouth);
  chatPlayers.appendChild(playerCostume);
}

conn.addEventListener("message", (e) => {
  const messages = e.data.split("\n");
  for (const message of messages) {
    const data = JSON.parse(message);

    switch (data.type) {
      case "connected":
        appendLog(`${data.nickname} connected`);
        appendPlayerCostume(data.costume, data.nickname);
        break;
      case "disconnected":
        appendLog(`${data.nickname} disconnected`);
        for (const player of chatPlayers.children) {
          if (player.getAttribute("data-nickname") === data.nickname) {
            chatPlayers.removeChild(player);
          }
        }
        break;
      case "chat":
        if (data.error) {
          showError(data.error);
        } else {
          appendLog(`${data.nickname}: ${data.chat}`);
        }
        break;
    }
  }
});

chatForm.onsubmit = (e) => {
  e.preventDefault();
  if (chatInput.value.length > 0 && chatInput.value.length < 40) {
    wsSend({ type: "chat", chat: chatInput.value });
    chatInput.value = "";
  } else {
    showError("Chat message must be between 0 and 40 characters long");
  }
};
