import { Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/solar-hero.jpg";

const Hero = ({ onGetStarted }: { onGetStarted: () => void }) => {
  return (
    <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'brightness(0.4)',
        }}
      />
      
      <div className="absolute inset-0 bg-gradient-to-b from-primary/20 via-transparent to-background z-[1]" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 bg-card/90 backdrop-blur-sm px-6 py-3 rounded-full shadow-glow">
            <Sun className="w-5 h-5 text-primary animate-pulse" />
            <span className="text-sm font-medium">Enterprise Solar Solutions</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-primary-foreground drop-shadow-lg">
            Power Generation <span className="gradient-solar bg-clip-text text-transparent">At Scale</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-primary-foreground/90 max-w-2xl mx-auto drop-shadow">
            Professional solar estimation platform for utility companies, commercial projects, and industrial installations
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button 
              size="lg" 
              onClick={onGetStarted}
              className="gradient-solar shadow-glow hover:shadow-glow hover:scale-105 transition-all text-lg px-8 py-6"
            >
              Start Project Analysis
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="bg-card/90 backdrop-blur-sm border-2 hover:bg-card hover:scale-105 transition-all text-lg px-8 py-6"
            >
              View Solutions
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
