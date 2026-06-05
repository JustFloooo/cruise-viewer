import L from "leaflet";
import { Marker, Popup } from "react-leaflet";
import { Anchor, ExternalLink } from "lucide-react";
import type { CruiseShip, Deployment, LatLng } from "../data/tuiDeployments";

type ShipMarkerProps = {
  ship: CruiseShip;
  deployment: Deployment;
  position: LatLng;
};

export function ShipMarker({ ship, deployment, position }: ShipMarkerProps) {
  const icon = L.divIcon({
    className: "ship-marker-wrapper",
    html: `<div class="ship-marker" style="--ship-color:${ship.color}"><span>${ship.name}</span></div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });

  return (
    <Marker position={position} icon={icon}>
      <Popup className="ship-popup">
        <div className="popup-stack">
          <div className="popup-title-row">
            <span className="popup-icon" style={{ backgroundColor: ship.color }}>
              <Anchor size={14} />
            </span>
            <div>
              <strong>{ship.name}</strong>
              <span>{deployment.label}</span>
            </div>
          </div>
          <p>{deployment.description}</p>
          <dl>
            <div>
              <dt>Area</dt>
              <dd>{deployment.region}</dd>
            </div>
            <div>
              <dt>Home port</dt>
              <dd>{deployment.homePort}</dd>
            </div>
            <div>
              <dt>Ports</dt>
              <dd>{deployment.ports.join(" -> ")}</dd>
            </div>
          </dl>
          <a href={deployment.sourceUrl} target="_blank" rel="noreferrer">
            {deployment.sourceName}
            <ExternalLink size={13} />
          </a>
        </div>
      </Popup>
    </Marker>
  );
}
