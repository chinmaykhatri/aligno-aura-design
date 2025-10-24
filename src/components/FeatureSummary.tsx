import { CheckCircle, Users2, BarChart3 } from "lucide-react";

const FeatureSummary = () => {
  return (
    <section className="py-24 bg-gradient-amber relative overflow-hidden" id="why">
      <div className="absolute inset-0 grid-pattern opacity-20" />
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-3xl mx-auto text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground">
            How Aligno Helps You?
          </h2>
          <p className="text-lg text-muted-foreground">
            Transform the way you work with intelligent features
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          <div className="p-8 rounded-2xl bg-card/80 backdrop-blur-sm border border-copper/20 hover:border-copper/40 transition-smooth glow-copper animate-fade-up">
            <div className="w-14 h-14 rounded-2xl bg-gradient-copper flex items-center justify-center mb-6">
              <CheckCircle className="w-7 h-7 text-deep-black" />
            </div>
            <h3 className="text-2xl font-semibold text-foreground mb-4">
              Effortless Task Management
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              Create, assign, and track tasks with intuitive drag-and-drop interfaces. 
              Never lose sight of what needs to be done with smart notifications and reminders.
            </p>
          </div>
          
          <div className="p-8 rounded-2xl bg-card/80 backdrop-blur-sm border border-copper/20 hover:border-copper/40 transition-smooth glow-copper animate-fade-up" style={{ animationDelay: '0.1s' }}>
            <div className="w-14 h-14 rounded-2xl bg-gradient-copper flex items-center justify-center mb-6">
              <Users2 className="w-7 h-7 text-deep-black" />
            </div>
            <h3 className="text-2xl font-semibold text-foreground mb-4">
              Seamless Team Collaboration
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              Connect with your team in real-time. Share files, comment on tasks, 
              and stay synchronized with built-in communication tools.
            </p>
          </div>
          
          <div className="md:col-span-2 p-8 rounded-2xl bg-card/80 backdrop-blur-sm border border-copper/20 hover:border-copper/40 transition-smooth glow-copper animate-fade-up" style={{ animationDelay: '0.2s' }}>
            <div className="w-14 h-14 rounded-2xl bg-gradient-copper flex items-center justify-center mb-6">
              <BarChart3 className="w-7 h-7 text-deep-black" />
            </div>
            <h3 className="text-2xl font-semibold text-foreground mb-4">
              Comprehensive Project Insights
            </h3>
            <p className="text-muted-foreground leading-relaxed max-w-3xl">
              Gain deep visibility into project health with advanced analytics and reporting. 
              Identify bottlenecks, measure team performance, and make data-driven decisions 
              to optimize your workflow and deliver results faster.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeatureSummary;
