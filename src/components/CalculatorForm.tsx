import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { MapPin, Home, TrendingUp, Compass, Building2 } from "lucide-react";

interface CalculatorFormProps {
  formData: {
    projectType: string;
    latitude: number;
    longitude: number;
    roofArea: number;
    tilt: number;
    orientation: string;
    efficiency: number;
  };
  onFormChange: (field: string, value: number | string) => void;
}

const CalculatorForm = ({ formData, onFormChange }: CalculatorFormProps) => {
  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-primary" />
          Project Configuration
        </CardTitle>
        <CardDescription>
          Configure project parameters for commercial-grade analysis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="projectType" className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-primary" />
            Project Type
          </Label>
          <Select value={formData.projectType} onValueChange={(value) => onFormChange("projectType", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select project type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Residential">Residential (3-10 kW)</SelectItem>
              <SelectItem value="Commercial">Commercial (10-100 kW)</SelectItem>
              <SelectItem value="Industrial">Industrial (100-1000 kW)</SelectItem>
              <SelectItem value="Utility-Scale">Utility-Scale (1+ MW)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="latitude" className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              Latitude
            </Label>
            <Input
              id="latitude"
              type="number"
              step="0.0001"
              value={formData.latitude}
              onChange={(e) => onFormChange("latitude", parseFloat(e.target.value))}
              placeholder="28.6139"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="longitude" className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              Longitude
            </Label>
            <Input
              id="longitude"
              type="number"
              step="0.0001"
              value={formData.longitude}
              onChange={(e) => onFormChange("longitude", parseFloat(e.target.value))}
              placeholder="77.2090"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="roofArea" className="flex items-center gap-2">
            <Home className="w-4 h-4 text-primary" />
            Installation Area (m²)
          </Label>
          <Input
            id="roofArea"
            type="number"
            value={formData.roofArea}
            onChange={(e) => onFormChange("roofArea", parseFloat(e.target.value))}
            placeholder="500"
          />
          <p className="text-xs text-muted-foreground">
            Total available area for solar panel installation
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tilt" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Tilt Angle: {formData.tilt}°
          </Label>
          <Slider
            id="tilt"
            min={0}
            max={90}
            step={1}
            value={[formData.tilt]}
            onValueChange={(value) => onFormChange("tilt", value[0])}
            className="py-4"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="orientation" className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-primary" />
            Orientation
          </Label>
          <Select value={formData.orientation} onValueChange={(value) => onFormChange("orientation", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select orientation" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="North">North</SelectItem>
              <SelectItem value="South">South</SelectItem>
              <SelectItem value="East">East</SelectItem>
              <SelectItem value="West">West</SelectItem>
              <SelectItem value="Northeast">Northeast</SelectItem>
              <SelectItem value="Northwest">Northwest</SelectItem>
              <SelectItem value="Southeast">Southeast</SelectItem>
              <SelectItem value="Southwest">Southwest</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="efficiency">
            Panel Efficiency: {(formData.efficiency * 100).toFixed(0)}%
          </Label>
          <Slider
            id="efficiency"
            min={0.15}
            max={0.25}
            step={0.01}
            value={[formData.efficiency]}
            onValueChange={(value) => onFormChange("efficiency", value[0])}
            className="py-4"
          />
          <p className="text-xs text-muted-foreground">
            Modern commercial panels: 18-22% typical
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default CalculatorForm;
