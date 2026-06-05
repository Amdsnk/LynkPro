import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon, LatLngBounds } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// Fix for default marker icon in Leaflet
try {
  // @ts-ignore
  delete Icon.Default.prototype._getIconUrl;
  Icon.Default.mergeOptions({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
} catch (error) {
  console.error('Error setting up Leaflet icons:', error);
}

export interface MapMarker {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  status?: string;
  clientName?: string;
  onClick?: () => void;
}

interface InteractiveMapProps {
  markers: MapMarker[];
  height?: string;
  defaultCenter?: [number, number];
  defaultZoom?: number;
  onMarkerClick?: (markerId: string) => void;
}

// Component to fit map bounds to markers
function FitBounds({ markers }: { markers: MapMarker[] }) {
  const map = useMap();

  useEffect(() => {
    if (markers.length === 0) return;

    const bounds = new LatLngBounds(
      markers.map((m) => [m.latitude, m.longitude])
    );

    // Fit bounds with padding
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [markers, map]);

  return null;
}

export function InteractiveMap({
  markers,
  height = '400px',
  defaultCenter = [39.8283, -98.5795], // Center of USA
  defaultZoom = 4,
  onMarkerClick,
}: InteractiveMapProps) {
  const [mapError, setMapError] = useState<string | null>(null);

  // Filter markers with valid coordinates
  const validMarkers = markers.filter(
    (m) => m.latitude != null && m.longitude != null && !isNaN(m.latitude) && !isNaN(m.longitude)
  );

  // Error boundary for map rendering
  if (mapError) {
    return (
      <div className="relative rounded-lg overflow-hidden border-2 border-border bg-muted/30" style={{ height }}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center space-y-2 p-4">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">
              Unable to load map
            </p>
            <p className="text-xs text-muted-foreground">
              {mapError}
            </p>
          </div>
        </div>
      </div>
    );
  }

  try {
    return (
      <div className="relative rounded-lg overflow-hidden border-2 border-border" style={{ height }}>
        <MapContainer
          center={defaultCenter}
          zoom={defaultZoom}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {validMarkers.map((marker) => (
            <Marker
              key={marker.id}
              position={[marker.latitude, marker.longitude]}
              eventHandlers={{
                click: () => {
                  if (marker.onClick) {
                    marker.onClick();
                  } else if (onMarkerClick) {
                    onMarkerClick(marker.id);
                  }
                },
              }}
            >
              <Popup>
                <div className="p-2 min-w-[200px]">
                  <div className="flex items-start gap-2 mb-2">
                    <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <h3 className="font-semibold text-sm">{marker.name}</h3>
                  </div>
                  {marker.clientName && (
                    <p className="text-xs text-muted-foreground mb-2">
                      {marker.clientName}
                    </p>
                  )}
                  {marker.status && (
                    <Badge variant="outline" className="text-xs mb-2">
                      {marker.status}
                    </Badge>
                  )}
                  {marker.onClick && (
                    <Button
                      size="sm"
                      variant="default"
                      className="w-full mt-2"
                      onClick={marker.onClick}
                    >
                      View Details
                    </Button>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}

          {validMarkers.length > 0 && <FitBounds markers={validMarkers} />}
        </MapContainer>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-card border border-border rounded-lg p-3 shadow-lg z-[1000]">
          <p className="text-xs font-semibold mb-2">Active Sites</p>
          <div className="flex items-center gap-2">
            <MapPin className="h-3 w-3 text-primary" />
            <span className="text-xs text-muted-foreground">
              {validMarkers.length} site{validMarkers.length !== 1 ? 's' : ''}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Click marker for details
          </p>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Map rendering error:', error);
    return (
      <div className="relative rounded-lg overflow-hidden border-2 border-border bg-muted/30" style={{ height }}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center space-y-2 p-4">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">
              Unable to load map
            </p>
            <p className="text-xs text-muted-foreground">
              Please refresh the page
            </p>
          </div>
        </div>
      </div>
    );
  }
}
