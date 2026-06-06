import { useEffect, useMemo, useRef, useState } from "react";
import { Maximize2, Minus, Plus } from "lucide-react";
import { geoMercator, geoPath } from "d3-geo";
import { select } from "d3-selection";
import { zoom, zoomIdentity, type ZoomBehavior, type ZoomTransform } from "d3-zoom";
import { feature } from "topojson-client";
import type { Feature, FeatureCollection } from "geojson";
import landTopo from "world-atlas/land-110m.json";
import { areaShapeById, areaShapes, mapViewExtent } from "../data/areaShapes";
import { deploymentByTripCode } from "../data/deployments";
import type { ActiveShip, AreaGroup, LatLng } from "../data/types";

// Fixed internal coordinate space. The SVG scales to its container purely via the
// viewBox, so resizing never re-projects (no jank), and zoom/pan is layered on top
// as a transform. The projection therefore only depends on these constants.
const WIDTH = 960;
const HEIGHT = 600;
const PAD = 12;
const MIN_ZOOM = 1;
const MAX_ZOOM = 32;
const ZOOM_STEP = 1.6;

// Labels keep a constant screen size, so when zoomed out they sprawl over a tiny
// region. Only show them once zoomed in enough to be legible.
const AREA_LABEL_MIN_ZOOM = 1.6;
const SHIP_LABEL_MIN_ZOOM = 4;

// world-atlas ships an untyped TopoJSON asset, so we cast at this boundary.
const landData = landTopo as unknown as { objects: { land: object } };
const landGeo = feature(landData as never, landData.objects.land as never) as
  | Feature
  | FeatureCollection;

const projection = geoMercator().fitExtent(
  [
    [PAD, PAD],
    [WIDTH - PAD, HEIGHT - PAD],
  ],
  mapViewExtent,
);
const path = geoPath(projection);
const landPath = path(landGeo) ?? undefined;

type CruiseMapProps = {
  areaGroups: AreaGroup[];
  selectedAreaId?: string;
  onAreaSelect: (areaId: string) => void;
};

// Our LatLng tuples are [lat, lng]; GeoJSON / d3 expect [lng, lat].
function shipPinLatLng(activeShip: ActiveShip): LatLng {
  const deployment = activeShip.areaWindow.sourceTripCodes
    .map((tripCode) => deploymentByTripCode.get(tripCode))
    .find(Boolean);
  return deployment?.route?.[0] ?? activeShip.position;
}

export function CruiseMap({ areaGroups, selectedAreaId, onAreaSelect }: CruiseMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomBehaviorRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const [transform, setTransform] = useState<ZoomTransform>(zoomIdentity);
  const [hoveredAreaId, setHoveredAreaId] = useState<string | undefined>();

  // Attach d3-zoom (wheel / pinch to zoom, drag to pan) once.
  useEffect(() => {
    const node = svgRef.current;
    if (!node) return undefined;
    const zoomBehavior = zoom<SVGSVGElement, unknown>()
      .scaleExtent([MIN_ZOOM, MAX_ZOOM])
      .translateExtent([
        [0, 0],
        [WIDTH, HEIGHT],
      ])
      .on("zoom", (event) => setTransform(event.transform));
    zoomBehaviorRef.current = zoomBehavior;
    select(node).call(zoomBehavior);
    return () => {
      select(node).on(".zoom", null);
      zoomBehaviorRef.current = null;
    };
  }, []);

  function scaleByFactor(factor: number) {
    const node = svgRef.current;
    const behavior = zoomBehaviorRef.current;
    if (!node || !behavior) return;
    select(node).call(behavior.scaleBy, factor);
  }

  function resetView() {
    const node = svgRef.current;
    const behavior = zoomBehaviorRef.current;
    if (!node || !behavior) return;
    select(node).call(behavior.transform, zoomIdentity);
  }

  const pins = useMemo(() => {
    const placed: { id: string; name: string; color: string; x: number; y: number }[] = [];
    for (const group of areaGroups) {
      if (!areaShapeById.has(group.area.id)) continue; // only areas we draw a shape for
      for (const activeShip of group.ships) {
        const [lat, lng] = shipPinLatLng(activeShip);
        const point = projection([lng, lat]);
        if (!point) continue;
        placed.push({
          id: activeShip.ship.id,
          name: activeShip.ship.name,
          color: activeShip.ship.color,
          x: point[0],
          y: point[1],
        });
      }
    }
    return placed;
  }, [areaGroups]);

  // Counter-scale point glyphs (pins, labels) so they keep a constant screen size
  // as the geography zooms.
  const inverseScale = 1 / transform.k;
  const showAreaLabels = transform.k >= AREA_LABEL_MIN_ZOOM;
  const showShipLabels = transform.k >= SHIP_LABEL_MIN_ZOOM;

  return (
    <div className="atlas">
      <svg
        ref={svgRef}
        className="atlas-map"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Mediterranean cruise atlas"
      >
        {/* Static ocean background (not zoomed). */}
        <rect className="atlas-ocean" x={0} y={0} width={WIDTH} height={HEIGHT} />

        <g transform={transform.toString()}>
          {/* Shaded, interactive area polygons (below the land mask). */}
          <g className="atlas-areas">
            {areaShapes.map((shape) => {
              const d = path(shape);
              if (!d) return null;
              const id = shape.properties.areaId;
              const isSelected = selectedAreaId === id;
              const isHovered = hoveredAreaId === id;
              return (
                <path
                  key={id}
                  className="atlas-area"
                  d={d}
                  fill={shape.properties.color}
                  fillOpacity={isSelected ? 0.42 : isHovered ? 0.3 : 0.2}
                  onMouseEnter={() => setHoveredAreaId(id)}
                  onMouseLeave={() => setHoveredAreaId((current) => (current === id ? undefined : current))}
                  onClick={() => onAreaSelect(id)}
                />
              );
            })}
          </g>

          {/* Opaque land mask (no country borders), purely visual. */}
          <path className="atlas-land" d={landPath} />

          {/* Ship pins at their start harbour (or area centre fallback). */}
          <g className="atlas-ships">
            {pins.map((pin) => (
              <g
                key={pin.id}
                className="atlas-ship"
                transform={`translate(${pin.x}, ${pin.y}) scale(${inverseScale})`}
              >
                <circle r={5} fill={pin.color} />
                {showShipLabels ? <text x={9} y={4}>{pin.name}</text> : null}
              </g>
            ))}
          </g>

          {/* Area labels at each shape's centroid (only when zoomed in enough to read). */}
          {showAreaLabels ? (
            <g className="atlas-labels">
              {areaShapes.map((shape) => {
                const centroid = path.centroid(shape);
                if (!centroid || Number.isNaN(centroid[0])) return null;
                const id = shape.properties.areaId;
                const emphasised = selectedAreaId === id || hoveredAreaId === id;
                return (
                  <text
                    key={id}
                    className="atlas-area-label"
                    transform={`translate(${centroid[0]}, ${centroid[1]}) scale(${inverseScale})`}
                    opacity={emphasised ? 1 : 0.72}
                  >
                    {shape.properties.label}
                  </text>
                );
              })}
            </g>
          ) : null}
        </g>
      </svg>

      <div className="atlas-zoom-controls">
        <button type="button" onClick={() => scaleByFactor(ZOOM_STEP)} aria-label="Zoom in">
          <Plus size={16} />
        </button>
        <button type="button" onClick={() => scaleByFactor(1 / ZOOM_STEP)} aria-label="Zoom out">
          <Minus size={16} />
        </button>
        <button type="button" onClick={resetView} aria-label="Reset view">
          <Maximize2 size={15} />
        </button>
      </div>
    </div>
  );
}
