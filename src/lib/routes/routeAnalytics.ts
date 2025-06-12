// Route analytics and profitability analysis service

import { Route } from './routeTypes';
import { getActiveRoutes, getRouteStats } from './routeService';
import { getAllCities, getCity } from '../geography/cityData';
import { calculateCityDistance } from '../geography/distanceService';
import { getGameState } from '../gamemechanics/gameState';

export interface RoutePerformanceMetrics {
  routeId: string;
  originCityId: string;
  destinationCityId: string;
  totalFlights: number;
  averageLoadFactor: number;
  averageProfit: number;
  totalRevenue: number;
  totalCosts: number;
  profitMargin: number;
  demandScore: number;
  competitiveness: string;
  recommendation: string;
}

export interface MarketAnalysis {
  cityId: string;
  cityName: string;
  totalDemand: number;
  servedDemand: number;
  unservedDemand: number;
  averagePrice: number;
  competitionLevel: string;
  marketOpportunity: string;
}

export interface ProfitabilityAnalysis {
  totalRoutes: number;
  profitableRoutes: number;
  unprofitableRoutes: number;
  averageProfitMargin: number;
  bestPerformingRoute: RoutePerformanceMetrics | null;
  worstPerformingRoute: RoutePerformanceMetrics | null;
  recommendations: string[];
}

// Calculate route performance metrics
export function analyzeRoutePerformance(): RoutePerformanceMetrics[] {
  const gameState = getGameState();
  const completedRoutes = gameState.completedRoutes || [];
  
  // Group routes by origin-destination pair
  const routeGroups = new Map<string, Route[]>();
  
  completedRoutes.forEach(route => {
    const routeKey = `${route.originCityId}-${route.destinationCityId}`;
    if (!routeGroups.has(routeKey)) {
      routeGroups.set(routeKey, []);
    }
    routeGroups.get(routeKey)!.push(route);
  });
  
  const performanceMetrics: RoutePerformanceMetrics[] = [];
  
  routeGroups.forEach((routes, routeKey) => {
    const [originCityId, destinationCityId] = routeKey.split('-');
    const totalFlights = routes.length;
    
    if (totalFlights === 0) return;
    
    // Calculate averages
    const totalPassengers = routes.reduce((sum, route) => sum + route.passengers, 0);
    const totalCapacity = routes.reduce((sum, route) => sum + route.maxPassengers, 0);
    const averageLoadFactor = totalCapacity > 0 ? (totalPassengers / totalCapacity) * 100 : 0;
    
    const totalRevenue = routes.reduce((sum, route) => sum + route.totalRevenue, 0);
    const totalCosts = routes.reduce((sum, route) => sum + route.fuelCost, 0);
    const totalProfit = totalRevenue - totalCosts;
    const averageProfit = totalProfit / totalFlights;
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    
    // Calculate demand score based on load factor and frequency
    const demandScore = averageLoadFactor * (totalFlights / 10); // Higher score for frequent, full flights
    
    // Determine competitiveness
    let competitiveness: string;
    if (profitMargin > 25) competitiveness = 'Excellent';
    else if (profitMargin > 15) competitiveness = 'Good';
    else if (profitMargin > 5) competitiveness = 'Average';
    else if (profitMargin > -5) competitiveness = 'Poor';
    else competitiveness = 'Unprofitable';
    
    // Generate recommendations
    let recommendation: string;
    if (averageLoadFactor > 90) {
      recommendation = 'Consider increasing frequency or aircraft size';
    } else if (averageLoadFactor < 60) {
      recommendation = 'Consider reducing frequency or aircraft size';
    } else if (profitMargin < 10) {
      recommendation = 'Review pricing strategy or cost management';
    } else {
      recommendation = 'Route performing well, maintain current strategy';
    }
    
    performanceMetrics.push({
      routeId: routeKey,
      originCityId,
      destinationCityId,
      totalFlights,
      averageLoadFactor: Math.round(averageLoadFactor * 10) / 10,
      averageProfit: Math.round(averageProfit),
      totalRevenue: Math.round(totalRevenue),
      totalCosts: Math.round(totalCosts),
      profitMargin: Math.round(profitMargin * 10) / 10,
      demandScore: Math.round(demandScore * 10) / 10,
      competitiveness,
      recommendation
    });
  });
  
  return performanceMetrics.sort((a, b) => b.profitMargin - a.profitMargin);
}

// Analyze market opportunities by city
export function analyzeMarketOpportunities(): MarketAnalysis[] {
  const cities = getAllCities();
  const gameState = getGameState();
  const completedRoutes = gameState.completedRoutes || [];
  const activeRoutes = gameState.activeRoutes || [];
  const allRoutes = [...completedRoutes, ...activeRoutes];
  
  const marketAnalysis: MarketAnalysis[] = [];
  
  cities.forEach(city => {
    // Calculate routes serving this city (as origin or destination)
    const cityRoutes = allRoutes.filter(route => 
      route.originCityId === city.id || route.destinationCityId === city.id
    );
    
    // Estimate total demand potential
    const totalDemand = city.population * city.passengerDemandMultiplier * 0.001; // Simplified demand estimation
    
    // Calculate served demand
    const servedDemand = cityRoutes.reduce((sum, route) => {
      return sum + (route.originCityId === city.id ? route.passengers : route.passengers * 0.5);
    }, 0);
    
    const unservedDemand = Math.max(0, totalDemand - servedDemand);
    
    // Calculate average pricing
    const relevantRoutes = cityRoutes.filter(route => route.originCityId === city.id);
    const averagePrice = relevantRoutes.length > 0 ? 
      relevantRoutes.reduce((sum, route) => sum + route.pricePerPassenger, 0) / relevantRoutes.length : 0;
    
    // Determine competition level
    let competitionLevel: string;
    const routeCount = cityRoutes.length;
    if (routeCount === 0) competitionLevel = 'No Service';
    else if (routeCount < 3) competitionLevel = 'Low';
    else if (routeCount < 6) competitionLevel = 'Medium';
    else competitionLevel = 'High';
    
    // Market opportunity assessment
    let marketOpportunity: string;
    const demandRatio = unservedDemand / totalDemand;
    if (demandRatio > 0.7) marketOpportunity = 'High Potential';
    else if (demandRatio > 0.4) marketOpportunity = 'Medium Potential';
    else if (demandRatio > 0.1) marketOpportunity = 'Low Potential';
    else marketOpportunity = 'Saturated';
    
    marketAnalysis.push({
      cityId: city.id,
      cityName: city.name,
      totalDemand: Math.round(totalDemand),
      servedDemand: Math.round(servedDemand),
      unservedDemand: Math.round(unservedDemand),
      averagePrice: Math.round(averagePrice),
      competitionLevel,
      marketOpportunity
    });
  });
  
  return marketAnalysis.sort((a, b) => b.unservedDemand - a.unservedDemand);
}

// Overall profitability analysis
export function analyzeProfitability(): ProfitabilityAnalysis {
  const routeMetrics = analyzeRoutePerformance();
  
  if (routeMetrics.length === 0) {
    return {
      totalRoutes: 0,
      profitableRoutes: 0,
      unprofitableRoutes: 0,
      averageProfitMargin: 0,
      bestPerformingRoute: null,
      worstPerformingRoute: null,
      recommendations: ['Start operating routes to gather performance data']
    };
  }
  
  const profitableRoutes = routeMetrics.filter(route => route.profitMargin > 0).length;
  const unprofitableRoutes = routeMetrics.filter(route => route.profitMargin <= 0).length;
  
  const averageProfitMargin = routeMetrics.reduce((sum, route) => sum + route.profitMargin, 0) / routeMetrics.length;
  
  const bestPerformingRoute = routeMetrics[0] || null;
  const worstPerformingRoute = routeMetrics[routeMetrics.length - 1] || null;
  
  // Generate recommendations
  const recommendations: string[] = [];
  
  if (averageProfitMargin < 10) {
    recommendations.push('Overall profitability is low. Review pricing and cost management strategies.');
  }
  
  if (unprofitableRoutes > profitableRoutes) {
    recommendations.push('More routes are unprofitable than profitable. Consider discontinuing worst-performing routes.');
  }
  
  const lowLoadFactorRoutes = routeMetrics.filter(route => route.averageLoadFactor < 70).length;
  if (lowLoadFactorRoutes > routeMetrics.length * 0.5) {
    recommendations.push('Many routes have low load factors. Consider using smaller aircraft or reducing frequency.');
  }
  
  const highDemandCities = analyzeMarketOpportunities().filter(market => market.marketOpportunity === 'High Potential');
  if (highDemandCities.length > 0) {
    recommendations.push(`Consider expanding to high-potential markets: ${highDemandCities.slice(0, 3).map(c => c.cityName).join(', ')}`);
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Your route network is performing well. Continue monitoring and consider strategic expansion.');
  }
  
  return {
    totalRoutes: routeMetrics.length,
    profitableRoutes,
    unprofitableRoutes,
    averageProfitMargin: Math.round(averageProfitMargin * 10) / 10,
    bestPerformingRoute,
    worstPerformingRoute,
    recommendations
  };
}

// Get route efficiency score (0-100)
export function calculateRouteEfficiency(route: Route): number {
  const loadFactor = (route.passengers / route.maxPassengers) * 100;
  const profitMargin = route.totalRevenue > 0 ? (route.profit / route.totalRevenue) * 100 : 0;
  
  // Weighted efficiency score
  const efficiency = (loadFactor * 0.6) + (Math.max(0, profitMargin) * 0.4);
  
  return Math.min(100, Math.max(0, Math.round(efficiency)));
}

// Find best routes to a specific destination
export function findBestRoutesToDestination(destinationCityId: string): RoutePerformanceMetrics[] {
  const allMetrics = analyzeRoutePerformance();
  return allMetrics
    .filter(metric => metric.destinationCityId === destinationCityId)
    .sort((a, b) => b.profitMargin - a.profitMargin)
    .slice(0, 5);
}

// Calculate market penetration for a city pair
export function calculateMarketPenetration(originCityId: string, destinationCityId: string): number {
  const gameState = getGameState();
  const completedRoutes = gameState.completedRoutes || [];
  
  const routesForPair = completedRoutes.filter(route => 
    route.originCityId === originCityId && route.destinationCityId === destinationCityId
  );
  
  if (routesForPair.length === 0) return 0;
  
  const totalPassengers = routesForPair.reduce((sum, route) => sum + route.passengers, 0);
  const totalCapacity = routesForPair.reduce((sum, route) => sum + route.maxPassengers, 0);
  
  return totalCapacity > 0 ? (totalPassengers / totalCapacity) * 100 : 0;
} 