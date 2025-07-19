import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit2, Trash2, BarChart3, PieChart, TrendingUp, DollarSign } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Widget {
  id: string;
  type: 'chart' | 'metric' | 'list';
  title: string;
  size: 'small' | 'medium' | 'large';
  position: { x: number; y: number };
  config: any;
  user_id: string;
}

interface DashboardWidgetsProps {
  className?: string;
}

export function DashboardWidgets({ className }: DashboardWidgetsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [isAddingWidget, setIsAddingWidget] = useState(false);
  const [editingWidget, setEditingWidget] = useState<Widget | null>(null);

  // Load user's dashboard widgets
  useEffect(() => {
    if (user) {
      loadWidgets();
      setupRealtimeSubscription();
    }
  }, [user]);

  const loadWidgets = async () => {
    try {
      const { data, error } = await supabase
        .from('dashboard_widgets')
        .select('*')
        .eq('user_id', user?.id)
        .order('position->y', { ascending: true });

      if (error) throw error;
      setWidgets(data || []);
    } catch (error) {
      console.error('Error loading widgets:', error);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('dashboard-widgets-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dashboard_widgets',
          filter: `user_id=eq.${user?.id}`
        },
        (payload) => {
          console.log('Widget change:', payload);
          loadWidgets(); // Reload widgets on any change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const addWidget = async (widgetData: Partial<Widget>) => {
    try {
      const { data, error } = await supabase
        .from('dashboard_widgets')
        .insert({
          ...widgetData,
          user_id: user?.id,
          position: { x: 0, y: widgets.length }
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Widget Added",
        description: "Dashboard widget has been added successfully",
      });

      setIsAddingWidget(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add widget",
        variant: "destructive",
      });
    }
  };

  const updateWidget = async (id: string, updates: Partial<Widget>) => {
    try {
      const { error } = await supabase
        .from('dashboard_widgets')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Widget Updated",
        description: "Dashboard widget has been updated successfully",
      });

      setEditingWidget(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update widget",
        variant: "destructive",
      });
    }
  };

  const deleteWidget = async (id: string) => {
    try {
      const { error } = await supabase
        .from('dashboard_widgets')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Widget Deleted",
        description: "Dashboard widget has been deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete widget",
        variant: "destructive",
      });
    }
  };

  const renderWidget = (widget: Widget) => {
    const sizeClasses = {
      small: "col-span-1 row-span-1",
      medium: "col-span-2 row-span-1", 
      large: "col-span-2 row-span-2"
    };

    return (
      <Card key={widget.id} className={`${sizeClasses[widget.size]} group relative`}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setEditingWidget(widget)}
              >
                <Edit2 className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => deleteWidget(widget.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {widget.type === 'metric' && (
            <div className="text-center">
              <div className="text-2xl font-bold">{widget.config?.value || 0}</div>
              <div className="text-sm text-muted-foreground">{widget.config?.label}</div>
            </div>
          )}
          {widget.type === 'chart' && (
            <div className="flex items-center justify-center h-20 text-muted-foreground">
              <BarChart3 className="h-8 w-8" />
              <span className="ml-2">Chart View</span>
            </div>
          )}
          {widget.type === 'list' && (
            <div className="space-y-1">
              {widget.config?.items?.slice(0, 3).map((item: any, i: number) => (
                <div key={i} className="text-sm">{item.title}</div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold">Dashboard Widgets</h2>
        <Dialog open={isAddingWidget} onOpenChange={setIsAddingWidget}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Widget
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Dashboard Widget</DialogTitle>
            </DialogHeader>
            <WidgetForm
              onSubmit={addWidget}
              onCancel={() => setIsAddingWidget(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-4 gap-4 auto-rows-min">
        {widgets.map(renderWidget)}
        
        {widgets.length === 0 && (
          <Card className="col-span-4 p-8 text-center text-muted-foreground">
            <div className="space-y-2">
              <BarChart3 className="h-12 w-12 mx-auto opacity-50" />
              <p>No widgets added yet</p>
              <p className="text-sm">Click "Add Widget" to customize your dashboard</p>
            </div>
          </Card>
        )}
      </div>

      {editingWidget && (
        <Dialog open={true} onOpenChange={() => setEditingWidget(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Widget</DialogTitle>
            </DialogHeader>
            <WidgetForm
              widget={editingWidget}
              onSubmit={(data) => updateWidget(editingWidget.id, data)}
              onCancel={() => setEditingWidget(null)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

interface WidgetFormProps {
  widget?: Widget;
  onSubmit: (data: Partial<Widget>) => void;
  onCancel: () => void;
}

function WidgetForm({ widget, onSubmit, onCancel }: WidgetFormProps) {
  const [formData, setFormData] = useState({
    title: widget?.title || '',
    type: widget?.type || 'metric',
    size: widget?.size || 'small',
    config: widget?.config || {}
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Widget Title</Label>
        <Input
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          placeholder="e.g., Total Properties"
        />
      </div>

      <div>
        <Label>Widget Type</Label>
        <Select value={formData.type} onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value }))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="metric">Metric</SelectItem>
            <SelectItem value="chart">Chart</SelectItem>
            <SelectItem value="list">List</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Size</Label>
        <Select value={formData.size} onValueChange={(value: any) => setFormData(prev => ({ ...prev, size: value }))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="small">Small</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="large">Large</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {formData.type === 'metric' && (
        <div className="space-y-2">
          <div>
            <Label>Value</Label>
            <Input
              type="number"
              value={formData.config.value || ''}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                config: { ...prev.config, value: e.target.value }
              }))}
              placeholder="42"
            />
          </div>
          <div>
            <Label>Label</Label>
            <Input
              value={formData.config.label || ''}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                config: { ...prev.config, label: e.target.value }
              }))}
              placeholder="Total Properties"
            />
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-4">
        <Button type="submit" className="flex-1">
          {widget ? 'Update' : 'Add'} Widget
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}