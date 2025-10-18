import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet-draw";
import * as turf from "@turf/turf";
import SunCalc from "suncalc";
import RBush from "rbush";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Map, Trash2, Navigation, Info, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface MapAreaMeasureProps {
  latitude: number;
  longitude: number;
  onAreaChange: (area: number) => void;
  onLocationChange: (lat: number, lng: number) => void;
}

interface RTreeItem {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  feature: any;
}

const MapAreaMeasure = ({ latitude, longitude, onAreaChange, onLocationChange }: MapAreaMeasureProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const drawnItemsRef = useRef<L.FeatureGroup | null>(null);
  const analysisLayerRef = useRef<L.GeoJSON | null>(null);
  const [currentArea, setCurrentArea] = useState<number>(0);
  const [cellSize, setCellSize] = useState<number>(10);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisComplete, setAnalysisComplete] = useState<boolean>(false);
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

      // Handle polygon creation
      map.on(L.Draw.Event.CREATED, async (event: any) => {
        const layer = event.layer;
        drawnItems.clearLayers();
        drawnItems.addLayer(layer);

        // Calculate area in square meters
        const latlngs = layer.getLatLngs()[0];
        const area = calculateArea(latlngs);
        const roundedArea = Math.round(area);
        setCurrentArea(roundedArea);
        onAreaChange(roundedArea);

        // Update location to center of drawn polygon
        const center = layer.getBounds().getCenter();
        onLocationChange(center.lat, center.lng);

        // Run solar potential analysis
        const geojson = layer.toGeoJSON();
        await subdivideAndAnalyze(geojson, map);
      });

      // Handle polygon edit
      map.on(L.Draw.Event.EDITED, async (event: any) => {
        const layers = event.layers;
        layers.eachLayer(async (layer: any) => {
          const latlngs = layer.getLatLngs()[0];
          const area = calculateArea(latlngs);
          const roundedArea = Math.round(area);
          setCurrentArea(roundedArea);
          onAreaChange(roundedArea);

          const center = layer.getBounds().getCenter();
          onLocationChange(center.lat, center.lng);

          // Re-run solar potential analysis
          const geojson = layer.toGeoJSON();
          await subdivideAndAnalyze(geojson, map);
        });
      });

      // Handle polygon deletion
      map.on(L.Draw.Event.DELETED, () => {
        setCurrentArea(0);
        onAreaChange(0);
        setAnalysisComplete(false);
        if (analysisLayerRef.current && mapRef.current) {
          mapRef.current.removeLayer(analysisLayerRef.current);
          analysisLayerRef.current = null;
        }
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

  // Helper function to fetch OSM buildings
  const fetchOSMBuildings = async (bboxStr: string): Promise<any> => {
    const query = `
      [out:json][timeout:25];
      (
        way["building"](${bboxStr});
        relation["building"](${bboxStr});
      );
      out body;
      >;
      out skel qt;
    `;
    const url = "https://overpass-api.de/api/interpreter";
    try {
      const resp = await fetch(url, { method: "POST", body: query });
      const data = await resp.json();
      // For prototype, return empty FeatureCollection
      // In production, convert Overpass JSON to GeoJSON
      return { type: "FeatureCollection", features: [] };
    } catch (err) {
      console.warn("OSM fetch failed", err);
      return { type: "FeatureCollection", features: [] };
    }
  };

  // Helper function to check if sun is blocked by buildings
  const isSunBlocked = (
    centroid: [number, number],
    sun: { alt: number; az: number },
    rtree: RBush<RTreeItem>
  ): boolean => {
    if (sun.alt <= 0) return true;
    const maxDist = 200;
    const lon = centroid[0], lat = centroid[1];
    const degPerM = 1 / 111320;
    const dx = maxDist * degPerM;
    const query = rtree.search({ 
      minX: lon - dx, 
      minY: lat - dx, 
      maxX: lon + dx, 
      maxY: lat + dx 
    });
    
    for (const item of query) {
      const b = item.feature;
      let height = 6;
      if (b.properties?.height) {
        height = parseFloat(String(b.properties.height).replace("m", ""));
      } else if (b.properties?.["building:levels"]) {
        height = parseFloat(b.properties["building:levels"]) * 3;
      }

      const buildingCentroid = turf.centroid(b).geometry.coordinates;
      const dist = turf.distance(
        turf.point(centroid), 
        turf.point(buildingCentroid), 
        { units: "meters" }
      );

      if (dist < maxDist) {
        const blockingHeightNeeded = Math.tan(sun.alt) * dist;
        if (height > blockingHeightNeeded) {
          return true;
        }
      }
    }
    return false;
  };

  // Main subdivision and analysis function
  const subdivideAndAnalyze = async (polygonGeoJSON: any, map: L.Map) => {
    setIsAnalyzing(true);
    setAnalysisComplete(false);

    try {
      // Remove previous analysis layer
      if (analysisLayerRef.current) {
        map.removeLayer(analysisLayerRef.current);
        analysisLayerRef.current = null;
      }

      const bbox = turf.bbox(polygonGeoJSON);
      const centroid = turf.centroid(polygonGeoJSON).geometry.coordinates;
      const cellSizeKm = cellSize / 1000;

      // Build grid and clip to polygon
      const squareGrid = turf.squareGrid(bbox, cellSizeKm, { units: "kilometers" });
      const cellsInside: any = { type: "FeatureCollection", features: [] };
      
      for (const cell of squareGrid.features) {
        try {
          if (turf.booleanIntersects(cell, polygonGeoJSON)) {
            const clipped = turf.intersect(turf.featureCollection([cell, polygonGeoJSON]));
            if (clipped) cellsInside.features.push(clipped);
          }
        } catch (e) {
          // Skip cells that cause intersection errors
          continue;
        }
      }

      // Fetch nearby buildings from OSM
      const bboxStr = bbox.join(",");
      const buildings = await fetchOSMBuildings(bboxStr);

      // Create spatial index for buildings
      const rtree = new RBush<RTreeItem>();
      const indexed = buildings.features.map((b: any) => {
        const bBox = turf.bbox(b);
        return { 
          minX: bBox[0], 
          minY: bBox[1], 
          maxX: bBox[2], 
          maxY: bBox[3], 
          feature: b 
        };
      });
      rtree.load(indexed);

      // Sample sun positions
      const lat = centroid[1], lon = centroid[0];
      const dates = [
        new Date(new Date().getFullYear(), 5, 21),
        new Date(new Date().getFullYear(), 11, 21),
      ];
      const times = [9, 12, 15];
      const sunPositions: Array<{ alt: number; az: number; date: Date }> = [];
      
      for (const d of dates) {
        for (const h of times) {
          const dt = new Date(d);
          dt.setHours(h, 0, 0, 0);
          const pos = SunCalc.getPosition(dt, lat, lon);
          sunPositions.push({ alt: pos.altitude, az: pos.azimuth, date: dt });
        }
      }

      // Analyze each cell
      const analyzedFeatures = [];
      for (const cell of cellsInside.features) {
        const centroidPoint = turf.centroid(cell).geometry.coordinates;
        const shadingScores = [];
        
        for (const s of sunPositions) {
          const blocked = isSunBlocked([centroidPoint[0], centroidPoint[1]], s, rtree);
          shadingScores.push(blocked ? 1 : 0);
        }
        
        const shadingFraction = shadingScores.reduce((a, b) => a + b, 0) / shadingScores.length;
        const usableFrac = 1.0;
        const irradianceFactor = 1.0;
        const score = usableFrac * (1 - shadingFraction) * irradianceFactor;

        const color = score < 0.25 ? "#e63946" : (score < 0.60 ? "#f4d35e" : "#2a9d8f");
        const feature = {
          type: "Feature",
          geometry: cell.geometry,
          properties: {
            score: Number(score.toFixed(3)),
            shading_fraction: Number(shadingFraction.toFixed(3)),
            color,
            label: score < 0.25 ? "No potential" : (score < 0.60 ? "Medium potential" : "High potential")
          },
        };
        analyzedFeatures.push(feature);
      }

      const fc: any = { type: "FeatureCollection", features: analyzedFeatures };

      // Create Leaflet layer
      const layer = L.geoJSON(fc, {
        style: (f: any) => ({ 
          color: f.properties.color, 
          fillColor: f.properties.color, 
          weight: 0.5, 
          fillOpacity: 0.6 
        }),
        onEachFeature: (feature: any, layer: any) => {
          const p = feature.properties;
          layer.bindPopup(
            `<strong>${p.label}</strong><br/>Score: ${p.score}<br/>Shading: ${(p.shading_fraction * 100).toFixed(1)}%`
          );
        },
      });

      map.addLayer(layer);
      analysisLayerRef.current = layer;
      setAnalysisComplete(true);
    } catch (error) {
      console.error("Analysis failed:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleClearDrawing = () => {
    if (drawnItemsRef.current) {
      drawnItemsRef.current.clearLayers();
      setCurrentArea(0);
      onAreaChange(0);
      setAnalysisComplete(false);
      if (analysisLayerRef.current && mapRef.current) {
        mapRef.current.removeLayer(analysisLayerRef.current);
        analysisLayerRef.current = null;
      }
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
            Click the <strong>polygon</strong> (⬠) or <strong>rectangle</strong> (▭) icon on the map to start drawing. The area will be analyzed for solar potential with color-coded cells.
          </AlertDescription>
        </Alert>

        {/* Cell Size Control */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Grid Cell Size: {cellSize}m</label>
          </div>
          <Slider
            value={[cellSize]}
            onValueChange={(value) => setCellSize(value[0])}
            min={5}
            max={20}
            step={1}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            Smaller cells provide more detail but take longer to analyze
          </p>
        </div>

        {/* Legend */}
        <div className="bg-muted/50 border border-border rounded-lg p-4">
          <h4 className="text-sm font-semibold mb-3">Solar Potential Legend</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge className="bg-[#2a9d8f] hover:bg-[#2a9d8f]">
                <span className="text-white">High</span>
              </Badge>
              <span className="text-sm">Score ≥ 0.60 - Excellent solar conditions</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-[#f4d35e] hover:bg-[#f4d35e]">
                <span className="text-gray-900">Medium</span>
              </Badge>
              <span className="text-sm">0.25 ≤ Score &lt; 0.60 - Moderate potential</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-[#e63946] hover:bg-[#e63946]">
                <span className="text-white">Low</span>
              </Badge>
              <span className="text-sm">Score &lt; 0.25 - Limited potential</span>
            </div>
          </div>
        </div>

        {currentArea > 0 && (
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Measured Area</p>
                <p className="text-2xl font-bold text-primary">{currentArea.toLocaleString()} m²</p>
              </div>
              {isAnalyzing && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing...
                </div>
              )}
              {analysisComplete && !isAnalyzing && (
                <Badge variant="outline" className="text-green-600 border-green-600">
                  Analysis Complete
                </Badge>
              )}
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
            disabled={isAnalyzing}
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
