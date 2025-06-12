// City data for Blueskye Air Management Game

import { City } from './cityTypes';

export const CITIES: City[] = [
  {
    id: 'london',
    name: 'London',
    country: 'United Kingdom',
    population: 9500000,
    coordinates: {
      latitude: 51.5074,
      longitude: -0.1278
    }
  },
  {
    id: 'paris',
    name: 'Paris',
    country: 'France',
    population: 11000000,
    coordinates: {
      latitude: 48.8566,
      longitude: 2.3522
    }
  },
  {
    id: 'lyon',
    name: 'Lyon',
    country: 'France',
    population: 2300000,
    coordinates: {
      latitude: 45.7640,
      longitude: 4.8357
    }
  }
];

// Regional color palettes inspired by chartUtils
export const REGION_COLORS = {
  Europe: "#22c55e",     // Green base
  Americas: "#3b82f6",   // Blue base  
  Asia: "#f97316",       // Orange base
  Africa: "#8b5cf6",     // Purple base
  Oceania: "#eab308",    // Yellow base
};

export const COUNTRY_COLORS: { [key: string]: string } = {
  // Europe (Green variants)
  "United Kingdom": "#16a34a",    // Dark green
  "France": "#65a30d",           // Lime green
  "Germany": "#15803d",          // Forest green
  "Spain": "#84cc16",            // Light lime
  "Italy": "#4ade80",            // Light green
  
  // Americas (Blue variants) 
  "United States": "#0ea5e9",    // Sky blue
  "Canada": "#60a5fa",           // Light blue
  "Brazil": "#1d4ed8",           // Royal blue
  "Mexico": "#2563eb",           // Blue
  
  // Asia (Orange variants)
  "China": "#ea580c",            // Dark orange
  "Japan": "#fb923c",            // Light orange
  "India": "#c2410c",            // Burnt orange
  "South Korea": "#f59e0b",      // Amber
  
  // Default fallback colors
  default: "#64748b"             // Slate gray
};

// Utility function to lighten a color
function lightenColor(hex: string, factor: number): string {
  let r = parseInt(hex.substring(1, 3), 16);
  let g = parseInt(hex.substring(3, 5), 16);
  let b = parseInt(hex.substring(5, 7), 16);

  r = Math.round(r + (255 - r) * factor);
  g = Math.round(g + (255 - g) * factor);
  b = Math.round(b + (255 - b) * factor);

  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  b = Math.max(0, Math.min(255, b));

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// Utility function to darken a color
function darkenColor(hex: string, factor: number): string {
  let r = parseInt(hex.substring(1, 3), 16);
  let g = parseInt(hex.substring(3, 5), 16);
  let b = parseInt(hex.substring(5, 7), 16);

  r = Math.round(r * (1 - factor));
  g = Math.round(g * (1 - factor));
  b = Math.round(b * (1 - factor));

  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  b = Math.max(0, Math.min(255, b));

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Get color for a city based on its country and position within that country
 */
export function getCityColor(cityId: string): string {
  const city = getCity(cityId);
  if (!city) return COUNTRY_COLORS.default;
  
  const baseColor = COUNTRY_COLORS[city.country] || COUNTRY_COLORS.default;
  const citiesInCountry = getCitiesByCountry(city.country);
  
  if (citiesInCountry.length === 1) {
    return baseColor;
  }
  
  // Create variations for multiple cities in same country
  const cityIndex = citiesInCountry.findIndex(c => c.id === cityId);
  
  if (cityIndex === 0) {
    return baseColor; // First city gets base color
  } else if (cityIndex % 2 === 1) {
    return lightenColor(baseColor, 0.2 + (cityIndex * 0.1)); // Odd indices get lighter
  } else {
    return darkenColor(baseColor, 0.15 + (cityIndex * 0.05)); // Even indices get darker
  }
}

export function getCity(id: string): City | undefined {
  return CITIES.find(city => city.id === id);
}

export function getAllCities(): City[] {
  return CITIES;
}

export function getCitiesByCountry(country: string): City[] {
  return CITIES.filter(city => city.country === country);
} 