import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface AmenitiesSectionProps {
  formData: any;
  updateFormData: (field: string, value: any) => void;
}

const amenitiesList = [
  { id: 'wifi', label: 'WiFi' },
  { id: 'parking', label: 'Parking' },
  { id: 'gym', label: 'Gym/Fitness Center' },
  { id: 'pool', label: 'Swimming Pool' },
  { id: 'laundry', label: 'Laundry Facilities' },
  { id: 'kitchen', label: 'Fully Equipped Kitchen' },
  { id: 'air_conditioning', label: 'Air Conditioning' },
  { id: 'heating', label: 'Heating' },
  { id: 'balcony', label: 'Balcony/Terrace' },
  { id: 'garden', label: 'Garden' },
  { id: 'elevator', label: 'Elevator' },
  { id: 'security', label: '24/7 Security' },
  { id: 'cleaning', label: 'Cleaning Service' },
  { id: 'pets_allowed', label: 'Pets Allowed' },
  { id: 'smoking_allowed', label: 'Smoking Allowed' },
  { id: 'wheelchair_accessible', label: 'Wheelchair Accessible' },
];

export function AmenitiesSection({ formData, updateFormData }: AmenitiesSectionProps) {
  const amenities = formData.amenities || [];

  const toggleAmenity = (amenityId: string) => {
    const newAmenities = amenities.includes(amenityId)
      ? amenities.filter((id: string) => id !== amenityId)
      : [...amenities, amenityId];
    updateFormData('amenities', newAmenities);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Amenities</h2>
        <p className="text-muted-foreground">Select the amenities available at your property</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Available Amenities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {amenitiesList.map((amenity) => (
              <div key={amenity.id} className="flex items-center space-x-2">
                <Checkbox
                  id={amenity.id}
                  checked={amenities.includes(amenity.id)}
                  onCheckedChange={() => toggleAmenity(amenity.id)}
                />
                <Label 
                  htmlFor={amenity.id}
                  className="text-sm font-normal cursor-pointer"
                >
                  {amenity.label}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}