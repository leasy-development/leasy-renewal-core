import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";

interface Bed {
  id: string;
  type: string;
  count: number;
}

interface RoomsSectionProps {
  formData: any;
  updateFormData: (field: string, value: any) => void;
  addItem: (field: string) => void;
  removeItem: (field: string, id: string) => void;
  updateItem: (field: string, id: string, updates: any) => void;
}

export function RoomsSection({ 
  formData, 
  updateFormData, 
  addItem, 
  removeItem, 
  updateItem 
}: RoomsSectionProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Room Details</h2>
        <p className="text-muted-foreground">Specify the room configuration and bed types</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Bed Configuration</CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => addItem('beds')}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Bed Type
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.beds?.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No bed types added yet. Click "Add Bed Type" to start.
            </p>
          ) : (
            formData.beds?.map((bed: Bed) => (
              <div key={bed.id} className="flex gap-3 items-end p-4 border rounded-lg">
                <div className="flex-1">
                  <Label>Bed Type</Label>
                  <Select 
                    value={bed.type} 
                    onValueChange={(value) => updateItem('beds', bed.id, { type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select bed type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single Bed</SelectItem>
                      <SelectItem value="double">Double Bed</SelectItem>
                      <SelectItem value="queen">Queen Bed</SelectItem>
                      <SelectItem value="king">King Bed</SelectItem>
                      <SelectItem value="sofa_bed">Sofa Bed</SelectItem>
                      <SelectItem value="bunk_bed">Bunk Bed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-24">
                  <Label>Count</Label>
                  <Input
                    type="number"
                    min="1"
                    value={bed.count}
                    onChange={(e) => updateItem('beds', bed.id, { count: Number(e.target.value) })}
                    placeholder="1"
                  />
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => removeItem('beds', bed.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Room Counts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="bedrooms">Bedrooms</Label>
              <Input
                id="bedrooms"
                type="number"
                min="0"
                value={formData.bedrooms || ''}
                onChange={(e) => updateFormData('bedrooms', Number(e.target.value))}
                placeholder="2"
              />
            </div>
            <div>
              <Label htmlFor="bathrooms">Bathrooms</Label>
              <Input
                id="bathrooms"
                type="number"
                min="0"
                value={formData.bathrooms || ''}
                onChange={(e) => updateFormData('bathrooms', Number(e.target.value))}
                placeholder="1"
              />
            </div>
            <div>
              <Label htmlFor="max_guests">Max Guests</Label>
              <Input
                id="max_guests"
                type="number"
                min="1"
                value={formData.max_guests || ''}
                onChange={(e) => updateFormData('max_guests', Number(e.target.value))}
                placeholder="4"
              />
            </div>
            <div>
              <Label htmlFor="square_meters">Square Meters</Label>
              <Input
                id="square_meters"
                type="number"
                min="0"
                value={formData.square_meters || ''}
                onChange={(e) => updateFormData('square_meters', Number(e.target.value))}
                placeholder="50"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}