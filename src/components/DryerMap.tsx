'use client'

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Dryer {
  id: string;
  dryer_id: string;
  status: string;
  location_latitude: number;
  location_longitude: number;
  location_address: string;
  battery_level: number;
  active_alerts_count: number;
  owner_name?: string;
}

// Custom marker icons based on status
const getMarkerIcon = (status: string) => {
  const colors = {
    active: '#22c55e',      // Green
    idle: '#eab308',        // Yellow
    offline: '#ef4444',     // Red
    maintenance: '#9ca3af', // Grey
    decommissioned: '#6b7280' // Dark grey
  };

  const color = colors[status as keyof typeof colors] || '#3b82f6';

  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 30px;
        height: 30px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        color: white;
        font-size: 12px;
      ">
        ${status === 'active' ? '●' : status === 'offline' ? '✕' : '○'}
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15]
  });
};

// Component to fit map bounds to markers
function FitBounds({ dryers }: { dryers: Dryer[] }) {
  const map = useMap();

  useEffect(() => {
    if (dryers.length > 0) {
      const bounds = L.latLngBounds(
        dryers.map(d => [d.location_latitude, d.location_longitude])
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [dryers, map]);

  return null;
}

export function DryerMap() {
  const [dryers, setDryers] = useState<Dryer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  useEffect(() => {
    fetchDryers();
    
    // Auto-refresh every 2 minutes
    const interval = setInterval(fetchDryers, 120000);
    return () => clearInterval(interval);
  }, []);

  const fetchDryers = async () => {
    try {
      const { data, error } = await supabase
        .from('dryers')
        .select(`
          id,
          dryer_id,
          status,
          location_latitude,
          location_longitude,
          location_address,
          battery_level,
          active_alerts_count,
          owners (
            name
          )
        `)
        .not('location_latitude', 'is', null)
        .not('location_longitude', 'is', null);

      if (error) throw error;

      const formattedDryers = data.map(d => {
        const owner = Array.isArray(d.owners) ? d.owners[0] : d.owners;
        return {
          ...d,
          owner_name: owner?.name
        };
      });

      setDryers(formattedDryers);
    } catch (error) {
      console.error('Error fetching dryers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDryers = selectedStatus
    ? dryers.filter(d => d.status === selectedStatus)
    : dryers;

  const statusCounts = {
    active: dryers.filter(d => d.status === 'active').length,
    idle: dryers.filter(d => d.status === 'idle').length,
    offline: dryers.filter(d => d.status === 'offline').length,
    maintenance: dryers.filter(d => d.status === 'maintenance').length,
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  // Default center (Kenya)
  const defaultCenter: [number, number] = [-1.286389, 36.817223];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dryer Locations Map</CardTitle>
        <div className="flex gap-2 mt-4 flex-wrap">
          <Badge
            variant={selectedStatus === null ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setSelectedStatus(null)}
          >
            All ({dryers.length})
          </Badge>
          <Badge
            variant={selectedStatus === 'active' ? "default" : "outline"}
            className="cursor-pointer bg-green-500 hover:bg-green-600"
            onClick={() => setSelectedStatus('active')}
          >
            Active ({statusCounts.active})
          </Badge>
          <Badge
            variant={selectedStatus === 'idle' ? "default" : "outline"}
            className="cursor-pointer bg-yellow-500 hover:bg-yellow-600"
            onClick={() => setSelectedStatus('idle')}
          >
            Idle ({statusCounts.idle})
          </Badge>
          <Badge
            variant={selectedStatus === 'offline' ? "default" : "outline"}
            className="cursor-pointer bg-red-500 hover:bg-red-600"
            onClick={() => setSelectedStatus('offline')}
          >
            Offline ({statusCounts.offline})
          </Badge>
          <Badge
            variant={selectedStatus === 'maintenance' ? "default" : "outline"}
            className="cursor-pointer bg-gray-500 hover:bg-gray-600"
            onClick={() => setSelectedStatus('maintenance')}
          >
            Maintenance ({statusCounts.maintenance})
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-96 rounded-lg overflow-hidden border">
          <MapContainer
            center={defaultCenter}
            zoom={7}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {filteredDryers.map((dryer) => (
              <Marker
                key={dryer.id}
                position={[dryer.location_latitude, dryer.location_longitude]}
                icon={getMarkerIcon(dryer.status)}
              >
                <Popup>
                  <div className="p-2 min-w-[200px]">
                    <h3 className="font-bold text-lg mb-2">{dryer.dryer_id}</h3>
                    
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <Badge variant={
                          dryer.status === 'active' ? 'default' :
                          dryer.status === 'offline' ? 'destructive' :
                          'secondary'
                        }>
                          {dryer.status}
                        </Badge>
                      </div>
                      
                      {dryer.owner_name && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Owner:</span>
                          <span className="font-medium">{dryer.owner_name}</span>
                        </div>
                      )}
                      
                      <div className="flex justify-between">
                        <span className="text-gray-600">Battery:</span>
                        <span className="font-medium">{dryer.battery_level || 'N/A'}%</span>
                      </div>
                      
                      {dryer.active_alerts_count > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Alerts:</span>
                          <Badge variant="destructive">{dryer.active_alerts_count}</Badge>
                        </div>
                      )}
                      
                      {dryer.location_address && (
                        <div className="mt-2 pt-2 border-t">
                          <p className="text-xs text-gray-500">{dryer.location_address}</p>
                        </div>
                      )}
                    </div>
                    
                    <a
                      href={`/dashboard/dryers/${dryer.id}`}
                      className="mt-3 block w-full text-center bg-primary text-white py-1 px-3 rounded text-sm hover:bg-primary/90"
                    >
                      View Details
                    </a>
                  </div>
                </Popup>
              </Marker>
            ))}
            
            {filteredDryers.length > 0 && <FitBounds dryers={filteredDryers} />}
          </MapContainer>
        </div>
        
        <div className="mt-4 text-sm text-gray-500 text-center">
          Showing {filteredDryers.length} of {dryers.length} dryers
        </div>
      </CardContent>
    </Card>
  );
}
