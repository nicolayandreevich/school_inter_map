import "./style.css";
import { createMap, createPopupContent } from "./map.js";
import { DEFAULT_SHEET_ID, DEFAULT_SITE_TITLE, extractSheetId, fetchSheet } from "./sheets.js";

const ui = {
  title: document.querySelector("#siteTitle"),
  loader: document.querySelector("#loader"),
  toggle: document.querySelector("#loaderToggle"),
  form: document.querySelector("#sheetForm"),
  input: document.querySelector("#sheetUrl"),
  button: document.querySelector("#loadBtn"),
  message: document.querySelector("#loaderMsg"),
  picture: document.querySelector("#picturebar"),
  sidebar: document.querySelector("#sidebar"),
};

const map = createMap(document.querySelector("#map"));
let locations = [];
let currentIndex = 0;
let isLoading = false;

function setSiteTitle(value) {
  const title = value?.trim() || DEFAULT_SITE_TITLE;
  ui.title.textContent = title;
  document.title = title;
}

function setPanelContent(element, heading, text) {
  const title = document.createElement("h2");
  const paragraph = document.createElement("p");
  title.textContent = heading;
  paragraph.textContent = text;
  element.replaceChildren(title, paragraph);
}

function setMessage(message, type = "") {
  ui.message.textContent = message;
  ui.message.className = `loader-msg ${type}`.trim();
}

function showPicture(location) {
  if (!location.picture) {
    setPanelContent(ui.picture, "Нет изображения", "Для этой локации фотография не указана");
    return;
  }

  let imageUrl;
  try {
    imageUrl = new URL(location.picture);
  } catch {
    setPanelContent(ui.picture, "Изображение недоступно", "В таблице указана некорректная ссылка");
    return;
  }

  if (imageUrl.protocol !== "https:") {
    setPanelContent(ui.picture, "Изображение недоступно", "Разрешены только HTTPS-ссылки");
    return;
  }

  const image = document.createElement("img");
  image.src = imageUrl.href;
  image.alt = location.title;
  image.loading = "lazy";
  image.referrerPolicy = "no-referrer";
  image.addEventListener("error", () => {
    setPanelContent(ui.picture, "Изображение недоступно", "Не удалось загрузить фотографию");
  }, { once: true });
  ui.picture.replaceChildren(image);
}

function goTo(index) {
  if (!locations[index]) return;
  const location = locations[index];
  const markers = map.showLocation(location);
  markers.forEach((marker) => marker.bindPopup(createPopupContent(location), { autoPan: false }));
  map.flyTo(location);
  window.setTimeout(() => markers[0]?.openPopup(), 250);
  setPanelContent(ui.sidebar, location.title, location.description || "Описание отсутствует");
  showPicture(location);
  currentIndex = index;
}

function setLoaderCollapsed(collapsed) {
  ui.loader.classList.toggle("collapsed", collapsed);
  ui.toggle.textContent = collapsed ? "+" : "−";
  ui.toggle.setAttribute("aria-expanded", String(!collapsed));
  ui.toggle.setAttribute("aria-label", collapsed ? "Развернуть панель" : "Свернуть панель");
}

async function loadTable(sheetId, { initial = false } = {}) {
  if (isLoading) return;
  isLoading = true;
  ui.button.disabled = true;
  setMessage("Загружаю данные…");

  try {
    const result = await fetchSheet(sheetId);
    locations = result.locations;
    currentIndex = 0;
    setSiteTitle(result.title);
    setPanelContent(ui.sidebar, `${locations.length} локаций`, "Колёсико мыши или стрелки ↑ ↓ для навигации");
    goTo(0);
    setMessage("Таблица загружена", "success");
    if (!initial) setLoaderCollapsed(true);
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Неизвестная ошибка";
    setMessage(`${message}. Проверьте, что таблица доступна всем по ссылке.`, "error");
    if (initial) {
      setPanelContent(ui.sidebar, "Ошибка загрузки", message);
      setPanelContent(ui.picture, "Нет данных", "Не удалось загрузить таблицу");
      setSiteTitle(DEFAULT_SITE_TITLE);
    }
  } finally {
    isLoading = false;
    ui.button.disabled = false;
  }
}

ui.toggle.addEventListener("click", () => {
  setLoaderCollapsed(!ui.loader.classList.contains("collapsed"));
});

ui.form.addEventListener("submit", (event) => {
  event.preventDefault();
  const sheetId = extractSheetId(ui.input.value);
  if (!sheetId) {
    setMessage("Не удалось распознать ссылку или ID Google-таблицы", "error");
    return;
  }
  loadTable(sheetId);
});

ui.sidebar.addEventListener("wheel", (event) => {
  if (locations.length < 2) return;
  event.preventDefault();
  const next = Math.max(0, Math.min(locations.length - 1, currentIndex + (event.deltaY > 0 ? 1 : -1)));
  if (next !== currentIndex) goTo(next);
}, { passive: false });

document.addEventListener("keydown", (event) => {
  if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
  if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)) return;
  if (locations.length === 0) return;
  event.preventDefault();
  const next = Math.max(0, Math.min(locations.length - 1, currentIndex + (event.key === "ArrowDown" ? 1 : -1)));
  if (next !== currentIndex) goTo(next);
});

await loadTable(DEFAULT_SHEET_ID, { initial: true });
