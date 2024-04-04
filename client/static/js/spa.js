const main = $("main");
const spaNavs = document.getElementsByClassName("spaNav");

function x(url, callback) {
  const httpRequest = new XMLHttpRequest();

  httpRequest.onreadystatechange = () => {
    if (httpRequest.readyState === XMLHttpRequest.DONE) {
      if (httpRequest.status === 200) {
        callback(httpRequest.responseText);
      } else {
        console.log("AJAX Error");
      }
    }
  };

  httpRequest.open("GET", url);
  httpRequest.send();
}

function spaNavigate(location) {
  x(`/spa/${location}?n=${nickname}&t=${token}`, (responseText) => {
    main.classList = [location];
    main.innerHTML = responseText;

    const jsFiles = $("js_files").getElementsByTagName("li");
    Array.from(jsFiles).forEach((jsFile) => {
      const script = document.createElement("script");
      script.src = "js/" + jsFile.innerText;
      main.appendChild(script);
    });
  });
}

for (const spaNav of spaNavs) {
  spaNav.onclick = () => {
    spaNavigate(spaNav.getAttribute("data-dest"));
  };
}
