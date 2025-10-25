import { useState, useEffect, useRef } from "react";
import Hero from "@/components/Hero";
import CalculatorForm from "@/components/CalculatorForm";
import ResultsDisplay from "@/components/ResultsDisplay";
import MapAreaMeasure from "@/components/MapAreaMeasure";
import CompareScenarios from "@/components/CompareScenarios";
import { Sun } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Index = () => {
  const calculatorRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({
    projectType: "Commercial",
    latitude: 28.6139,
    longitude: 77.2090,
    roofArea: 500,
    tilt: 30,
    orientation: "South",
    efficiency: 0.20,
  });

  const [results, setResults] = useState({
    energyOutput: 0,
    systemCapacity: 0,
    savings: 0,
    co2Reduction: 0,
    paybackPeriod: 0,
    peakPower: 0,
    annualRevenue: 0,
  });

  useEffect(() => {
    calculateResults();
  }, [formData]);

  const calculateResults = () => {
    // Project type multipliers
    const projectMultipliers = {
      "Residential": { cost: 3.0, rate: 0.12 },
      "Commercial": { cost: 2.5, rate: 0.10 },
      "Industrial": { cost: 2.2, rate: 0.08 },
      "Utility-Scale": { cost: 1.8, rate: 0.06 }
    };
    
    const multiplier = projectMultipliers[formData.projectType as keyof typeof projectMultipliers];
    
    // Solar calculation using PV formula: E = A × r × H × PR
    const avgSolarIrradiance = 5.5 * 365; // kWh/m²/year
    
    // Adjust for tilt and orientation
    const tiltFactor = Math.cos((formData.tilt - 30) * Math.PI / 180) * 0.9 + 0.1;
    const orientationFactor = formData.orientation === "South" ? 1.0 : 
                             formData.orientation.includes("South") ? 0.95 : 0.85;
    
    const performanceRatio = 0.85; // Commercial-grade PR
    
    const energyOutput = Math.round(
      formData.roofArea * 
      formData.efficiency * 
      avgSolarIrradiance * 
      performanceRatio * 
      tiltFactor * 
      orientationFactor
    );

    const systemCapacity = (formData.roofArea * formData.efficiency).toFixed(2);
    const peakPower = parseFloat(systemCapacity) * 1000; // in watts
    
    // Commercial electricity rates
    const savings = Math.round(energyOutput * multiplier.rate);
    const annualRevenue = savings; // For utility companies, this is revenue
    
    // CO2 reduction: ~0.92 lbs per kWh, convert to metric tons
    const co2Reduction = (energyOutput * 0.92 * 0.000453592);
    
    // ROI calculation with project-specific costs
    const installationCost = peakPower * multiplier.cost;
    const paybackPeriod = installationCost / savings;

    setResults({
      energyOutput,
      systemCapacity: parseFloat(systemCapacity),
      savings,
      co2Reduction,
      paybackPeriod,
      peakPower: Math.round(peakPower),
      annualRevenue,
    });
  };

  const handleFormChange = (field: string, value: number | string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAreaChange = (area: number) => {
    setFormData((prev) => ({ ...prev, roofArea: area }));
  };

  const handleLocationChange = (lat: number, lng: number) => {
    setFormData((prev) => ({ ...prev, latitude: lat, longitude: lng }));
  };

  const scrollToCalculator = () => {
    calculatorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen gradient-hero">
      <nav className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sun className="w-8 h-8 text-primary" />
            <span className="text-xl font-bold gradient-solar bg-clip-text text-transparent">
              PowerGrid Analytics
            </span>
          </div>
          <div className="text-sm text-muted-foreground">
            Enterprise Solar Estimation Platform
          </div>
        </div>
      </nav>

      <Hero onGetStarted={scrollToCalculator} />

      <div ref={calculatorRef} className="container mx-auto px-4 py-16 space-y-12">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-4xl font-bold">Project Analysis & ROI Calculator</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Configure project parameters for real-time analysis of energy production, 
            revenue projections, and return on investment across all scales
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-8">
            <CalculatorForm formData={formData} onFormChange={handleFormChange} />
          </div>
          
          <div className="lg:col-span-2 space-y-8">
            <MapAreaMeasure 
              latitude={formData.latitude}
              longitude={formData.longitude}
              onAreaChange={handleAreaChange}
              onLocationChange={handleLocationChange}
            />
            
            <Tabs defaultValue="results" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="results">Analysis Results</TabsTrigger>
                <TabsTrigger value="compare">Compare Scenarios</TabsTrigger>
              </TabsList>
              <TabsContent value="results" className="mt-6">
                <ResultsDisplay results={results} />
              </TabsContent>
              <TabsContent value="compare" className="mt-6">
                <CompareScenarios currentResults={results} formData={formData} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      <footer className="bg-card border-t border-border mt-16">
        <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">
          <p>© 2025 PowerGrid Analytics. Enterprise solar solutions for electricity producers.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
