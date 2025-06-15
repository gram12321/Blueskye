// Gate information card component for displaying gate availability and details

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ShadCN/Card';
import { Badge } from '../ShadCN/Badge';
import { Button } from '../ShadCN/Button';
import { Clock, Plane, Euro, MapPin } from 'lucide-react';
import { Gate, GateType, SlotPolicyType } from '../../../lib/geography/gateTypes';
import { getAirport } from '../../../lib/geography/airportData';
import { getGateStats } from '../../../lib/geography/gateService';

interface GateInfoCardProps {
  airportId: string;
  gates: Gate[];
  onPurchaseGate?: () => void;
  showPurchaseButton?: boolean;
  className?: string;
}

const GateInfoCard: React.FC<GateInfoCardProps> = ({
  airportId,
  gates,
  onPurchaseGate,
  showPurchaseButton = true,
  className = ''
}) => {
  const airport = getAirport(airportId);
  const gateStats = getGateStats(airportId);

  if (!airport) {
    return null;
  }

  const getGateTypeColor = (gateType: GateType): string => {
    switch (gateType) {
      case 'exclusive':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'preferential':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'common':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPolicyColor = (policy: SlotPolicyType): string => {
    switch (policy) {
      case 'fixed-blocks':
        return 'bg-red-100 text-red-800';
      case 'mixed':
        return 'bg-yellow-100 text-yellow-800';
      case 'flexible':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatOperatingHours = () => {
    const { start, end } = airport.operatingHours;
    return `${start.hour.toString().padStart(2, '0')}:${start.minute.toString().padStart(2, '0')} - ${end.hour.toString().padStart(2, '0')}:${end.minute.toString().padStart(2, '0')}`;
  };

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            {airport.name} ({airport.code})
          </CardTitle>
          {showPurchaseButton && onPurchaseGate && (
            <Button
              onClick={onPurchaseGate}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              Purchase Gate
            </Button>
          )}
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {formatOperatingHours()}
          </div>
          <div className="flex items-center gap-1">
            <Plane className="h-4 w-4" />
            {gates.length} Gates
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Gate Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <div className="text-lg font-semibold text-gray-900">{gateStats.totalGates}</div>
            <div className="text-xs text-gray-600">Total Gates</div>
          </div>
          <div className="text-center p-2 bg-green-50 rounded-lg">
            <div className="text-lg font-semibold text-green-700">{gateStats.gatesByType.common + gateStats.gatesByType.preferential + gateStats.gatesByType.exclusive}</div>
            <div className="text-xs text-gray-600">Available Gates</div>
          </div>
          <div className="text-center p-2 bg-blue-50 rounded-lg">
            <div className="text-lg font-semibold text-blue-700">{gateStats.averagePricePerSlot}</div>
            <div className="text-xs text-gray-600">Avg. Price/Slot</div>
          </div>
          <div className="text-center p-2 bg-purple-50 rounded-lg">
            <div className="text-lg font-semibold text-purple-700">
              {gateStats.utilizationRate.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-600">Utilization</div>
          </div>
        </div>

        {/* Gate List */}
        {gates.length > 0 ? (
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900">Your Gates</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {gates.map((gate) => (
                <div
                  key={gate.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <div className="font-medium text-gray-900">
                      {gate.gateNumber}
                    </div>
                    <Badge className={getGateTypeColor(gate.gateType)}>
                      {gate.gateType}
                    </Badge>
                    <Badge className={getPolicyColor(gate.slotPolicy)}>
                      {gate.slotPolicy}
                    </Badge>
                    <div className="text-sm text-gray-600">
                      Max: {gate.maxAircraftSize}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Euro className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">
                      €{gate.basePrice.toLocaleString()}
                    </span>
                    <span className="text-gray-500">/ slot</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500">
            <Plane className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No gates owned at this airport</p>
            <p className="text-xs text-gray-400 mt-1">
              Purchase gates to enable advanced route management
            </p>
          </div>
        )}

        {/* Revenue Information */}
        {gateStats.totalDailyRevenue > 0 && (
          <div className="pt-3 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Daily Gate Revenue:</span>
              <span className="font-medium text-green-600">
                €{gateStats.totalDailyRevenue.toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GateInfoCard; 