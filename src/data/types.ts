export type LatLng = [number, number];
export type Region = string;
export type SourceConfidence = "official-search" | "partial-route";
export type AreaWindowStatus = "bookable" | "sold-out" | "short-trip" | "inferred-gap" | "transfer";

export type CruiseArea = {
  id: string;
  prefix: string;
  label: string;
  center: LatLng;
  color: string;
};

export type Deployment = {
  id: string;
  shipId: string;
  areaId: string;
  start: string;
  end: string;
  region: Region;
  homePort: string;
  label: string;
  description: string;
  confidence: SourceConfidence;
  sourceName: string;
  sourceUrl: string;
  route: LatLng[];
  ports: string[];
  tripCode: string;
  routeCode?: string;
  routeName?: string;
  soldOut?: boolean;
};

export type CruiseShip = {
  id: string;
  name: string;
  code: string;
  color: string;
};

export type ShipAreaWindow = {
  id: string;
  shipId: string;
  shipCode: string;
  areaId: string;
  start: string;
  end: string;
  status: AreaWindowStatus;
  confidence: number;
  evidenceDays: number;
  sourceTripCodes: string[];
  previousAreaId?: string;
  nextAreaId?: string;
};

// ---------------------------------------------------------------------------
// Raw shapes of the generated JSON datasets (src/data/generated/*.json).
// ---------------------------------------------------------------------------

export type GeneratedStage = {
  name: string;
  portCode?: string;
  country?: string;
  date: string;
  pierLocation?: {
    lat: number;
    lon: number;
  };
};

export type GeneratedTrip = {
  tripCode: string;
  tripGroupCode?: string;
  ship: string;
  shipCode: string;
  dateFrom: string;
  dateTo: string;
  headline: string;
  detailUrl: string;
  route?: {
    code?: string;
    name?: string;
    mapSquare?: string;
    mapLandscape?: string;
  };
  ports: string[];
  stages: GeneratedStage[];
  isSoldOut?: boolean;
};

export type GeneratedData = {
  sourceUrl: string;
  fetchedAt: string;
  search: {
    fromDate: string;
    toDate: string;
  };
  totalReported: number;
  trips: GeneratedTrip[];
  portLocations: Record<string, { lat: number; lon: number; name: string; country?: string }>;
};

export type GeneratedAreaWindow = {
  id: string;
  shipCode: string;
  areaId: string;
  start: string;
  end: string;
  status: AreaWindowStatus;
  confidence: number;
  evidenceDays: number;
  sourceTripCodes: string[];
  previousAreaId?: string;
  nextAreaId?: string;
};

export type GeneratedAreaWindowsData = {
  generatedAt: string;
  method: {
    description: string;
    maxSameAreaGapDays: number;
    maxTransferGapDays: number;
  };
  windowCount: number;
  windows: GeneratedAreaWindow[];
};

// ---------------------------------------------------------------------------
// View-model types shared by the map and the selectors. Kept in the data layer
// (rather than in a component) so both presentation and logic can depend on
// them without a UI -> logic import cycle.
// ---------------------------------------------------------------------------

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
