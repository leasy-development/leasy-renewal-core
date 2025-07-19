import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface LocationSectionProps {
  formData: any;
  updateFormData: (field: string, value: any) => void;
}

export function LocationSection({ formData, updateFormData }: LocationSectionProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Location</h2>
        <p className="text-muted-foreground">Specify where your property is located</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Address Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="street_number">Street Number</Label>
              <Input
                id="street_number"
                value={formData.street_number}
                onChange={(e) => updateFormData('street_number', e.target.value)}
                placeholder="123"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="street_name">Street Name</Label>
              <Input
                id="street_name"
                value={formData.street_name}
                onChange={(e) => updateFormData('street_name', e.target.value)}
                placeholder="Main Street"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => updateFormData('city', e.target.value)}
                placeholder="Berlin"
              />
            </div>
            <div>
              <Label htmlFor="region">Region/State</Label>
              <Input
                id="region"
                value={formData.region}
                onChange={(e) => updateFormData('region', e.target.value)}
                placeholder="Berlin"
              />
            </div>
            <div>
              <Label htmlFor="zip_code">ZIP/Postal Code</Label>
              <Input
                id="zip_code"
                value={formData.zip_code}
                onChange={(e) => updateFormData('zip_code', e.target.value)}
                placeholder="10115"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="country">Country</Label>
            <Select value={formData.country} onValueChange={(value) => updateFormData('country', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Germany">Germany</SelectItem>
                <SelectItem value="Austria">Austria</SelectItem>
                <SelectItem value="Switzerland">Switzerland</SelectItem>
                <SelectItem value="Netherlands">Netherlands</SelectItem>
                <SelectItem value="Belgium">Belgium</SelectItem>
                <SelectItem value="France">France</SelectItem>
                <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                <SelectItem value="United States">United States</SelectItem>
                <SelectItem value="Canada">Canada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}