import { City } from '../../../lib/geography/cityTypes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ShadCN/Card';
import { formatNumber } from '../../../lib/gamemechanics/utils';

interface CityCardProps {
  city: City;
}

export function CityCard({ city }: CityCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{city.name}</CardTitle>
            <CardDescription>{city.country}</CardDescription>
          </div>
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
      </CardContent>
    </Card>
  );
} 