let conn;
let nickname;
let token;

let clients = {};

function wsSend(obj) {
  conn.send(JSON.stringify(obj));
}

window.addEventListener("load", () => {
  if (window["WebSocket"]) {
    conn = new WebSocket("ws://" + document.location.host + "/ws");

    conn.onclose = () => {
      document.body.style.filter = "grayscale(100%)";
      document.body.style.background = "grey";
    };

    conn.addEventListener("open", () => {
      console.log("WebSocket connected");

      conn.addEventListener("message", (e) => {
        const messages = e.data.split("\n");
        for (const message of messages) {
          const data = JSON.parse(message);

          switch (data.type) {
            case "full":
              alert("The server is full, sorry!");
              break;
            case "getToken":
              token = data.token;
              nickname = data.nickname;
              if (!token) {
                showError(data.error);
                break;
              }
              console.log(
                `Token received: ${token}. Welcome ${data.nickname}!`,
              );
              spaNavigate("room");
              clients = data.clients;
              break;
          }
        }
      });
    });
  } else {
    alert("WebSocket is not supported in this browser");
  }
});
