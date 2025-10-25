import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Scale, X, TrendingUp } from "lucide-react";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend } from "recharts";
import { formatCapacity, formatEnergy, formatCurrency, formatCO2 } from "@/lib/formatters";

interface Scenario {
  id: string;
  name: string;
  area: number;
  system_capacity: number;
  energy_output: number;
  annual_revenue: number;
  roi_period: number;
  co2_reduction: number;
  project_type: string;
}

interface CompareScenariosProps {
  currentResults: {
    energyOutput: number;
    systemCapacity: number;
    savings: number;
    co2Reduction: number;
    paybackPeriod: number;
    peakPower: number;
    annualRevenue: number;
  };
  formData: {
    projectType: string;
    latitude: number;
    longitude: number;
    roofArea: number;
  };
}

export default function CompareScenarios({ currentResults, formData }: CompareScenariosProps) {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [scenarioName, setScenarioName] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadScenarios();
  }, []);

  const loadScenarios = async () => {
    const { data, error } = await supabase
      .from("solar_scenarios")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error loading scenarios",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setScenarios(data || []);
    }
  };

  const saveCurrentScenario = async () => {
    if (!scenarioName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for this scenario",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.from("solar_scenarios").insert({
      name: scenarioName,
      area: formData.roofArea,
      latitude: formData.latitude,
      longitude: formData.longitude,
      system_capacity: currentResults.systemCapacity,
      peak_power: currentResults.peakPower,
      energy_output: currentResults.energyOutput,
      annual_revenue: currentResults.annualRevenue,
      roi_period: currentResults.paybackPeriod,
      co2_reduction: currentResults.co2Reduction,
      project_type: formData.projectType,
    });

    if (error) {
      toast({
        title: "Error saving scenario",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Scenario saved",
        description: `"${scenarioName}" has been saved successfully`,
      });
      setScenarioName("");
      setIsDialogOpen(false);
      loadScenarios();
    }
  };

  const deleteScenario = async (id: string) => {
    const { error } = await supabase.from("solar_scenarios").delete().eq("id", id);

    if (error) {
      toast({
        title: "Error deleting scenario",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Scenario deleted",
      });
      setSelectedScenarios(selectedScenarios.filter((sid) => sid !== id));
      loadScenarios();
    }
  };

  const toggleScenarioSelection = (id: string) => {
    setSelectedScenarios((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  const getComparisonData = () => {
    const selected = scenarios.filter((s) => selectedScenarios.includes(s.id));
    if (selected.length === 0) return [];

    const metrics = ["Capacity", "Energy", "Revenue", "CO₂", "ROI"];
    
    return metrics.map((metric) => {
      const dataPoint: any = { metric };
      selected.forEach((scenario) => {
        switch (metric) {
          case "Capacity":
            dataPoint[scenario.name] = Number(scenario.system_capacity);
            break;
          case "Energy":
            dataPoint[scenario.name] = Number(scenario.energy_output) / 1000; // Convert to MWh for scale
            break;
          case "Revenue":
            dataPoint[scenario.name] = Number(scenario.annual_revenue) / 1000; // Convert to thousands
            break;
          case "CO₂":
            dataPoint[scenario.name] = Number(scenario.co2_reduction);
            break;
          case "ROI":
            dataPoint[scenario.name] = 20 - Number(scenario.roi_period); // Invert for radar (lower is better)
            break;
        }
      });
      return dataPoint;
    });
  };

  const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold flex items-center gap-2">
          <Scale className="w-6 h-6" />
          Compare Scenarios
        </h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>Save Current Scenario</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Save Scenario</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="scenario-name">Scenario Name</Label>
                <Input
                  id="scenario-name"
                  placeholder="e.g., Building A, Plot B"
                  value={scenarioName}
                  onChange={(e) => setScenarioName(e.target.value)}
                />
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Current configuration:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Area: {formData.roofArea} m²</li>
                  <li>Capacity: {formatCapacity(currentResults.systemCapacity).value} {formatCapacity(currentResults.systemCapacity).unit}</li>
                  <li>Energy: {formatEnergy(currentResults.energyOutput).value} {formatEnergy(currentResults.energyOutput).unit}/year</li>
                </ul>
              </div>
              <Button onClick={saveCurrentScenario} className="w-full">
                Save Scenario
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {scenarios.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <p>No saved scenarios yet. Save your current configuration to start comparing.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {scenarios.map((scenario) => {
              const isSelected = selectedScenarios.includes(scenario.id);
              const capacity = formatCapacity(Number(scenario.system_capacity));
              const energy = formatEnergy(Number(scenario.energy_output));
              const co2 = formatCO2(Number(scenario.co2_reduction));

              return (
                <Card
                  key={scenario.id}
                  className={`cursor-pointer transition-all ${
                    isSelected ? "ring-2 ring-primary shadow-glow" : "hover:shadow-card"
                  }`}
                  onClick={() => toggleScenarioSelection(scenario.id)}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-lg font-semibold">{scenario.name}</CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteScenario(scenario.id);
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Capacity</p>
                        <p className="font-semibold">{capacity.value} {capacity.unit}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Energy</p>
                        <p className="font-semibold">{energy.value} {energy.unit}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Revenue</p>
                        <p className="font-semibold">{formatCurrency(Number(scenario.annual_revenue))}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">ROI</p>
                        <p className="font-semibold">{Number(scenario.roi_period).toFixed(1)} yrs</p>
                      </div>
                    </div>
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground">
                        CO₂ Offset: <span className="font-semibold text-chart-3">{co2.value} {co2.unit}/year</span>
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {selectedScenarios.length >= 2 && (
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Comparison Chart
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart data={getComparisonData()}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis 
                      dataKey="metric" 
                      tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }}
                    />
                    <PolarRadiusAxis 
                      angle={90} 
                      domain={[0, "auto"]}
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                    />
                    {scenarios
                      .filter((s) => selectedScenarios.includes(s.id))
                      .map((scenario, index) => (
                        <Radar
                          key={scenario.id}
                          name={scenario.name}
                          dataKey={scenario.name}
                          stroke={COLORS[index % COLORS.length]}
                          fill={COLORS[index % COLORS.length]}
                          fillOpacity={0.3}
                        />
                      ))}
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
                <div className="mt-4 text-sm text-muted-foreground text-center">
                  <p>Select 2 or more scenarios to compare their performance across key metrics</p>
                </div>
              </CardContent>
            </Card>
          )}

          {selectedScenarios.length > 0 && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={() => setSelectedScenarios([])}
              >
                Clear Selection
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
