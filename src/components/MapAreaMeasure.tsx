import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet-draw";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Map, Trash2, Navigation, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface MapAreaMeasureProps {
  latitude: number;
  longitude: number;
  onAreaChange: (area: number) => void;
  onLocationChange: (lat: number, lng: number) => void;
}

const MapAreaMeasure = ({ latitude, longitude, onAreaChange, onLocationChange }: MapAreaMeasureProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const drawnItemsRef = useRef<L.FeatureGroup | null>(null);
  const [currentArea, setCurrentArea] = useState<number>(0);
  const initialCoordsRef = useRef({ lat: latitude, lng: longitude });

  useEffect(() => {
    if (!mapRef.current) {
      // Initialize map
      const map = L.map("map").setView([latitude, longitude], 13);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      // Initialize feature group for drawn items
      const drawnItems = new L.FeatureGroup();
      map.addLayer(drawnItems);
      drawnItemsRef.current = drawnItems;

      // Initialize draw control
      const drawControl = new L.Control.Draw({
        edit: {
          featureGroup: drawnItems,
        },
        draw: {
          polygon: {
            allowIntersection: false,
            showArea: true,
            metric: true,
          },
          rectangle: {
            showArea: true,
            metric: true,
          },
          polyline: false,
          circle: false,
          marker: false,
          circlemarker: false,
        },
      });
      map.addControl(drawControl);

      // Calculate geographic area in square meters
      const calculateArea = (latlngs: L.LatLng[]) => {
        let area = 0;
        if (latlngs.length > 2) {
          for (let i = 0; i < latlngs.length; i++) {
            const j = (i + 1) % latlngs.length;
            const xi = latlngs[i].lng * Math.PI / 180;
            const yi = latlngs[i].lat * Math.PI / 180;
            const xj = latlngs[j].lng * Math.PI / 180;
            const yj = latlngs[j].lat * Math.PI / 180;
            area += (xj - xi) * (2 + Math.sin(yi) + Math.sin(yj));
          }
          area = Math.abs(area * 6378137 * 6378137 / 2.0);
        }
        return area;
      };

      // Estimate solar potential based on area
      const estimateSolarPotential = (area: number) => {
        if (area < 200) return { color: "#ef4444", label: "No potential" };
        if (area < 800) return { color: "#eab308", label: "Medium potential" };
        return { color: "#22c55e", label: "High potential" };
      };

      // Handle polygon creation
      map.on(L.Draw.Event.CREATED, (event: any) => {
        const layer = event.layer;
        drawnItems.clearLayers();
        drawnItems.addLayer(layer);

        // Calculate area in square meters
        const latlngs = layer.getLatLngs()[0];
        const area = calculateArea(latlngs);
        const roundedArea = Math.round(area);
        setCurrentArea(roundedArea);
        onAreaChange(roundedArea);

        // Apply color based on solar potential
        const potential = estimateSolarPotential(roundedArea);
        layer.setStyle({ 
          color: potential.color, 
          fillColor: potential.color,
          fillOpacity: 0.3,
          weight: 3
        });
        
        // Add popup with potential information
        layer.bindPopup(`
          <div class="text-center">
            <p class="font-semibold text-lg">${potential.label}</p>
            <p class="text-sm text-gray-600">Area: ${roundedArea.toLocaleString()} m²</p>
          </div>
        `).openPopup();

        // Update location to center of drawn polygon
        const center = layer.getBounds().getCenter();
        onLocationChange(center.lat, center.lng);
      });

      // Handle polygon edit
      map.on(L.Draw.Event.EDITED, (event: any) => {
        const layers = event.layers;
        layers.eachLayer((layer: any) => {
          const latlngs = layer.getLatLngs()[0];
          const area = calculateArea(latlngs);
          const roundedArea = Math.round(area);
          setCurrentArea(roundedArea);
          onAreaChange(roundedArea);

          // Update color based on new solar potential
          const potential = estimateSolarPotential(roundedArea);
          layer.setStyle({ 
            color: potential.color, 
            fillColor: potential.color,
            fillOpacity: 0.3,
            weight: 3
          });
          
          // Update popup
          layer.setPopupContent(`
            <div class="text-center">
              <p class="font-semibold text-lg">${potential.label}</p>
              <p class="text-sm text-gray-600">Area: ${roundedArea.toLocaleString()} m²</p>
            </div>
          `);

          const center = layer.getBounds().getCenter();
          onLocationChange(center.lat, center.lng);
        });
      });

      // Handle polygon deletion
      map.on(L.Draw.Event.DELETED, () => {
        setCurrentArea(0);
        onAreaChange(0);
      });

      mapRef.current = map;
    }

    // Update map view when coordinates change
    if (mapRef.current) {
      mapRef.current.setView([latitude, longitude], mapRef.current.getZoom());
    }
  }, [latitude, longitude, onAreaChange, onLocationChange]);

  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  const handleClearDrawing = () => {
    if (drawnItemsRef.current) {
      drawnItemsRef.current.clearLayers();
      setCurrentArea(0);
      onAreaChange(0);
    }
  };

  const handleRecenter = () => {
    if (mapRef.current) {
      mapRef.current.setView([initialCoordsRef.current.lat, initialCoordsRef.current.lng], 13);
    }
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Map className="w-5 h-5 text-primary" />
          Area Measurement Tool
        </CardTitle>
        <CardDescription>
          Use the drawing tools on the map to measure your installation area
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Click the <strong>polygon</strong> (⬠) or <strong>rectangle</strong> (▭) icon on the map to start drawing. Areas will be colored: 🟢 Green (high potential ≥800m²), 🟡 Yellow (medium 200-800m²), 🔴 Red (no potential &lt;200m²).
          </AlertDescription>
        </Alert>

        {currentArea > 0 && (
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Measured Area</p>
                <p className="text-2xl font-bold text-primary">{currentArea.toLocaleString()} m²</p>
              </div>
            </div>
          </div>
        )}

        <div id="map" className="w-full h-[450px] rounded-lg border border-border z-0" />
        
        <div className="flex gap-2">
          <Button
            onClick={handleClearDrawing}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Clear Drawing
          </Button>
          <Button
            onClick={handleRecenter}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Navigation className="w-4 h-4" />
            Recenter Map
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default MapAreaMeasure;
