import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, DollarSign, Leaf, Clock, TrendingUp, Battery } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import MetricCard from "./MetricCard";
import { formatCapacity, formatEnergy, formatPower, formatCurrency, formatCO2 } from "@/lib/formatters";
import { Separator } from "./ui/separator";

interface ResultsDisplayProps {
  results: {
    energyOutput: number;
    systemCapacity: number;
    savings: number;
    co2Reduction: number;
    paybackPeriod: number;
    peakPower: number;
    annualRevenue: number;
  };
}

const ResultsDisplay = ({ results }: ResultsDisplayProps) => {
  const capacity = formatCapacity(results.systemCapacity);
  const energy = formatEnergy(results.energyOutput);
  const power = formatPower(results.peakPower);
  const co2 = formatCO2(results.co2Reduction);

  const monthlyData = [
    { month: "Jan", energy: Math.round(results.energyOutput * 0.07) },
    { month: "Feb", energy: Math.round(results.energyOutput * 0.08) },
    { month: "Mar", energy: Math.round(results.energyOutput * 0.09) },
    { month: "Apr", energy: Math.round(results.energyOutput * 0.10) },
    { month: "May", energy: Math.round(results.energyOutput * 0.11) },
    { month: "Jun", energy: Math.round(results.energyOutput * 0.10) },
    { month: "Jul", energy: Math.round(results.energyOutput * 0.09) },
    { month: "Aug", energy: Math.round(results.energyOutput * 0.08) },
    { month: "Sep", energy: Math.round(results.energyOutput * 0.08) },
    { month: "Oct", energy: Math.round(results.energyOutput * 0.08) },
    { month: "Nov", energy: Math.round(results.energyOutput * 0.07) },
    { month: "Dec", energy: Math.round(results.energyOutput * 0.07) },
  ];

  const savingsData = [
    { name: "Solar Savings", value: results.savings },
    { name: "Grid Cost", value: results.savings * 1.5 },
  ];

  const COLORS = ["hsl(var(--chart-1))", "hsl(var(--muted))"];

  const totalSavings = results.savings;
  const savingsPercentage = ((results.savings / (results.savings * 2.5)) * 100).toFixed(0);

  return (
    <div className="space-y-8">
      {/* Summary Banner */}
      <Card className="shadow-glow border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="text-4xl">☀️</div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Solar Potential Summary</h3>
              <p className="text-muted-foreground leading-relaxed">
                Your selected area can produce <span className="font-bold text-chart-1">{energy.lakh || `${energy.value} ${energy.unit}`}</span> annually, 
                save <span className="font-bold text-chart-2">{formatCurrency(totalSavings)}</span> per year, 
                and offset <span className="font-bold text-chart-3">{co2.value} {co2.unit}</span> of CO₂ emissions.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h3 className="text-xl font-semibold">⚡ Performance Metrics</h3>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <MetricCard
            title="System Capacity"
            value={capacity.value}
            unit={capacity.unit}
            subtitle="Total installed solar power"
            icon={Battery}
            iconColor="text-primary"
            tooltip="The maximum power output your solar system can generate under optimal conditions."
          />
          
          <MetricCard
            title="Peak Power"
            value={power.value}
            unit={power.unit}
            subtitle="Maximum output capacity"
            icon={Zap}
            iconColor="text-chart-1"
            tooltip="The peak wattage your system can produce during ideal sunlight conditions."
          />
          
          <MetricCard
            title="Annual Energy Output"
            value={energy.value}
            unit={energy.unit}
            subtitle={energy.lakh ? `${energy.lakh} per year` : "Energy generated per year"}
            icon={TrendingUp}
            iconColor="text-chart-1"
            tooltip="Total electrical energy your solar system will generate over one year based on location and conditions."
          />
        </div>
      </div>

      <Separator />

      {/* Financial & Impact Metrics */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h3 className="text-xl font-semibold">💰 Financial & Environmental Impact</h3>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <MetricCard
            title="Annual Revenue"
            value={formatCurrency(results.annualRevenue).replace('$', '')}
            unit="USD"
            subtitle="Estimated yearly earnings"
            icon={DollarSign}
            iconColor="text-chart-2"
            tooltip="Expected annual revenue from energy generation based on current electricity rates."
          />
          
          <MetricCard
            title="ROI Period"
            value={results.paybackPeriod.toFixed(1)}
            unit="years"
            subtitle="Time to recover investment"
            icon={Clock}
            iconColor="text-chart-4"
            tooltip="The time it will take to recover your initial installation cost through energy savings and revenue."
          />
          
          <MetricCard
            title="CO₂ Offset"
            value={co2.value}
            unit={`${co2.unit}/year`}
            subtitle="Annual emissions reduction"
            icon={Leaf}
            iconColor="text-chart-3"
            tooltip="The amount of carbon dioxide emissions prevented by using solar energy instead of grid electricity."
          />
        </div>
      </div>

      <Separator />

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Projected Monthly Output</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="month" 
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)"
                  }}
                  formatter={(value: number) => [`${value.toLocaleString()} kWh`, "Energy"]}
                />
                <Bar 
                  dataKey="energy" 
                  fill="hsl(var(--chart-1))" 
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Annual Savings Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={savingsData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={90}
                  fill="hsl(var(--chart-1))"
                  dataKey="value"
                >
                  {savingsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)"
                  }}
                  formatter={(value: number) => formatCurrency(value)}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">You save</p>
              <p className="text-2xl font-bold text-chart-2">{formatCurrency(totalSavings)}</p>
              <p className="text-xs text-muted-foreground">annually from solar energy</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResultsDisplay;
