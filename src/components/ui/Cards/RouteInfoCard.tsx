import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ShadCN/Card';
import { Badge } from '../ShadCN/Badge';
import { formatNumber } from '../../../lib/gamemechanics/utils';

interface RouteInfo {
  distance: number;
  isDomestic: boolean;
  travelTimes: {
    aircraft: string;
    time: number;
    inRange: boolean;
  }[];
}

interface RouteInfoCardProps {
  routeInfo: RouteInfo;
}

export function RouteInfoCard({ routeInfo }: RouteInfoCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">Route Information</CardTitle>
            <CardDescription>Distance: {formatNumber(routeInfo.distance)} km</CardDescription>
          </div>
          <Badge variant={routeInfo.isDomestic ? "secondary" : "outline"}>
            {routeInfo.isDomestic ? 'Domestic' : 'International'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-medium mb-2">Aircraft Compatibility:</h4>
          <div className="space-y-2">
            {routeInfo.travelTimes.map((aircraft, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className={aircraft.inRange ? 'text-foreground' : 'text-muted-foreground line-through'}>
                  {aircraft.aircraft}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm">
                    {aircraft.time.toFixed(1)}h
                  </span>
                  <Badge 
                    variant={aircraft.inRange ? "default" : "destructive"}
                    className="text-xs"
                  >
                    {aircraft.inRange ? 'In Range' : 'Out of Range'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Route Type:</span>
            <div className="font-medium">
              {routeInfo.isDomestic ? 'Domestic Flight' : 'International Flight'}
            </div>
          </div>
          <div>
            <span className="text-muted-foreground">Compatible Aircraft:</span>
            <div className="font-medium">
              {routeInfo.travelTimes.filter(a => a.inRange).length} / {routeInfo.travelTimes.length}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 