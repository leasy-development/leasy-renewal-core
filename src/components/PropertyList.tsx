import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit, Trash2, Copy, Search, Grid, List, MoreHorizontal, CheckCircle, XCircle, Clock, Home } from "lucide-react";
import { Link } from "react-router-dom";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/hooks/use-toast";

interface Property {
  id: string;
  title: string;
  description: string;
  apartment_type: string;
  category: string;
  status: string;
  city: string;
  monthly_rent: number;
  street_number: string;
  street_name: string;
  zip_code: string;
  region: string;
  country: string;
  weekly_rate: number;
  daily_rate: number;
  checkin_time: string;
  checkout_time: string;
  provides_wgsb: boolean;
  created_at: string;
}

export const PropertyList = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchProperties();
    }
  }, [user]);

  const fetchProperties = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProperties(data || []);
    } catch (error: any) {
      console.error('Error fetching properties:', error);
      
      let errorMessage = "Failed to fetch properties";
      let errorDetails = '';

      if (error?.message) {
        if (error.message.includes('permission denied')) {
          errorMessage = "Access Denied";
          errorDetails = "You don't have permission to view properties. Please log in again.";
        } else if (error.message.includes('network')) {
          errorMessage = "Connection Error";
          errorDetails = "Please check your internet connection and try again.";
        } else {
          errorDetails = `Technical details: ${error.message}`;
        }
      } else {
        errorDetails = "Could not retrieve your properties. Please refresh the page.";
      }

      toast({
        title: errorMessage,
        description: errorDetails,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (propertyId: string) => {
    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', propertyId);

      if (error) throw error;
      
      setProperties(properties.filter(p => p.id !== propertyId));
      toast({
        title: "Success",
        description: "Property deleted successfully",
      });
    } catch (error: any) {
      console.error('Error deleting property:', error);
      
      let errorMessage = "Failed to delete property";
      let errorDetails = '';

      if (error?.message) {
        if (error.message.includes('permission denied') || error.message.includes('row-level security')) {
          errorMessage = "Cannot Delete Property";
          errorDetails = "You don't have permission to delete this property. You can only delete properties you created.";
        } else if (error.message.includes('PGRST116')) {
          errorMessage = "Property Not Found";
          errorDetails = "This property no longer exists or has already been deleted.";
        } else if (error.message.includes('foreign key constraint')) {
          errorMessage = "Cannot Delete Property";
          errorDetails = "This property has related data (bookings, reviews, etc.) and cannot be deleted. Please archive it instead.";
        } else {
          errorDetails = `Technical details: ${error.message}`;
        }
      } else {
        errorDetails = "The property could not be deleted. Please try again.";
      }

      toast({
        title: errorMessage,
        description: errorDetails,
        variant: "destructive",
      });
    }
  };

  const handleDuplicate = async (property: Property) => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .insert({
          ...property,
          id: undefined,
          title: `${property.title} (Copy)`,
          created_at: undefined,
          updated_at: undefined,
          user_id: user?.id,
        });

      if (error) throw error;
      
      fetchProperties();
      toast({
        title: "Success",
        description: "Property duplicated successfully",
      });
    } catch (error: any) {
      console.error('Error duplicating property:', error);
      
      let errorMessage = "Failed to duplicate property";
      let errorDetails = '';

      if (error?.message) {
        if (error.message.includes('duplicate key value')) {
          errorMessage = "Duplicate Property Title";
          errorDetails = "A property with this title already exists. The copy will need a unique title.";
        } else if (error.message.includes('permission denied')) {
          errorMessage = "Permission Denied";
          errorDetails = "You don't have permission to create new properties.";
        } else if (error.message.includes('violates not-null constraint')) {
          errorMessage = "Missing Required Data";
          errorDetails = "The original property is missing required information and cannot be duplicated.";
        } else {
          errorDetails = `Technical details: ${error.message}`;
        }
      } else {
        errorDetails = "The property could not be duplicated. Please try again.";
      }

      toast({
        title: errorMessage,
        description: errorDetails,
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Published</Badge>;
      case 'draft':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Draft</Badge>;
      case 'synced':
        return <Badge variant="default" className="bg-blue-100 text-blue-800"><CheckCircle className="w-3 h-3 mr-1" />Synced</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getSyncStatus = () => {
    // Mock sync status for demo
    const platforms = ['FARAWAYHOME', 'ImmoScout24', 'Airbnb'];
    return platforms.map((platform, index) => (
      <div key={platform} className="flex items-center space-x-2 text-xs">
        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
        <span>{platform}</span>
      </div>
    ));
  };

  const filteredProperties = properties.filter(property => {
    const matchesSearch = property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         property.city?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || property.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading properties...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Your Properties</CardTitle>
              <CardDescription>Manage and sync your property listings</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('table')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search properties..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="synced">Synced</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Properties List */}
      {filteredProperties.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-muted-foreground mb-4">
              <Home className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No properties yet</h3>
              <p>Start by adding your first property to begin managing your listings.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
          {filteredProperties.map((property) => (
            <Card key={property.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{property.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {property.apartment_type} • {property.city}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <Link to={`/edit-property/${property.id}`}>
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                      </Link>
                      <DropdownMenuItem onClick={() => handleDuplicate(property)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDelete(property.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status:</span>
                    {getStatusBadge(property.status)}
                  </div>
                  
                  {property.monthly_rent && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Monthly Rent:</span>
                      <span className="font-medium">€{property.monthly_rent}</span>
                    </div>
                  )}

                  <div className="space-y-2">
                    <span className="text-sm text-muted-foreground">Sync Status:</span>
                    <div className="space-y-1">
                      {getSyncStatus()}
                    </div>
                  </div>

                  <div className="flex space-x-2 pt-2">
                    <Link to={`/edit-property/${property.id}`} className="flex-1">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="w-full"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                    </Link>
                    <Button size="sm" variant="outline">
                      Sync
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};