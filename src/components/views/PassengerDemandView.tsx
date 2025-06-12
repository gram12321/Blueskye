import { useDisplayUpdate } from '../../lib/gamemechanics/displayManager';
import { getAllCities } from '../../lib/geography/cityData';
import { getAllAirports } from '../../lib/geography/airportData';
import { getPassengerStats } from '../../lib/geography/passengerDemandService';
import { ViewHeader } from '../ui/ViewHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/ShadCN/Card';
import { AirportCard } from '../ui/Cards/AirportCard';
import { formatNumber } from '../../lib/gamemechanics/utils';

export function PassengerDemandView() {
  useDisplayUpdate();
  
  const airports = getAllAirports();
  const cities = getAllCities();
  const passengerStats = getPassengerStats();
  
  // Group airports by city
  const airportsByCity = airports.reduce((acc, airport) => {
    if (!acc[airport.cityId]) {
      acc[airport.cityId] = [];
    }
    acc[airport.cityId].push(airport);
    return acc;
  }, {} as Record<string, typeof airports>);
  
  return (
    <div className="space-y-6">
      <ViewHeader 
        title="✈️ Passenger Demand & Airports" 
        description="Monitor passenger demand, airport utilization, and travel patterns"
      />
      
      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {formatNumber(passengerStats.totalWaiting)}
            </div>
            <div className="text-sm text-muted-foreground">Total Waiting Passengers</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {airports.length}
            </div>
            <div className="text-sm text-muted-foreground">Active Airports</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">
              {cities.length}
            </div>
            <div className="text-sm text-muted-foreground">Cities Served</div>
          </CardContent>
        </Card>
      </div>
      
      
      {/* Airport Utilization by City */}
      {cities.map(city => {
        const cityAirports = airportsByCity[city.id] || [];
        if (cityAirports.length === 0) return null;
        
        const cityWaitingPassengers = cityAirports.reduce((sum, airport) => {
          const airportStat = passengerStats.byAirport.find((a: any) => a.airportId === airport.id);
          return sum + (airportStat?.waitingCount || 0);
        }, 0);
        
        return (
          <Card key={city.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{city.name}, {city.country} Airports ({cityAirports.length})</span>
              </CardTitle>
              <CardDescription>
                {formatNumber(cityWaitingPassengers)} waiting passengers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {cityAirports.map(airport => (
                  <AirportCard key={airport.id} airport={airport} />
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
      
      {/* Market Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Market Insights & Opportunities</CardTitle>
          <CardDescription>Strategic analysis of passenger demand patterns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="font-medium text-blue-800">High Demand Airports</div>
                <div className="text-sm text-blue-700 mt-1">
                  Focus on airports with high utilization (60%+) for profitable routes
                </div>
              </div>
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="font-medium text-green-800">Hub Advantages</div>
                <div className="text-sm text-green-700 mt-1">
                  Hub airports generate more passengers due to connectivity bonuses
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="font-medium text-purple-800">Business vs Leisure</div>
                <div className="text-sm text-purple-700 mt-1">
                  High-priority passengers (70%+) pay premium prices but expect quality service
                </div>
              </div>
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="font-medium text-orange-800">Distance Effects</div>
                <div className="text-sm text-orange-700 mt-1">
                  Passengers prefer closer airports exponentially - distance matters!
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 