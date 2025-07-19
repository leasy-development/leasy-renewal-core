import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

interface PoliciesSectionProps {
  formData: any;
  updateFormData: (field: string, value: any) => void;
}

export function PoliciesSection({ formData, updateFormData }: PoliciesSectionProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Policies & Rules</h2>
        <p className="text-muted-foreground">Set house rules and policies for your property</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>House Rules</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="house_rules">House Rules</Label>
            <Textarea
              id="house_rules"
              value={formData.house_rules || ''}
              onChange={(e) => updateFormData('house_rules', e.target.value)}
              placeholder="e.g., No smoking, No parties, Quiet hours after 10 PM..."
              className="min-h-[100px]"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Landlord Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="landlord_name">Landlord Name</Label>
              <Input
                id="landlord_name"
                value={formData.landlord_info?.name || ''}
                onChange={(e) => updateFormData('landlord_info', { 
                  ...formData.landlord_info, 
                  name: e.target.value 
                })}
                placeholder="John Doe"
              />
            </div>
            <div>
              <Label htmlFor="landlord_phone">Phone Number</Label>
              <Input
                id="landlord_phone"
                value={formData.landlord_info?.phone || ''}
                onChange={(e) => updateFormData('landlord_info', { 
                  ...formData.landlord_info, 
                  phone: e.target.value 
                })}
                placeholder="+49 123 456 789"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="landlord_email">Email Address</Label>
            <Input
              id="landlord_email"
              type="email"
              value={formData.landlord_info?.email || ''}
              onChange={(e) => updateFormData('landlord_info', { 
                ...formData.landlord_info, 
                email: e.target.value 
              })}
              placeholder="landlord@example.com"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contractual Partner</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contract_name">Name</Label>
              <Input
                id="contract_name"
                value={formData.contractual_partner?.name || ''}
                onChange={(e) => updateFormData('contractual_partner', { 
                  ...formData.contractual_partner, 
                  name: e.target.value 
                })}
                placeholder="Property Management Company"
              />
            </div>
            <div>
              <Label htmlFor="contract_phone">Phone Number</Label>
              <Input
                id="contract_phone"
                value={formData.contractual_partner?.phone || ''}
                onChange={(e) => updateFormData('contractual_partner', { 
                  ...formData.contractual_partner, 
                  phone: e.target.value 
                })}
                placeholder="+49 123 456 789"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="contract_email">Email Address</Label>
            <Input
              id="contract_email"
              type="email"
              value={formData.contractual_partner?.email || ''}
              onChange={(e) => updateFormData('contractual_partner', { 
                ...formData.contractual_partner, 
                email: e.target.value 
              })}
              placeholder="contact@management.com"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}