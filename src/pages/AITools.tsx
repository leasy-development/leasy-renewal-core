import React from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { AIBulkDescriptionGenerator } from '@/components/AIBulkDescriptionGenerator';
import MediaProcessor from '@/components/MediaProcessor';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Wand2, 
  FileText, 
  Image, 
  Sparkles, 
  TrendingUp,
  Bot,
  Lightbulb
} from 'lucide-react';

export default function AITools() {
  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bot className="w-8 h-8 text-primary" />
            AI Tools Center
          </h1>
          <p className="text-muted-foreground mt-2">
            Leverage artificial intelligence to enhance your property management workflow
          </p>
        </div>

        <Tabs defaultValue="descriptions" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="descriptions" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Descriptions
            </TabsTrigger>
            <TabsTrigger value="media" className="flex items-center gap-2">
              <Image className="w-4 h-4" />
              Media Processing
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Insights & Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="descriptions" className="mt-6 space-y-6">
            <div className="grid gap-6">
              {/* AI Description Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wand2 className="w-5 h-5 text-primary" />
                    AI Property Descriptions
                  </CardTitle>
                  <CardDescription>
                    Generate compelling, professional property descriptions that attract quality tenants and buyers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-blue-600" />
                        <h3 className="font-semibold text-blue-900">Smart Generation</h3>
                      </div>
                      <p className="text-sm text-blue-700 mb-3">
                        AI analyzes property details to create unique, engaging descriptions tailored to your market
                      </p>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="secondary" className="text-xs">Professional Tone</Badge>
                        <Badge variant="secondary" className="text-xs">Multiple Languages</Badge>
                        <Badge variant="secondary" className="text-xs">SEO Optimized</Badge>
                      </div>
                    </Card>

                    <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-green-600" />
                        <h3 className="font-semibold text-green-900">Bulk Processing</h3>
                      </div>
                      <p className="text-sm text-green-700 mb-3">
                        Process multiple properties at once, perfect for large portfolios and CSV imports
                      </p>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="secondary" className="text-xs">Batch Processing</Badge>
                        <Badge variant="secondary" className="text-xs">CSV Integration</Badge>
                        <Badge variant="secondary" className="text-xs">Background Jobs</Badge>
                      </div>
                    </Card>
                  </div>
                </CardContent>
              </Card>

              {/* Bulk Description Generator */}
              <AIBulkDescriptionGenerator />

              {/* Usage Guidelines */}
              <Alert>
                <Lightbulb className="h-4 w-4" />
                <AlertTitle>💡 Pro Tips for Better Descriptions</AlertTitle>
                <AlertDescription>
                  <div className="mt-2 space-y-2 text-sm">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold mb-1">Optimize Your Input Data:</h4>
                        <ul className="space-y-1 list-disc list-inside text-xs">
                          <li>Include accurate square footage</li>
                          <li>Specify amenities and features</li>
                          <li>Provide clear location details</li>
                          <li>Set appropriate property categories</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">Choose the Right Tone:</h4>
                        <ul className="space-y-1 list-disc list-inside text-xs">
                          <li><strong>Luxury:</strong> High-end properties with premium features</li>
                          <li><strong>Family:</strong> Properties targeting families with children</li>
                          <li><strong>Corporate:</strong> Business-oriented rental markets</li>
                          <li><strong>Modern:</strong> Contemporary properties with smart features</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          </TabsContent>

          <TabsContent value="media" className="mt-6">
            <MediaProcessor />
          </TabsContent>

          <TabsContent value="insights" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  AI Insights & Analytics
                </CardTitle>
                <CardDescription>
                  Coming soon: Market analysis, pricing optimization, and performance insights
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <Card className="p-4 border-dashed border-2 border-muted-foreground/20">
                    <div className="text-center text-muted-foreground">
                      <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <h3 className="font-semibold mb-1">Market Analysis</h3>
                      <p className="text-sm">AI-powered market insights and competitive analysis</p>
                    </div>
                  </Card>

                  <Card className="p-4 border-dashed border-2 border-muted-foreground/20">
                    <div className="text-center text-muted-foreground">
                      <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <h3 className="font-semibold mb-1">Pricing Optimization</h3>
                      <p className="text-sm">Smart pricing recommendations based on market data</p>
                    </div>
                  </Card>
                </div>

                <Alert>
                  <Bot className="h-4 w-4" />
                  <AlertTitle>🚀 Coming Soon</AlertTitle>
                  <AlertDescription>
                    We're working on advanced AI features including market analysis, pricing optimization, 
                    and automated property scoring. Stay tuned for updates!
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}