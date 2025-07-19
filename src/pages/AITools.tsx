import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bot, Sparkles, FileText, Image, Zap, Brain } from "lucide-react";

const AITools = () => {
  const aiFeatures = [
    {
      title: "Property Description Generator",
      description: "Generate compelling property descriptions automatically",
      icon: FileText,
      status: "available",
      category: "Content"
    },
    {
      title: "Image Enhancement",
      description: "Automatically enhance and optimize property photos",
      icon: Image,
      status: "coming-soon",
      category: "Media"
    },
    {
      title: "Pricing Optimization",
      description: "AI-powered pricing recommendations based on market data",
      icon: Zap,
      status: "coming-soon",
      category: "Analytics"
    },
    {
      title: "Content Translation",
      description: "Translate listings to multiple languages instantly",
      icon: Brain,
      status: "available",
      category: "Content"
    },
    {
      title: "SEO Optimization",
      description: "Optimize listing titles and descriptions for better visibility",
      icon: Sparkles,
      status: "coming-soon",
      category: "Marketing"
    },
    {
      title: "Virtual Staging",
      description: "AI-powered virtual furniture placement in empty rooms",
      icon: Image,
      status: "coming-soon",
      category: "Media"
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "available":
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Available</Badge>;
      case "coming-soon":
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Coming Soon</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Content":
        return "text-blue-500";
      case "Media":
        return "text-purple-500";
      case "Analytics":
        return "text-green-500";
      case "Marketing":
        return "text-orange-500";
      default:
        return "text-gray-500";
    }
  };

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <Bot className="h-8 w-8 text-primary" />
          <h1 className="text-display text-foreground">AI Tools</h1>
        </div>
        <p className="text-muted-foreground">
          Leverage artificial intelligence to optimize your property listings and automate tasks.
        </p>
      </div>

      {/* Usage Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Tasks This Month</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">127</div>
            <p className="text-xs text-muted-foreground">+23 from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Descriptions Generated</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45</div>
            <p className="text-xs text-muted-foreground">For 12 properties</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time Saved</CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18h</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">96%</div>
            <p className="text-xs text-muted-foreground">AI task completion</p>
          </CardContent>
        </Card>
      </div>

      {/* AI Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {aiFeatures.map((feature, index) => (
          <Card key={index} className={feature.status === "coming-soon" ? "opacity-60" : ""}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <feature.icon className={`h-6 w-6 ${getCategoryColor(feature.category)}`} />
                  <div>
                    <CardTitle className="text-base">{feature.title}</CardTitle>
                    <Badge variant="outline" className="text-xs mt-1">
                      {feature.category}
                    </Badge>
                  </div>
                </div>
                {getStatusBadge(feature.status)}
              </div>
              <CardDescription className="text-sm mt-2">
                {feature.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full" 
                variant={feature.status === "available" ? "default" : "outline"}
                disabled={feature.status === "coming-soon"}
              >
                {feature.status === "available" ? "Use Tool" : "Coming Soon"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent AI Activity */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Recent AI Activity</CardTitle>
          <CardDescription>Latest AI-powered tasks and their results</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <FileText className="h-4 w-4 text-blue-500" />
              <div className="text-sm">
                <p className="font-medium">Generated description for "Modern Apartment in Berlin"</p>
                <p className="text-muted-foreground">3 hours ago • 98% quality score</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Brain className="h-4 w-4 text-green-500" />
              <div className="text-sm">
                <p className="font-medium">Translated 5 listings to English and French</p>
                <p className="text-muted-foreground">1 day ago • High accuracy</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <FileText className="h-4 w-4 text-blue-500" />
              <div className="text-sm">
                <p className="font-medium">Generated SEO-optimized titles for 3 properties</p>
                <p className="text-muted-foreground">2 days ago • 15% visibility improvement</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AITools;