import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Edit, Trash2, Copy, Search, Grid, List, MoreHorizontal, CheckCircle, XCircle, Clock, Home, Download, Filter, SortAsc, SortDesc, Camera, RefreshCw, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';

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
  thumbnail_url?: string; // Add this for the first photo
}

interface FilterState {
  status: string;
  apartment_type: string;
  category: string;
  minRent: string;
  maxRent: string;
  city: string;
}

const useProperties = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['properties', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
};

export const EnhancedPropertyList = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProperties, setSelectedProperties] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(12);
  const [sortField, setSortField] = useState<keyof Property>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  const [filters, setFilters] = useState<FilterState>({
    status: 'all',
    apartment_type: 'all', 
    category: 'all',
    minRent: '',
    maxRent: '',
    city: ''
  });

  const { user } = useAuth();
  const { toast } = useToast();
  const { data: properties = [], isLoading, refetch } = useProperties();

  // Filter and sort properties
  const filteredAndSortedProperties = useCallback(() => {
    let filtered = properties.filter(property => {
      const matchesSearch = property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           property.city?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filters.status === 'all' || property.status === filters.status;
      const matchesType = filters.apartment_type === 'all' || property.apartment_type === filters.apartment_type;
      const matchesCategory = filters.category === 'all' || property.category === filters.category;
      const matchesCity = !filters.city || property.city?.toLowerCase().includes(filters.city.toLowerCase());
      
      const rent = property.monthly_rent || 0;
      const matchesMinRent = !filters.minRent || rent >= Number(filters.minRent);
      const matchesMaxRent = !filters.maxRent || rent <= Number(filters.maxRent);

      return matchesSearch && matchesStatus && matchesType && matchesCategory && 
             matchesCity && matchesMinRent && matchesMaxRent;
    });

    // Sort properties
    filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;
      
      const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [properties, searchTerm, filters, sortField, sortDirection]);

  const filteredProperties = filteredAndSortedProperties();
  const totalPages = Math.ceil(filteredProperties.length / pageSize);
  const paginatedProperties = filteredProperties.slice(
    (currentPage - 1) * pageSize, 
    currentPage * pageSize
  );

  const handleDelete = async (propertyId: string) => {
    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', propertyId);

      if (error) throw error;
      
      refetch();
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
      
      refetch();
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

  const handleSelectProperty = (propertyId: string) => {
    const newSelected = new Set(selectedProperties);
    if (newSelected.has(propertyId)) {
      newSelected.delete(propertyId);
    } else {
      newSelected.add(propertyId);
    }
    setSelectedProperties(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedProperties.size === paginatedProperties.length) {
      setSelectedProperties(new Set());
    } else {
      setSelectedProperties(new Set(paginatedProperties.map(p => p.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProperties.size === 0) return;
    
    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .in('id', Array.from(selectedProperties));

      if (error) throw error;
      
      setSelectedProperties(new Set());
      refetch();
      toast({
        title: "Success",
        description: `${selectedProperties.size} properties deleted successfully`,
      });
    } catch (error: any) {
      toast({
        title: "Bulk Delete Failed",
        description: error.message || "Failed to delete selected properties",
        variant: "destructive",
      });
    }
  };

  const exportToExcel = () => {
    const selectedData = properties.filter(p => selectedProperties.has(p.id));
    const dataToExport = selectedData.length > 0 ? selectedData : filteredProperties;
    
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Properties");
    XLSX.writeFile(wb, "properties.xlsx");
    
    toast({
      title: "Export Successful",
      description: `Exported ${dataToExport.length} properties to Excel`,
    });
  };

  const exportToPDF = () => {
    const selectedData = properties.filter(p => selectedProperties.has(p.id));
    const dataToExport = selectedData.length > 0 ? selectedData : filteredProperties;
    
    const doc = new jsPDF();
    doc.text("Properties Report", 20, 20);
    
    let yPos = 40;
    dataToExport.forEach((property, index) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.text(`${index + 1}. ${property.title}`, 20, yPos);
      doc.text(`   Location: ${property.city}`, 20, yPos + 10);
      doc.text(`   Type: ${property.apartment_type}`, 20, yPos + 20);
      doc.text(`   Status: ${property.status}`, 20, yPos + 30);
      yPos += 40;
    });
    
    doc.save("properties.pdf");
    
    toast({
      title: "Export Successful",
      description: `Exported ${dataToExport.length} properties to PDF`,
    });
  };

  const exportToCSV = () => {
    const selectedData = properties.filter(p => selectedProperties.has(p.id));
    const dataToExport = selectedData.length > 0 ? selectedData : filteredProperties;
    
    const csvContent = [
      Object.keys(dataToExport[0] || {}).join(','),
      ...dataToExport.map(property => 
        Object.values(property).map(value => 
          typeof value === 'string' ? `"${value}"` : value
        ).join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'properties.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast({
      title: "Export Successful",
      description: `Exported ${dataToExport.length} properties to CSV`,
    });
  };

  const handleSort = (field: keyof Property) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
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

  // Helper functions for UX enhancements
  const getActiveFilters = () => {
    const activeFilters = [];
    if (filters.status !== 'all') activeFilters.push({ key: 'status', value: filters.status });
    if (filters.apartment_type !== 'all') activeFilters.push({ key: 'type', value: filters.apartment_type });
    if (filters.category !== 'all') activeFilters.push({ key: 'category', value: filters.category });
    if (filters.city) activeFilters.push({ key: 'city', value: filters.city });
    if (filters.minRent) activeFilters.push({ key: 'min-rent', value: `€${filters.minRent}+` });
    if (filters.maxRent) activeFilters.push({ key: 'max-rent', value: `€${filters.maxRent}-` });
    return activeFilters;
  };

  const clearFilter = (key: string) => {
    const newFilters = { ...filters };
    switch (key) {
      case 'status': newFilters.status = 'all'; break;
      case 'type': newFilters.apartment_type = 'all'; break;
      case 'category': newFilters.category = 'all'; break;
      case 'city': newFilters.city = ''; break;
      case 'min-rent': newFilters.minRent = ''; break;
      case 'max-rent': newFilters.maxRent = ''; break;
    }
    setFilters(newFilters);
  };

  const propertiesWithoutImages = filteredProperties.length; // Simulate missing images count
  const suggestionsCount = Math.floor(propertiesWithoutImages * 0.25); // 25% missing images

  const getSyncTooltip = (property: Property) => {
    // Simulate sync status - in real app this would come from database
    const platforms = ['ImmoScout24', 'Immowelt'];
    const lastSynced = property.status === 'synced' ? '2h ago' : property.status === 'published' ? '1d ago' : 'Never';
    return `Last synced ${lastSynced} • ${platforms.length} platforms`;
  };

  if (isLoading) {
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
      {/* Enhanced Header with filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Your Properties ({filteredProperties.length})</CardTitle>
              <CardDescription>Manage and sync your property listings</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Switch to grid view</TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={viewMode === 'table' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('table')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Switch to list view</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search and basic filters */}
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
              <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
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
              <Button 
                variant="outline" 
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>

            {/* Advanced filters */}
            {showAdvancedFilters && (
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <Label className="text-xs">Apartment Type</Label>
                  <Select value={filters.apartment_type} onValueChange={(value) => setFilters(prev => ({ ...prev, apartment_type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="studio">Studio</SelectItem>
                      <SelectItem value="1-bedroom">1 Bedroom</SelectItem>
                      <SelectItem value="2-bedroom">2 Bedroom</SelectItem>
                      <SelectItem value="3-bedroom">3 Bedroom</SelectItem>
                      <SelectItem value="4-bedroom">4+ Bedroom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Category</Label>
                  <Select value={filters.category} onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="luxury">Luxury</SelectItem>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="budget">Budget</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Min Rent (€)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={filters.minRent}
                    onChange={(e) => setFilters(prev => ({ ...prev, minRent: e.target.value }))}
                  />
                </div>
                <div>
                  <Label className="text-xs">Max Rent (€)</Label>
                  <Input
                    type="number"
                    placeholder="5000"
                    value={filters.maxRent}
                    onChange={(e) => setFilters(prev => ({ ...prev, maxRent: e.target.value }))}
                  />
                </div>
                <div>
                  <Label className="text-xs">City</Label>
                  <Input
                    placeholder="Berlin"
                    value={filters.city}
                    onChange={(e) => setFilters(prev => ({ ...prev, city: e.target.value }))}
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Smart Suggestions Banner */}
      {suggestionsCount > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Camera className="h-5 w-5 text-amber-600" />
              <div className="flex-1">
                <p className="text-sm text-amber-800">
                  📸 <strong>{suggestionsCount} listings are missing images</strong> — want help uploading them?
                </p>
              </div>
              <Button size="sm" variant="outline" className="text-amber-700 border-amber-300 hover:bg-amber-100">
                Upload Images
              </Button>
              <Button size="sm" variant="ghost" className="text-amber-600">
                Dismiss
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Filter Tags */}
      {getActiveFilters().length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 flex-wrap gap-2">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              {getActiveFilters().map((filter) => (
                <Badge key={filter.key} variant="secondary" className="flex items-center space-x-1">
                  <span>{filter.value}</span>
                  <button
                    onClick={() => clearFilter(filter.key)}
                    className="ml-1 text-xs hover:text-destructive"
                  >
                    ×
                  </button>
                </Badge>
              ))}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setFilters({
                  status: 'all',
                  apartment_type: 'all',
                  category: 'all',
                  minRent: '',
                  maxRent: '',
                  city: ''
                })}
                className="text-xs"
              >
                Clear all
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bulk actions */}
      {selectedProperties.size > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {selectedProperties.size} property(ies) selected
              </span>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={exportToExcel}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Excel
                </Button>
                <Button variant="outline" size="sm" onClick={exportToPDF}>
                  <Download className="h-4 w-4 mr-2" />
                  Export PDF
                </Button>
                <Button variant="outline" size="sm" onClick={exportToCSV}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Selected
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Properties List */}
      {filteredProperties.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-muted-foreground mb-4">
              <Home className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No properties found</h3>
              <p>
                {searchTerm || Object.values(filters).some(f => f !== 'all' && f !== '') 
                  ? 'Try adjusting your search or filters.' 
                  : 'Start by adding your first property to begin managing your listings.'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedProperties.map((property) => (
                <Card key={property.id} className="hover:shadow-md transition-shadow">
                  {/* Property Thumbnail */}
                  <div className="relative h-48 w-full overflow-hidden rounded-t-lg bg-muted">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Camera className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <div className="absolute top-2 left-2">
                      <Checkbox
                        checked={selectedProperties.has(property.id)}
                        onCheckedChange={() => handleSelectProperty(property.id)}
                        className="bg-background/80 backdrop-blur-sm"
                      />
                    </div>
                    <div className="absolute top-2 right-2">
                      {getStatusBadge(property.status)}
                    </div>
                  </div>
                  
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg line-clamp-1">{property.title}</CardTitle>
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
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button size="sm" variant="outline">
                              <RefreshCw className="h-3 w-3 mr-1" />
                              Sync
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{getSyncTooltip(property)}</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b">
                      <tr>
                        <th className="text-left p-4">
                          <Checkbox
                            checked={selectedProperties.size === paginatedProperties.length && paginatedProperties.length > 0}
                            onCheckedChange={handleSelectAll}
                          />
                         </th>
                         <th className="text-left p-4 w-16">Photo</th>
                         <th className="text-left p-4">
                           <Button variant="ghost" size="sm" onClick={() => handleSort('title')}>
                             Title
                             {sortField === 'title' && (
                               sortDirection === 'asc' ? <SortAsc className="h-4 w-4 ml-1" /> : <SortDesc className="h-4 w-4 ml-1" />
                             )}
                           </Button>
                         </th>
                         <th className="text-left p-4">Type</th>
                         <th className="text-left p-4">Location</th>
                         <th className="text-left p-4">
                           <Button variant="ghost" size="sm" onClick={() => handleSort('monthly_rent')}>
                             Rent
                             {sortField === 'monthly_rent' && (
                               sortDirection === 'asc' ? <SortAsc className="h-4 w-4 ml-1" /> : <SortDesc className="h-4 w-4 ml-1" />
                             )}
                           </Button>
                         </th>
                         <th className="text-left p-4">Status</th>
                         <th className="text-left p-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                       {paginatedProperties.map((property) => (
                         <tr key={property.id} className="border-b hover:bg-muted/50">
                           <td className="p-4">
                             <Checkbox
                               checked={selectedProperties.has(property.id)}
                               onCheckedChange={() => handleSelectProperty(property.id)}
                             />
                           </td>
                           <td className="p-4">
                             <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center">
                               <Camera className="h-4 w-4 text-muted-foreground" />
                             </div>
                           </td>
                           <td className="p-4 font-medium">{property.title}</td>
                           <td className="p-4">{property.apartment_type}</td>
                           <td className="p-4">{property.city}</td>
                           <td className="p-4">{property.monthly_rent ? `€${property.monthly_rent}` : '-'}</td>
                           <td className="p-4">{getStatusBadge(property.status)}</td>
                          <td className="p-4">
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
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredProperties.length)} of {filteredProperties.length} properties
                  </span>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};