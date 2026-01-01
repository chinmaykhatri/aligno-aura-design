import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Brain, Loader2, AlertTriangle, CheckCircle, TrendingUp, Lightbulb, RefreshCw, Share2, Copy, Download } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Insight {
  healthScore: number;
  healthStatus: "healthy" | "at-risk" | "critical";
  primaryRisk: string;
  riskLevel: "low" | "medium" | "high";
  predictedImpact: string;
  recommendedAction: string;
  whyThisMatters: string;
  confidenceScore: number;
}

const sampleScenarios = [
  "We're building a mobile app with 3 developers. Sprint ends Friday, but the API integration is only 40% done and our lead developer is on PTO starting Wednesday.",
  "Marketing website redesign with 2 weeks deadline. Design is approved but we haven't started development. Team of 2 frontend devs, one is new.",
  "E-commerce platform migration. 500+ products to move, current system going offline in 10 days. One developer handling both backend and data migration.",
];

const TryAligno = () => {
  const [scenario, setScenario] = useState("");
  const [insight, setInsight] = useState<Insight | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const insightRef = useRef<HTMLDivElement>(null);

  const analyzeScenario = async () => {
    if (scenario.trim().length < 10) {
      toast.error("Please describe your project scenario in more detail.");
      return;
    }

    setIsLoading(true);
    setShowResult(false);

    try {
      const { data, error } = await supabase.functions.invoke("try-aligno", {
        body: { scenario: scenario.trim() },
      });

      if (error) {
        console.error("Function error:", error);
        toast.error("Unable to analyze scenario. Please try again.");
        return;
      }

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      if (data?.insight) {
        setInsight(data.insight);
        setShowResult(true);
      }
    } catch (err) {
      console.error("Analysis error:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const useSampleScenario = (sample: string) => {
    setScenario(sample);
    setShowResult(false);
    setInsight(null);
  };

  const reset = () => {
    setScenario("");
    setInsight(null);
    setShowResult(false);
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case "healthy": return "text-emerald-500";
      case "at-risk": return "text-amber-500";
      case "critical": return "text-destructive";
      default: return "text-muted-foreground";
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case "low": return "bg-emerald-500/20 text-emerald-500 border-emerald-500/30";
      case "medium": return "bg-amber-500/20 text-amber-500 border-amber-500/30";
      case "high": return "bg-destructive/20 text-destructive border-destructive/30";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const generateShareableLink = () => {
    if (!insight) return;
    
    const shareData = {
      scenario: scenario.substring(0, 200),
      health: insight.healthScore,
      status: insight.healthStatus,
      risk: insight.primaryRisk,
      action: insight.recommendedAction,
    };
    
    const encoded = btoa(encodeURIComponent(JSON.stringify(shareData)));
    const shareUrl = `${window.location.origin}${window.location.pathname}?insight=${encoded}`;
    
    navigator.clipboard.writeText(shareUrl);
    toast.success("Link copied to clipboard");
  };

  const downloadAsImage = async () => {
    if (!insightRef.current) return;
    
    setIsGeneratingImage(true);
    try {
      const canvas = await html2canvas(insightRef.current, {
        backgroundColor: '#1a1a1a',
        scale: 2,
        logging: false,
        useCORS: true,
      });
      
      const link = document.createElement('a');
      link.download = 'aligno-insight.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      toast.success("Image downloaded");
    } catch (error) {
      console.error("Failed to generate image:", error);
      toast.error("Failed to generate image");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  return (
    <section className="py-24 bg-charcoal/30" id="try">
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mx-auto text-center mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-copper/10 border border-copper/20">
            <Brain className="w-4 h-4 text-copper" />
            <span className="text-sm font-medium text-copper">Interactive Demo</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground">
            See how Aligno thinks
          </h2>
          <p className="text-lg text-muted-foreground">
            Describe a project scenario and watch Aligno generate predictive insights in real-time.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Input Section */}
            <div className="space-y-4">
              <div className="p-6 rounded-2xl bg-card border border-border/40">
                <label className="block text-sm font-medium text-foreground mb-3">
                  Describe your project scenario
                </label>
                <Textarea
                  value={scenario}
                  onChange={(e) => setScenario(e.target.value)}
                  placeholder="Example: We have a 2-week sprint with 5 tasks remaining. Two team members are at 120% capacity, and there's a dependency on an external API that's delayed..."
                  className="min-h-[160px] bg-secondary/50 border-border/40 focus:border-copper/40 resize-none"
                  disabled={isLoading}
                />
                <div className="flex gap-3 mt-4">
                  <Button
                    onClick={analyzeScenario}
                    disabled={isLoading || scenario.trim().length < 10}
                    className="flex-1 bg-gradient-copper hover:opacity-90 text-deep-black font-medium"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Brain className="w-4 h-4 mr-2" />
                        Generate Insight
                      </>
                    )}
                  </Button>
                  {showResult && (
                    <Button variant="outline" onClick={reset} className="border-copper/40">
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Sample Scenarios */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Try a sample scenario</p>
                <div className="space-y-2">
                  {sampleScenarios.map((sample, index) => (
                    <button
                      key={index}
                      onClick={() => useSampleScenario(sample)}
                      className="w-full text-left p-3 rounded-lg bg-secondary/30 border border-border/30 hover:border-copper/30 transition-colors text-sm text-muted-foreground hover:text-foreground"
                      disabled={isLoading}
                    >
                      {sample.substring(0, 80)}...
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Result Section */}
            <div className="space-y-4">
              {!showResult && !isLoading && (
                <div className="p-6 rounded-2xl bg-card border border-dashed border-border/40 h-full flex flex-col items-center justify-center text-center min-h-[400px]">
                  <div className="p-4 rounded-full bg-secondary/50 mb-4">
                    <Lightbulb className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">
                    Enter a project scenario to see<br />Aligno's predictive insights
                  </p>
                </div>
              )}

              {isLoading && (
                <div className="p-6 rounded-2xl bg-card border border-copper/20 h-full flex flex-col items-center justify-center min-h-[400px]">
                  <div className="space-y-4 text-center">
                    <div className="p-4 rounded-full bg-copper/10 mx-auto w-fit">
                      <Brain className="w-8 h-8 text-copper animate-pulse" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-foreground font-medium">Analyzing your scenario...</p>
                      <p className="text-sm text-muted-foreground">Detecting risks and generating insights</p>
                    </div>
                  </div>
                </div>
              )}

              {showResult && insight && (
                <div ref={insightRef} className="p-6 rounded-2xl bg-card border border-copper/30 glow-copper space-y-5 animate-fade-in">
                  {/* Header with Share */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-copper/20">
                        <Brain className="w-5 h-5 text-copper" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Project Health</p>
                        <p className={`text-2xl font-bold ${getHealthColor(insight.healthStatus)}`}>
                          {insight.healthScore}%
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getRiskColor(insight.riskLevel)}`}>
                        {insight.riskLevel.toUpperCase()} RISK
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="border-copper/40 hover:bg-copper/10"
                            disabled={isGeneratingImage}
                          >
                            {isGeneratingImage ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Share2 className="w-4 h-4" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-card border-border">
                          <DropdownMenuItem onClick={generateShareableLink} className="cursor-pointer">
                            <Copy className="w-4 h-4 mr-2" />
                            Copy link
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={downloadAsImage} className="cursor-pointer">
                            <Download className="w-4 h-4 mr-2" />
                            Download as image
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <Progress value={insight.healthScore} className="h-2" />

                  {/* Primary Risk */}
                  <div className="p-4 rounded-xl bg-secondary/50 border border-border/30 space-y-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      <span className="text-sm font-medium text-foreground">Primary Risk</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{insight.primaryRisk}</p>
                  </div>

                  {/* Predicted Impact */}
                  <div className="p-4 rounded-xl bg-secondary/50 border border-border/30 space-y-2">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-copper" />
                      <span className="text-sm font-medium text-foreground">Predicted Impact</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{insight.predictedImpact}</p>
                  </div>

                  {/* Recommended Action */}
                  <div className="p-4 rounded-xl bg-copper/10 border border-copper/20 space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-copper" />
                      <span className="text-sm font-medium text-foreground">Recommended Action</span>
                    </div>
                    <p className="text-sm text-foreground">{insight.recommendedAction}</p>
                  </div>

                  {/* Why This Matters */}
                  <div className="pt-3 border-t border-border/30">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Why this matters</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{insight.whyThisMatters}</p>
                  </div>

                  {/* Confidence */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
                    <span>Analysis confidence: {insight.confidenceScore}%</span>
                    <span className="text-copper">Powered by Aligno AI</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TryAligno;