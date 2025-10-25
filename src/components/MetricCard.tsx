import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info, LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";

interface MetricCardProps {
  title: string;
  value: string;
  unit: string;
  subtitle?: string;
  icon: LucideIcon;
  iconColor: string;
  tooltip: string;
  animate?: boolean;
}

export default function MetricCard({ 
  title, 
  value, 
  unit, 
  subtitle, 
  icon: Icon, 
  iconColor,
  tooltip,
  animate = true
}: MetricCardProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (animate) {
      const timer = setTimeout(() => setIsVisible(true), 100);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(true);
    }
  }, [animate]);

  return (
    <Card className={`shadow-card hover:shadow-glow transition-all duration-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-4 h-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-sm">{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <div className="text-4xl font-bold gradient-solar bg-clip-text text-transparent">
            {value}
          </div>
          <div className="text-xl font-semibold text-muted-foreground">
            {unit}
          </div>
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-2">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}
