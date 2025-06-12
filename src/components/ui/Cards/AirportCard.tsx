import { Airport } from '../../../lib/geography/cityTypes';
import { getCity, getAllCities, getCityColor } from '../../../lib/geography/cityData';
import { getWaitingPassengersAtAirport } from '../../../lib/geography/passengerDemandService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ShadCN/Card';
import { formatNumber } from '../../../lib/gamemechanics/utils';
import PieChart from '../charts/PieChart';
import { getGameState } from '../../../lib/gamemechanics/gameState';

interface AirportCardProps {
  airport: Airport;
}

export function AirportCard({ airport }: AirportCardProps) {
  const city = getCity(airport.cityId);
  const waitingPassengers = getWaitingPassengersAtAirport(airport.id);
  const allCities = getAllCities();
  
  // Aggregate waiting passengers by destination city
  const gameState = getGameState();
  const passengerMap = gameState.waitingPassengerMap || {};
  const destinationCounts: Record<string, number> = {};
  
  for (const pair in passengerMap) {
    if (pair.startsWith(`${airport.id}->`)) {
      const destCityId = pair.split('->')[1];
      destinationCounts[destCityId] = (destinationCounts[destCityId] || 0) + passengerMap[pair].count;
    }
  }
  
  // Create pie chart data with colors
  const pieData = Object.entries(destinationCounts).map(([cityId, value]) => {
    const city = allCities.find(c => c.id === cityId);
    return {
      label: city ? city.name : cityId,
      value,
      color: getCityColor(cityId)
    };
  }).filter(d => d.value > 0);
  
  // Sort destinations by passenger count for top 10 list
  const sortedDestinations = Object.entries(destinationCounts)
    .map(([cityId, count]) => {
      const city = allCities.find(c => c.id === cityId);
      return {
        cityId,
        cityName: city ? city.name : cityId,
        country: city ? city.country : 'Unknown',
        count,
        color: getCityColor(cityId)
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              {airport.name}
              <span className="text-sm font-mono text-muted-foreground">({airport.code})</span>
            </CardTitle>
            <CardDescription>{city?.name}, {city?.country}</CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-muted-foreground">Coordinates:</span>
            <div className="font-medium text-xs">
              {airport.coordinates.latitude.toFixed(2)}°, {airport.coordinates.longitude.toFixed(2)}°
            </div>
          </div>
          <div>
            <span className="text-muted-foreground">Waiting passengers:</span>
            <div className="font-medium">{formatNumber(waitingPassengers)}</div>
          </div>
        </div>
        
        {pieData.length > 0 && (
          <div className="pt-2">
            <PieChart data={pieData} size={90} />
            <div className="text-xs text-muted-foreground text-center mt-1">Destinations</div>
          </div>
        )}
        
        {sortedDestinations.length > 0 && (
          <div className="pt-2">
            <div className="text-xs font-medium text-muted-foreground mb-2">Top Destinations</div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {sortedDestinations.map((dest) => (
                <div key={dest.cityId} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div 
                      className="w-2 h-2 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: dest.color }}
                    />
                    <span className="truncate font-medium">{dest.cityName}</span>
                    <span className="text-muted-foreground text-xs">({dest.country})</span>
                  </div>
                  <span className="font-medium text-xs ml-2">{formatNumber(dest.count)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 