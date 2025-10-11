import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, DollarSign, Leaf, Clock, TrendingUp, Battery } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

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
  const monthlyData = [
    { month: "Jan", energy: results.energyOutput * 0.07 },
    { month: "Feb", energy: results.energyOutput * 0.08 },
    { month: "Mar", energy: results.energyOutput * 0.09 },
    { month: "Apr", energy: results.energyOutput * 0.10 },
    { month: "May", energy: results.energyOutput * 0.11 },
    { month: "Jun", energy: results.energyOutput * 0.10 },
    { month: "Jul", energy: results.energyOutput * 0.09 },
    { month: "Aug", energy: results.energyOutput * 0.08 },
    { month: "Sep", energy: results.energyOutput * 0.08 },
    { month: "Oct", energy: results.energyOutput * 0.08 },
    { month: "Nov", energy: results.energyOutput * 0.07 },
    { month: "Dec", energy: results.energyOutput * 0.07 },
  ];

  const savingsData = [
    { name: "Grid Cost", value: results.savings * 1.5 },
    { name: "Solar Savings", value: results.savings },
  ];

  const COLORS = ["hsl(var(--muted))", "hsl(var(--chart-1))"];

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="shadow-card hover:shadow-glow transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">System Capacity</CardTitle>
            <Battery className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold gradient-solar bg-clip-text text-transparent">
              {results.systemCapacity.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">kWp installed</p>
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-glow transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Peak Power</CardTitle>
            <Zap className="w-4 h-4 text-chart-1" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-chart-1">
              {results.peakPower.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Wp peak output</p>
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-glow transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Energy Output</CardTitle>
            <TrendingUp className="w-4 h-4 text-chart-1" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-chart-1">
              {results.energyOutput.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">kWh per year</p>
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-glow transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Annual Revenue</CardTitle>
            <DollarSign className="w-4 h-4 text-chart-2" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-chart-2">
              ${results.annualRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">estimated per year</p>
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-glow transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">CO₂ Offset</CardTitle>
            <Leaf className="w-4 h-4 text-chart-3" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-chart-3">
              {results.co2Reduction.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">metric tons/year</p>
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-glow transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">ROI Period</CardTitle>
            <Clock className="w-4 h-4 text-chart-4" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-chart-4">
              {results.paybackPeriod.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">years payback</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Projected Monthly Output</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)"
                  }}
                />
                <Bar dataKey="energy" fill="hsl(var(--chart-1))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Revenue vs Grid Cost</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={savingsData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
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
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResultsDisplay;
