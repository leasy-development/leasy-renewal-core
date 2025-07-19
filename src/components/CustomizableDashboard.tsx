import { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, GripVertical, Plus, X } from "lucide-react";
import AnalyticsDashboard from "./AnalyticsDashboard";

interface Widget {
  id: string;
  title: string;
  type: 'analytics' | 'quick-actions' | 'recent-activity' | 'performance';
  content: React.ReactNode;
  span?: 'full' | 'half' | 'third';
}

const QuickActionsWidget = () => (
  <div className="space-y-3">
    <Button className="w-full justify-start" variant="outline">
      <Plus className="h-4 w-4 mr-2" />
      Add New Property
    </Button>
    <Button className="w-full justify-start" variant="outline">
      Sync All Properties
    </Button>
    <Button className="w-full justify-start" variant="outline">
      Export Data
    </Button>
  </div>
);

const RecentActivityWidget = () => (
  <div className="space-y-3">
    {[
      { action: "Property synced to ImmoScout24", time: "2 hours ago", status: "success" },
      { action: "New booking received", time: "4 hours ago", status: "info" },
      { action: "Property published", time: "1 day ago", status: "success" }
    ].map((activity, index) => (
      <div key={index} className="flex items-center space-x-3">
        <div className={`w-2 h-2 rounded-full ${
          activity.status === 'success' ? 'bg-green-500' : 'bg-blue-500'
        }`}></div>
        <div className="flex-1">
          <p className="text-sm font-medium">{activity.action}</p>
          <p className="text-xs text-muted-foreground">{activity.time}</p>
        </div>
      </div>
    ))}
  </div>
);

const PerformanceWidget = () => (
  <div className="space-y-4">
    <div className="flex justify-between items-center">
      <span className="text-sm">Occupancy Rate</span>
      <span className="text-sm font-medium">78%</span>
    </div>
    <div className="w-full bg-muted rounded-full h-2">
      <div className="bg-primary h-2 rounded-full" style={{ width: '78%' }}></div>
    </div>
    <div className="flex justify-between items-center">
      <span className="text-sm">Revenue Target</span>
      <span className="text-sm font-medium">€24,850 / €30,000</span>
    </div>
    <div className="w-full bg-muted rounded-full h-2">
      <div className="bg-green-500 h-2 rounded-full" style={{ width: '83%' }}></div>
    </div>
  </div>
);

const defaultWidgets: Widget[] = [
  {
    id: 'analytics',
    title: 'Analytics Overview',
    type: 'analytics',
    content: <AnalyticsDashboard />,
    span: 'full'
  },
  {
    id: 'quick-actions',
    title: 'Quick Actions',
    type: 'quick-actions',
    content: <QuickActionsWidget />
  },
  {
    id: 'recent-activity',
    title: 'Recent Activity',
    type: 'recent-activity',
    content: <RecentActivityWidget />
  },
  {
    id: 'performance',
    title: 'Performance',
    type: 'performance',
    content: <PerformanceWidget />
  }
];

const CustomizableDashboard = () => {
  const [widgets, setWidgets] = useState<Widget[]>(defaultWidgets);
  const [isCustomizing, setIsCustomizing] = useState(false);

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(widgets);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setWidgets(items);
  };

  const removeWidget = (widgetId: string) => {
    setWidgets(widgets.filter(w => w.id !== widgetId));
  };

  const addWidget = (widget: Widget) => {
    setWidgets([...widgets, { ...widget, id: `${widget.id}-${Date.now()}` }]);
  };

  const availableWidgets = [
    {
      id: 'quick-actions',
      title: 'Quick Actions',
      type: 'quick-actions' as const,
      content: <QuickActionsWidget />
    },
    {
      id: 'recent-activity',
      title: 'Recent Activity', 
      type: 'recent-activity' as const,
      content: <RecentActivityWidget />
    },
    {
      id: 'performance',
      title: 'Performance',
      type: 'performance' as const,
      content: <PerformanceWidget />
    }
  ];

  if (isCustomizing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Customize Dashboard</h2>
          <Button onClick={() => setIsCustomizing(false)}>
            Done Customizing
          </Button>
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="widgets">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-4"
              >
                {widgets.map((widget, index) => (
                  <Draggable key={widget.id} draggableId={widget.id} index={index}>
                    {(provided, snapshot) => (
                      <Card
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`${
                          snapshot.isDragging ? 'shadow-lg rotate-2' : ''
                        } transition-transform`}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div
                                {...provided.dragHandleProps}
                                className="cursor-grab hover:cursor-grabbing"
                              >
                                <GripVertical className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <CardTitle className="text-base">{widget.title}</CardTitle>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeWidget(widget.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="h-32 bg-muted rounded flex items-center justify-center">
                            <span className="text-muted-foreground">Widget Preview</span>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        <Card>
          <CardHeader>
            <CardTitle>Available Widgets</CardTitle>
            <CardDescription>Drag widgets to add them to your dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {availableWidgets.map((widget) => (
                <Card key={widget.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{widget.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-20 bg-muted rounded flex items-center justify-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => addWidget(widget)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <Button variant="outline" onClick={() => setIsCustomizing(true)}>
          <Settings className="h-4 w-4 mr-2" />
          Customize
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {widgets.map((widget) => (
          <Card
            key={widget.id}
            className={`${
              widget.span === 'full' ? 'lg:col-span-3' : 
              widget.span === 'half' ? 'lg:col-span-2' : 'lg:col-span-1'
            }`}
          >
            <CardHeader>
              <CardTitle className="text-lg">{widget.title}</CardTitle>
            </CardHeader>
            <CardContent>
              {widget.content}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CustomizableDashboard;