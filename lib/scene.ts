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
    skyTop: "#2e3a63",
    skyBottom: "#f0c3bd",
    glow: "#f8dfcb",
    disc: "#fff1d9",
    discEdge: "#ffdab6",
    cloudFar: "#7d7ba4",
    cloudMid: "#c9a2b0",
    cloudNear: "#f3d5d1",
    ridgeFar: "#7b7fa8",
    ridgeMid: "#565d88",
    ridgeNear: "#363c60",
    water: "#56618c",
    waterShine: "#e0c4c6",
    grass: "#2f3757",
    grassDark: "#222846",
    bird: "#2b3050",
    stars: "#e3e9ff",
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
    skyTop: "#2b2854",
    skyBottom: "#f2884b",
    glow: "#f8ad63",
    disc: "#ffab52",
    discEdge: "#f2853a",
    cloudFar: "#65527c",
    cloudMid: "#bf6a60",
    cloudNear: "#f39a6b",
    ridgeFar: "#654f75",
    ridgeMid: "#42395a",
    ridgeNear: "#26233c",
    water: "#3a3760",
    waterShine: "#ea8c55",
    grass: "#221f38",
    grassDark: "#17152c",
    bird: "#1f1c32",
    stars: "#e9deff",
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
