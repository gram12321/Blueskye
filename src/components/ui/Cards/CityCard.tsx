import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ShadCN/Card';
import { Badge } from '../ShadCN/Badge';
import { City } from '../../../lib/geography/cityTypes';
import { formatNumber } from '../../../lib/gamemechanics/utils';

interface CityCardProps {
  city: City;
}

export function CityCard({ city }: CityCardProps) {
  const getDemandColor = (factor: number) => {
    if (factor >= 1.3) return 'bg-green-100 text-green-800 border-green-200';
    if (factor >= 1.1) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (factor >= 0.9) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const getPreferenceColor = (preference: number) => {
    if (preference >= 80) return 'bg-green-500';
    if (preference >= 60) return 'bg-blue-500';
    if (preference >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{city.name}</CardTitle>
            <CardDescription>{city.country}</CardDescription>
          </div>
          <Badge className={getDemandColor(city.passengerDemandMultiplier)}>
            {city.passengerDemandMultiplier.toFixed(1)}x
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-muted-foreground">Population:</span>
            <div className="font-medium">{formatNumber(city.population)}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Coordinates:</span>
            <div className="font-medium text-xs">
              {city.coordinates.latitude.toFixed(2)}°, {city.coordinates.longitude.toFixed(2)}°
            </div>
          </div>
        </div>
        
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-muted-foreground">Domestic Preference:</span>
            <span className="text-sm font-medium">{city.domesticPreference}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all ${getPreferenceColor(city.domesticPreference)}`}
              style={{ width: `${city.domesticPreference}%` }}
            />
          </div>
        </div>
        
        <div className="text-xs text-muted-foreground">
          Est. demand: {formatNumber(Math.round(city.population * city.passengerDemandMultiplier / 1000))}K passengers
        </div>
      </CardContent>
    </Card>
  );
} 