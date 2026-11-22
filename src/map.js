import L from "leaflet";
import "leaflet/dist/leaflet.css";

const MARKER_COLORS = ["#e53935", "#fb8c00", "#43a047", "#1e88e5", "#8e24aa", "#757575", "#212121", "#d4a017"];

export function createMap(element) {
  const map = L.map(element).setView([55.7558, 37.6176], 10);
  L.tileLayer(
    "https://core-renderer-tiles.maps.yandex.net/tiles?l=map&v=21.06.28&x={x}&y={y}&z={z}&scale=1&lang=ru_RU&projection=web_mercator",
    { attribution: '&copy; <a href="https://yandex.ru/maps/">Яндекс</a>', maxZoom: 19 },
  ).addTo(map);

  const resize = () => map.invalidateSize();
  window.addEventListener("resize", resize);
  requestAnimationFrame(resize);

  return {
    showLocation(location) {
      map.eachLayer((layer) => {
        if (layer instanceof L.Marker) map.removeLayer(layer);
      });
      return location.coordinates.map((coordinate, index) => {
        const color = MARKER_COLORS[index % MARKER_COLORS.length];
        const icon = L.divIcon({
          className: "location-marker",
          html: `<span style="--marker-color:${color}"></span>`,
          iconSize: [26, 38], iconAnchor: [13, 36], popupAnchor: [0, -32],
        });
        return L.marker(coordinate, { icon }).addTo(map);
      });
    },
    flyTo(location) {
      map.flyTo(location.coordinates[0], location.zoom, { animate: true, duration: 0.8 });
    },
  };
}

export function createPopupContent(location) {
  const container = document.createElement("div");
  const title = document.createElement("strong");
  const description = document.createElement("p");
  title.textContent = location.title;
  description.textContent = location.description.slice(0, 200);
  container.append(title, description);
  return container;
}
