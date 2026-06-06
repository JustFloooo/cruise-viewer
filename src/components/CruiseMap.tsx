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
import type { ActiveShip, AreaGroup, CruiseShip, Deployment } from "../data/types";

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
const PATTERN_SIZE = 12;
const PIN_CLUSTER_RADIUS = 11;
const PIN_COLLISION_DISTANCE = 18;

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
  selectedShipId?: string;
  onAreaSelect: (areaId: string) => void;
  onShipSelect: (ship: CruiseShip) => void;
};

type ShipPin = {
  id: string;
  name: string;
  ship: CruiseShip;
  areaLabel: string;
  status: ActiveShip["status"];
  deployment?: Deployment;
  x: number;
  y: number;
  offsetX: number;
  offsetY: number;
  clusterSize: number;
};

function sourceDeploymentFor(activeShip: ActiveShip): Deployment | undefined {
  return activeShip.areaWindow.sourceTripCodes
    .map((tripCode) => deploymentByTripCode.get(tripCode))
    .find(Boolean);
}

function spreadCluster(count: number, index: number): { offsetX: number; offsetY: number } {
  if (count <= 1) return { offsetX: 0, offsetY: 0 };

  const angle = -Math.PI / 2 + (index / count) * Math.PI * 2;
  const radius = PIN_CLUSTER_RADIUS + Math.max(0, count - 3) * 1.5;
  return {
    offsetX: Math.cos(angle) * radius,
    offsetY: Math.sin(angle) * radius,
  };
}

function spreadShipPins(pins: Omit<ShipPin, "offsetX" | "offsetY" | "clusterSize">[]): ShipPin[] {
  const clusters: Omit<ShipPin, "offsetX" | "offsetY" | "clusterSize">[][] = [];

  for (const pin of [...pins].sort((a, b) => a.name.localeCompare(b.name))) {
    const cluster = clusters.find((candidate) => {
      const centerX = candidate.reduce((sum, item) => sum + item.x, 0) / candidate.length;
      const centerY = candidate.reduce((sum, item) => sum + item.y, 0) / candidate.length;
      return Math.hypot(pin.x - centerX, pin.y - centerY) <= PIN_COLLISION_DISTANCE;
    });

    if (cluster) {
      cluster.push(pin);
    } else {
      clusters.push([pin]);
    }
  }

  return clusters.flatMap((cluster) => {
    const centerX = cluster.reduce((sum, pin) => sum + pin.x, 0) / cluster.length;
    const centerY = cluster.reduce((sum, pin) => sum + pin.y, 0) / cluster.length;

    return cluster
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((pin, index) => ({
        ...pin,
        x: cluster.length > 1 ? centerX : pin.x,
        y: cluster.length > 1 ? centerY : pin.y,
        ...spreadCluster(cluster.length, index),
        clusterSize: cluster.length,
      }));
  });
}

export function CruiseMap({
  areaGroups,
  selectedAreaId,
  selectedShipId,
  onAreaSelect,
  onShipSelect,
}: CruiseMapProps) {
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
    const placed: Omit<ShipPin, "offsetX" | "offsetY" | "clusterSize">[] = [];
    for (const group of areaGroups) {
      if (!areaShapeById.has(group.area.id)) continue; // only areas we draw a shape for
      for (const activeShip of group.ships) {
        const [lat, lng] = activeShip.position;
        const point = projection([lng, lat]);
        if (!point) continue;
        placed.push({
          id: activeShip.ship.id,
          name: activeShip.ship.name,
          ship: activeShip.ship,
          areaLabel: activeShip.area.label,
          status: activeShip.status,
          deployment: sourceDeploymentFor(activeShip),
          x: point[0],
          y: point[1],
        });
      }
    }
    return spreadShipPins(placed);
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
        <defs>
          {areaShapes.map((shape) => (
            <pattern
              key={shape.properties.areaId}
              id={`atlas-pattern-${shape.properties.areaId}`}
              patternUnits="userSpaceOnUse"
              width={PATTERN_SIZE}
              height={PATTERN_SIZE}
              patternTransform="rotate(45)"
            >
              <line
                className="atlas-area-pattern-line"
                x1={0}
                y1={0}
                x2={0}
                y2={PATTERN_SIZE}
                stroke={shape.properties.color}
              />
            </pattern>
          ))}
        </defs>

        <g transform={transform.toString()}>
          {/* Shaded, interactive area polygons (below the land mask). */}
          <g className="atlas-areas">
            {areaShapes.map((shape) => {
              const d = path(shape);
              if (!d) return null;
              const id = shape.properties.areaId;
              const isSelected = selectedAreaId === id;
              const isHovered = hoveredAreaId === id;
              const emphasis = isSelected || isHovered;
              return (
                <g
                  key={id}
                  className="atlas-area"
                  data-area-id={id}
                  data-selected={isSelected}
                  data-hovered={isHovered}
                  onMouseEnter={() => setHoveredAreaId(id)}
                  onMouseLeave={() => setHoveredAreaId((current) => (current === id ? undefined : current))}
                  onClick={() => onAreaSelect(id)}
                >
                  <path
                    className="atlas-area-fill"
                    d={d}
                    fill={shape.properties.color}
                    fillOpacity={isSelected ? 0.56 : isHovered ? 0.48 : 0.36}
                    stroke={shape.properties.color}
                    strokeOpacity={emphasis ? 0.72 : 0.44}
                  />
                  <path
                    className="atlas-area-pattern"
                    d={d}
                    fill={`url(#atlas-pattern-${id})`}
                    opacity={isSelected ? 0.34 : isHovered ? 0.27 : 0.18}
                  />
                </g>
              );
            })}
          </g>

          {/* Opaque land mask (no country borders), purely visual. */}
          <path className="atlas-land" d={landPath} />

          {/* Ship pins at their date-aware route position (or area centre fallback). */}
          <g className="atlas-ships">
            {pins.map((pin) => (
              <g
                key={pin.id}
                className="atlas-ship"
                data-clustered={pin.clusterSize > 1}
                data-selected={selectedShipId === pin.id}
                role="button"
                tabIndex={0}
                aria-label={`Select ${pin.name}`}
                transform={`translate(${pin.x}, ${pin.y})`}
                onClick={(event) => {
                  event.stopPropagation();
                  onShipSelect(pin.ship);
                }}
                onKeyDown={(event) => {
                  if (event.key !== "Enter" && event.key !== " ") return;
                  event.preventDefault();
                  onShipSelect(pin.ship);
                }}
              >
                {pin.clusterSize > 1 ? (
                  <line
                    className="atlas-ship-cluster-line"
                    x1={0}
                    y1={0}
                    x2={pin.offsetX * inverseScale}
                    y2={pin.offsetY * inverseScale}
                  />
                ) : null}
                <g transform={`translate(${pin.offsetX * inverseScale}, ${pin.offsetY * inverseScale}) scale(${inverseScale})`}>
                  <circle className="atlas-ship-halo" r={8} />
                  <path
                    className="atlas-ship-glyph"
                    d="M -5 -1.2 L -3.4 4 L 3.4 4 L 5 -1.2 L 1.6 -1.2 L 0 -5 L -1.6 -1.2 Z"
                  />
                  {showShipLabels ? <text x={9} y={4}>{pin.name}</text> : null}
                </g>
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
