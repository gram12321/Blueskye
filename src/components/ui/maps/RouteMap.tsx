interface Airport {
  id: string;
  name: string;
  code: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

interface City {
  id: string;
  name: string;
  country: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

interface RouteMapProps {
  originAirport: Airport;
  destinationCity: City;
  distance: number;
  className?: string;
}

export function RouteMap({ originAirport, destinationCity, distance, className = '' }: RouteMapProps) {
  // Calculate bounding box to include both points with more generous padding for better overview
  const padding = 2.0; // Increased padding for wider view
  const minLat = Math.min(originAirport.coordinates.latitude, destinationCity.coordinates.latitude) - padding;
  const maxLat = Math.max(originAirport.coordinates.latitude, destinationCity.coordinates.latitude) + padding;
  const minLng = Math.min(originAirport.coordinates.longitude, destinationCity.coordinates.longitude) - padding;
  const maxLng = Math.max(originAirport.coordinates.longitude, destinationCity.coordinates.longitude) + padding;
  
  // Calculate center for the background map
  const centerLat = (minLat + maxLat) / 2;
  const centerLng = (minLng + maxLng) / 2;
  
  // Improved zoom level calculation for better default view
  const getZoom = () => {
    const latDiff = maxLat - minLat;
    const lngDiff = maxLng - minLng;
    const maxDiff = Math.max(latDiff, lngDiff);
    
    // More conservative zoom levels for wider view
    if (maxDiff > 20) return 3;
    if (maxDiff > 15) return 4;
    if (maxDiff > 10) return 5;
    if (maxDiff > 8) return 6;
    if (maxDiff > 5) return 7;
    return 8; // Maximum zoom for very close locations
  };
  
  const zoom = getZoom();
  
  // Calculate coordinate ranges for positioning
  const latRange = maxLat - minLat;
  const lngRange = maxLng - minLng;

  return (
    <div className={`relative bg-gray-100 rounded-lg border overflow-hidden ${className}`}>
      {/* Map container with overlay */}
      <div className="relative" style={{ height: '300px', width: '100%' }}>
        {/* Background map using OSM tiles */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(https://a.tile.openstreetmap.org/${zoom}/${Math.floor((centerLng + 180) / 360 * Math.pow(2, zoom))}/${Math.floor((1 - Math.log(Math.tan(centerLat * Math.PI / 180) + 1 / Math.cos(centerLat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom))}.png), url(https://b.tile.openstreetmap.org/${zoom}/${Math.floor((centerLng + 180) / 360 * Math.pow(2, zoom))}/${Math.floor((1 - Math.log(Math.tan(centerLat * Math.PI / 180) + 1 / Math.cos(centerLat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom))}.png)`
          }}
        />
        
        {/* SVG overlay for markers and line */}
        <svg 
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {/* Flight route line - much more visible */}
          <line 
            x1={`${((originAirport.coordinates.longitude - minLng) / lngRange) * 100}%`}
            y1={`${((maxLat - originAirport.coordinates.latitude) / latRange) * 100}%`}
            x2={`${((destinationCity.coordinates.longitude - minLng) / lngRange) * 100}%`}
            y2={`${((maxLat - destinationCity.coordinates.latitude) / latRange) * 100}%`}
            stroke="#ff6b35" 
            strokeWidth="1.5"
            strokeDasharray="4,2"
            vectorEffect="non-scaling-stroke"
            opacity="0.9"
          />
          {/* Shadow line for better visibility */}
          <line 
            x1={`${((originAirport.coordinates.longitude - minLng) / lngRange) * 100}%`}
            y1={`${((maxLat - originAirport.coordinates.latitude) / latRange) * 100}%`}
            x2={`${((destinationCity.coordinates.longitude - minLng) / lngRange) * 100}%`}
            y2={`${((maxLat - destinationCity.coordinates.latitude) / latRange) * 100}%`}
            stroke="#000000" 
            strokeWidth="2.5"
            strokeDasharray="4,2"
            vectorEffect="non-scaling-stroke"
            opacity="0.3"
          />
        </svg>
        
        {/* Origin marker */}
        <div 
          className="absolute w-8 h-8 bg-green-500 rounded-full border-3 border-white shadow-lg flex items-center justify-center text-white font-bold text-sm transform -translate-x-1/2 -translate-y-1/2 z-10"
          style={{
            left: `${((originAirport.coordinates.longitude - minLng) / lngRange) * 100}%`,
            top: `${((maxLat - originAirport.coordinates.latitude) / latRange) * 100}%`
          }}
        >
          ✈
        </div>
        
        {/* Destination marker */}
        <div 
          className="absolute w-8 h-8 bg-red-500 rounded-full border-3 border-white shadow-lg flex items-center justify-center text-white font-bold text-sm transform -translate-x-1/2 -translate-y-1/2 z-10"
          style={{
            left: `${((destinationCity.coordinates.longitude - minLng) / lngRange) * 100}%`,
            top: `${((maxLat - destinationCity.coordinates.latitude) / latRange) * 100}%`
          }}
        >
          🏙
        </div>
        
        {/* Distance Info */}
        <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-md p-2 text-xs shadow-md z-20">
          <div className="font-bold">{distance.toLocaleString()} km</div>
        </div>
        
        {/* Route Info */}
        <div className="absolute bottom-2 left-2 bg-white bg-opacity-95 rounded-md p-2 text-xs shadow-md z-20">
          <div className="flex items-center gap-1 mb-1">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="font-medium">{originAirport.code}</span>
            <span className="text-gray-600">({originAirport.name})</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="font-medium">{destinationCity.name}</span>
            <span className="text-gray-600">({destinationCity.country})</span>
          </div>
        </div>
        
        {/* OpenStreetMap attribution */}
        <div className="absolute bottom-0 right-0 bg-white bg-opacity-75 text-xs p-1 z-20">
          © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>
        </div>
      </div>
    </div>
  );
}

export default RouteMap; 