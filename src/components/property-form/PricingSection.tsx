import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface PricingSectionProps {
  formData: any;
  updateFormData: (field: string, value: any) => void;
}

export function PricingSection({ formData, updateFormData }: PricingSectionProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Pricing</h2>
        <p className="text-muted-foreground">Set your rental rates and pricing details</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rental Rates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="monthly_rent">Monthly Rent (€)</Label>
              <Input
                id="monthly_rent"
                type="number"
                value={formData.monthly_rent}
                onChange={(e) => updateFormData('monthly_rent', parseFloat(e.target.value) || 0)}
                placeholder="1200"
              />
            </div>
            <div>
              <Label htmlFor="weekly_rate">Weekly Rate (€)</Label>
              <Input
                id="weekly_rate"
                type="number"
                value={formData.weekly_rate}
                onChange={(e) => updateFormData('weekly_rate', parseFloat(e.target.value) || 0)}
                placeholder="300"
              />
            </div>
            <div>
              <Label htmlFor="daily_rate">Daily Rate (€)</Label>
              <Input
                id="daily_rate"
                type="number"
                value={formData.daily_rate}
                onChange={(e) => updateFormData('daily_rate', parseFloat(e.target.value) || 0)}
                placeholder="50"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Check-in/Check-out Times</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="checkin_time">Check-in Time</Label>
              <Input
                id="checkin_time"
                type="time"
                value={formData.checkin_time}
                onChange={(e) => updateFormData('checkin_time', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="checkout_time">Check-out Time</Label>
              <Input
                id="checkout_time"
                type="time"
                value={formData.checkout_time}
                onChange={(e) => updateFormData('checkout_time', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Additional Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Provides WG-suitable Certificate (WGSB)</Label>
              <p className="text-sm text-muted-foreground">
                Indicates if the property provides a WG-suitable certificate
              </p>
            </div>
            <Switch
              checked={formData.provides_wgsb}
              onCheckedChange={(checked) => updateFormData('provides_wgsb', checked)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}