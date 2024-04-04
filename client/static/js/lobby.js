// Costume data
const costume = ["a", "a", "a", "b"];

// Lobby player preview
const playerEye = $("player_eye");
const playerMouth = $("player_mouth");
const playerHead = $("player_head");

// Lobby head colours
const headColours = document.getElementsByClassName("player_head_colour");
for (const headColour of headColours) {
  headColour.onclick = () => {
    const colour = headColour.getAttribute("data-colour");
    playerHead.classList = [`colour_${colour}`];
    const filter = window.getComputedStyle(playerHead).filter;
    document.documentElement.style.setProperty("--playerHeadHue", filter);
    costume[3] = colour;
  };
}

// Lobby costume items
const costumeCarousel = $("costume_carousel");
const costumeCarouselItems =
  costumeCarousel.getElementsByClassName("carousel__item");
for (const costumeCarouselItem of costumeCarouselItems) {
  const costumeItem = costumeCarouselItem.children[0];
  costumeItem.onclick = () => {
    const type = costumeItem.getAttribute("data-costume-type");
    const name = costumeItem.getAttribute("data-costume-name");
    const file = costumeItem.children[0].src;
    switch (type) {
      case "eye":
        playerEye.src = file;
        costume[0] = name;
        break;
      case "mouth":
        playerMouth.src = file;
        costume[1] = name;
        break;
      case "head":
        playerHead.src = file;
        costume[2] = name;
        break;
    }
  };
}

const nicknameForm = $("nickname_form");
const nicknameInput = $("nickname_input");
const nicknameSubmit = $("nickname_submit");

nicknameForm.onsubmit = (e) => {
  e.preventDefault();
  wsSend({
    type: "getToken",
    nickname: nicknameInput.value,
    costume: costume.join(""),
  });
};
