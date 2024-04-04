const $ = (x) => document.getElementById(x);

let errorToast;

function showError(errMsg) {
  errorToast.innerText = `Error! ${errMsg}`;
  errorToast.classList.add("active");
  setTimeout(() => {
    errorToast.classList.remove("active");
  }, 3000);
}

window.addEventListener("load", () => {
  errorToast = $("error_toast");
});

// Carousel setup
window.addEventListener("load", () => {
  const carousels = document.getElementsByClassName("carousel");
  for (const carousel of carousels) {
    const carouselLabels = Array.from(carousel.children[0].children);
    const carouselSlides = Array.from(carousel.children[1].children);
    for (const carouselLabel of carouselLabels) {
      carouselLabel.onclick = () => {
        for (const carouselLabelFromClick of carouselLabels) {
          carouselLabelFromClick.classList.remove("active");
          if (carouselLabelFromClick === carouselLabel) {
            carouselLabelFromClick.classList.add("active");
          }
        }
        const labelText = carouselLabel.innerText;
        for (const carouselSlide of carouselSlides) {
          carouselSlide.classList.remove("active");
          if (
            carouselSlide.getAttribute("data-carousel-label") === labelText
          ) {
            carouselSlide.classList.add("active");
          }
        }
      };
    }
  }
});
