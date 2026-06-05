import L from "leaflet";
import { Circle, MapContainer, Marker, TileLayer } from "react-leaflet";
import type { AreaWindowStatus, CruiseArea, CruiseShip, LatLng, ShipAreaWindow } from "../data/tuiDeployments";

export type ActiveShip = {
  ship: CruiseShip;
  areaWindow: ShipAreaWindow;
  area: CruiseArea;
  position: LatLng;
  status: AreaWindowStatus;
};

export type AreaGroup = {
  area: CruiseArea;
  ships: ActiveShip[];
  bookingCount: number;
};

type CruiseMapProps = {
  areaGroups: AreaGroup[];
  selectedAreaId?: string;
  onAreaSelect: (areaId: string) => void;
};

function areaLabelIcon(area: CruiseArea, isSelected: boolean) {
  return L.divIcon({
    className: "atlas-label-wrapper",
    html: `<button class="atlas-label ${isSelected ? "selected" : ""}" style="--area-color:${area.color}" type="button">
      <span>${area.label}</span>
    </button>`,
    iconSize: [170, 42],
    iconAnchor: [85, 21],
  });
}

export function CruiseMap({ areaGroups, selectedAreaId, onAreaSelect }: CruiseMapProps) {
  return (
    <MapContainer
      className="map"
      center={[23, 22]}
      zoom={2}
      minZoom={2}
      maxZoom={6}
      worldCopyJump
      scrollWheelZoom
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {areaGroups.map(({ area, ships }) => {
        const selected = selectedAreaId === area.id;
        return (
          <Circle
            key={`${area.id}-zone`}
            center={area.center}
            radius={area.id === "asia" || area.id === "north-america" ? 1380000 : 820000}
            pathOptions={{
              color: area.color,
              fillColor: area.color,
              fillOpacity: selected ? 0.26 : 0.13,
              opacity: selected ? 0.72 : 0.34,
              weight: selected ? 3 : 2,
            }}
            eventHandlers={{
              click: () => onAreaSelect(area.id),
            }}
          />
        );
      })}

      {areaGroups.map(({ area }) => {
        const selected = selectedAreaId === area.id;
        return (
          <Marker
            key={area.id}
            position={area.center}
            icon={areaLabelIcon(area, selected)}
            eventHandlers={{
              click: () => onAreaSelect(area.id),
            }}
          />
        );
      })}
    </MapContainer>
  );
}
