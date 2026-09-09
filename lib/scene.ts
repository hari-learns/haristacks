/**
 * Scene palettes for the pixel horizon.
 *
 * The site's one idea is impermanence — "we are nothing but a passing cloud
 * to the mountains and oceans". So the horizon is drawn in the visitor's own
 * time of day. The same page is a different page at 6am and at 9pm.
 */

export type PhaseName = "dawn" | "day" | "dusk" | "night";

export type ScenePalette = {
  name: PhaseName;
  label: string;
  skyTop: string;
  skyBottom: string;
  glow: string;
  disc: string;
  discEdge: string;
  cloudFar: string;
  cloudMid: string;
  cloudNear: string;
  ridgeFar: string;
  ridgeMid: string;
  ridgeNear: string;
  water: string;
  waterShine: string;
  grass: string;
  grassDark: string;
  bird: string;
  stars: string | null;
};

export const PHASES: Record<PhaseName, ScenePalette> = {
  dawn: {
    name: "dawn",
    label: "dawn",
    skyTop: "#3f4a75",
    skyBottom: "#f2b394",
    glow: "#f7cfa6",
    disc: "#ffe2b0",
    discEdge: "#ffc98a",
    cloudFar: "#8f7f9e",
    cloudMid: "#d9a6a1",
    cloudNear: "#f6d2bd",
    ridgeFar: "#6d6b91",
    ridgeMid: "#4c5175",
    ridgeNear: "#2f3554",
    water: "#4a5580",
    waterShine: "#e6b79b",
    grass: "#2a3350",
    grassDark: "#1d2440",
    bird: "#2a2b45",
    stars: "#cdd6ff",
  },
  day: {
    name: "day",
    label: "day",
    skyTop: "#6ea8cf",
    skyBottom: "#cfe7ea",
    glow: "#eef7f2",
    disc: "#fff8dc",
    discEdge: "#ffeeb0",
    cloudFar: "#b9d6e4",
    cloudMid: "#e2f0f4",
    cloudNear: "#ffffff",
    ridgeFar: "#93b4a8",
    ridgeMid: "#67907e",
    ridgeNear: "#3f6b58",
    water: "#5f9aa8",
    waterShine: "#c4e6e6",
    grass: "#37624b",
    grassDark: "#26493a",
    bird: "#39514a",
    stars: null,
  },
  dusk: {
    name: "dusk",
    label: "dusk",
    skyTop: "#33345f",
    skyBottom: "#ef9a63",
    glow: "#f6bd80",
    disc: "#ffbc6d",
    discEdge: "#f89a52",
    cloudFar: "#6f5c85",
    cloudMid: "#c17d78",
    cloudNear: "#f0ab86",
    ridgeFar: "#6b5779",
    ridgeMid: "#48405f",
    ridgeNear: "#2a2740",
    water: "#3f3d63",
    waterShine: "#e79a68",
    grass: "#25233c",
    grassDark: "#1a1930",
    bird: "#221f36",
    stars: "#e5d9ff",
  },
  night: {
    name: "night",
    label: "night",
    skyTop: "#0c1330",
    skyBottom: "#2c4568",
    glow: "#3f5f86",
    disc: "#eef2ff",
    discEdge: "#c3d0ee",
    cloudFar: "#24334f",
    cloudMid: "#36486b",
    cloudNear: "#4d6389",
    ridgeFar: "#3a4f72",
    ridgeMid: "#243758",
    ridgeNear: "#15223e",
    water: "#1c2e4c",
    waterShine: "#82a2ce",
    grass: "#111e33",
    grassDark: "#0a1424",
    bird: "#0b1322",
    stars: "#f2f6ff",
  },
};

/** Which palette belongs to a given local hour. */
export function phaseForHour(hour: number): PhaseName {
  if (hour >= 5 && hour < 8) return "dawn";
  if (hour >= 8 && hour < 17) return "day";
  if (hour >= 17 && hour < 20) return "dusk";
  return "night";
}

export function paletteForHour(hour: number): ScenePalette {
  return PHASES[phaseForHour(hour)];
}
