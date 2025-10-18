const overlay = document.getElementById("content-display-overlay");
const loadedArea = document.getElementById("loaded-content-area");
const closeButton = document.getElementById("close-overlay-button");

async function loadContent(url) {
  loadedArea.innerHTML = "";
  overlay.style.display = "flex";

  const iframe = document.createElement("iframe");
  iframe.src = url;
  iframe.style.width = "100%";
  iframe.style.height = "100%";
  iframe.style.border = "none";
  iframe.allow = "autoplay";
  loadedArea.appendChild(iframe);

  iframe.onload = () => console.log("Pantalla cargada:", url);
}

closeButton.addEventListener("click", () => {
  overlay.style.display = "none";
  loadedArea.innerHTML = "";
});