// Gate booking panel component for managing gate reservations

import React, { useState } from 'react';
import { 
  Card, CardContent, CardHeader, CardTitle,
  Button,
  Badge,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger
} from './ShadCN';
import { Plane, Euro, AlertCircle, CheckCircle } from 'lucide-react';
import { GateType, SlotPolicyType } from '../../lib/geography/gateTypes';
import { getGatePricingPreview } from '../../lib/geography/gatePricingService';
import { purchaseGate } from '../../lib/geography/gateService';
import { getAirport, getAllAirports } from '../../lib/geography/airportData';
import { getGatePurchaseCost } from '../../lib/geography/gateData';
import { useDisplayUpdate } from '../../lib/gamemechanics/displayManager';

interface GateBookingPanelProps {
  onClose?: () => void;
  className?: string;
}

const GateBookingPanel: React.FC<GateBookingPanelProps> = ({
  onClose,
  className = ''
}) => {
  useDisplayUpdate();
  
  const [selectedAirportId, setSelectedAirportId] = useState<string>('');
  const [selectedGateType, setSelectedGateType] = useState<GateType>('common');
  const [selectedSlotPolicy, setSelectedSlotPolicy] = useState<SlotPolicyType>('flexible');
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);

  const airports = getAllAirports();
  const selectedAirport = selectedAirportId ? getAirport(selectedAirportId) : null;

  const handlePurchaseGate = () => {
    if (!selectedAirportId) return;
    
    const success = purchaseGate(selectedAirportId, selectedGateType, selectedSlotPolicy, 'medium');
    if (success) {
      setShowPurchaseDialog(false);
      if (onClose) onClose();
    }
  };

  // Get pricing preview for different gate types (only if airport is selected)
  const pricingPreview = selectedAirportId ? getGatePricingPreview(
    selectedAirportId, 
    { hour: 12, minute: 0 }, // Default to noon for pricing preview
    false // Assuming domestic for preview
  ) : null;

  // Get purchase cost for the selected configuration
  const purchaseCost = selectedAirportId ? getGatePurchaseCost(selectedGateType, 0) : 0;

  const getGateTypeDescription = (gateType: GateType): string => {
    switch (gateType) {
      case 'exclusive':
        return 'Full control, long-term lease, highest cost but guaranteed availability';
      case 'common':
        return 'Shared access, per-use rental, lowest cost but limited availability';
      default:
        return '';
    }
  };

  const getPolicyDescription = (policy: SlotPolicyType): string => {
    switch (policy) {
      case 'fixed-blocks':
        return '2-hour fixed blocks - Best for consistent scheduling, higher utilization';
      case 'flexible':
        return '1-hour flexible slots - Maximum flexibility, pay for actual usage';
      default:
        return '';
    }
  };

  return (
    <Card className={`w-full max-w-4xl ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plane className="h-5 w-5 text-blue-600" />
          Purchase New Gate
        </CardTitle>
        <p className="text-sm text-gray-600">
          Purchase and manage gates to enable advanced route operations
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Airport Selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-700">Select Airport</label>
          <Select value={selectedAirportId} onValueChange={setSelectedAirportId}>
            <SelectTrigger>
              <SelectValue placeholder="Choose an airport..." />
            </SelectTrigger>
            <SelectContent>
              {airports.map((airport) => (
                <SelectItem key={airport.id} value={airport.id}>
                  {airport.name} ({airport.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedAirportId && pricingPreview && (
          <>
            {/* Pricing Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-green-100 text-green-800">Common</Badge>
                  <span className="text-sm text-green-700">1.0x multiplier</span>
                </div>
                <div className="text-lg font-semibold text-green-800">
                  €{pricingPreview.common.toLocaleString()}
                </div>
                <p className="text-xs text-green-600 mt-1">Price per slot</p>
              </div>

              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-purple-100 text-purple-800">Exclusive</Badge>
                  <span className="text-sm text-purple-700">1.5x multiplier</span>
                </div>
                <div className="text-lg font-semibold text-purple-800">
                  €{pricingPreview.exclusive.toLocaleString()}
                </div>
                <p className="text-xs text-purple-600 mt-1">Price per slot</p>
              </div>
            </div>

            {/* Purchase Gate Section */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Gate Configuration</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Gate Type Selection */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700">Gate Type</label>
                  <Select value={selectedGateType} onValueChange={(value: GateType) => setSelectedGateType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="common">Common</SelectItem>
                      <SelectItem value="exclusive">Exclusive</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-600">
                    {getGateTypeDescription(selectedGateType)}
                  </p>
                </div>

                {/* Slot Policy Selection */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700">Slot Policy</label>
                  <Select value={selectedSlotPolicy} onValueChange={(value: SlotPolicyType) => setSelectedSlotPolicy(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="flexible">Flexible (1h)</SelectItem>
                      <SelectItem value="fixed-blocks">Fixed Blocks (2h)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-600">
                    {getPolicyDescription(selectedSlotPolicy)}
                  </p>
                </div>
              </div>

              {/* Cost Summary */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-blue-900">Gate Purchase Cost:</span>
                  <span className="text-xl font-bold text-blue-900">
                    €{purchaseCost.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm text-blue-700">
                  <span>Price per slot:</span>
                  <span className="font-medium">
                    €{(selectedGateType === 'exclusive' ? pricingPreview.exclusive : pricingPreview.common).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Purchase Button */}
              <div className="mt-6 flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                    <span>Gate purchase is permanent and cannot be undone</span>
                  </div>
                </div>
                
                <Dialog open={showPurchaseDialog} onOpenChange={setShowPurchaseDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <Euro className="h-4 w-4 mr-2" />
                      Purchase Gate
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Confirm Gate Purchase</DialogTitle>
                      <DialogDescription>
                        Review your gate configuration before confirming the purchase.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium mb-2">Gate Configuration</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Airport:</span>
                            <span className="font-medium">{selectedAirport?.name} ({selectedAirport?.code})</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Gate Type:</span>
                            <Badge className={selectedGateType === 'exclusive' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}>
                              {selectedGateType}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>Slot Policy:</span>
                            <span className="font-medium">{selectedSlotPolicy}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Purchase Cost:</span>
                            <span className="font-medium text-blue-600">€{purchaseCost.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          onClick={() => setShowPurchaseDialog(false)}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handlePurchaseGate}
                          className="flex-1 bg-blue-600 hover:bg-blue-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Confirm Purchase
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </>
        )}

        {/* Information Section */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <h4 className="font-medium mb-1">Gate Management Benefits</h4>
              <ul className="space-y-1 text-xs">
                <li>• Control over flight scheduling and slot availability</li>
                <li>• Generate revenue from other airlines using your gates</li>
                <li>• Ensure guaranteed access for your routes</li>
                <li>• Strategic advantage at high-demand airports</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GateBookingPanel; 