import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";

interface AdditionalFee {
  id: string;
  description: string;
  amount: number;
  frequency: string;
}

interface FeesSectionProps {
  formData: any;
  updateFormData: (field: string, value: any) => void;
  addItem: (field: string) => void;
  removeItem: (field: string, id: string) => void;
  updateItem: (field: string, id: string, updates: any) => void;
}

export function FeesSection({ 
  formData, 
  updateFormData, 
  addItem, 
  removeItem, 
  updateItem 
}: FeesSectionProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Additional Fees</h2>
        <p className="text-muted-foreground">Add any additional fees or charges for your property</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Additional Fees</CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => addItem('additional_fees')}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Fee
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.additional_fees?.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No additional fees added yet. Click "Add Fee" to start.
            </p>
          ) : (
            formData.additional_fees?.map((fee: AdditionalFee) => (
              <div key={fee.id} className="flex gap-3 items-end p-4 border rounded-lg">
                <div className="flex-1">
                  <Label>Description</Label>
                  <Input
                    value={fee.description}
                    onChange={(e) => updateItem('additional_fees', fee.id, { description: e.target.value })}
                    placeholder="e.g., Cleaning fee"
                  />
                </div>
                <div className="w-32">
                  <Label>Amount (€)</Label>
                  <Input
                    type="number"
                    value={fee.amount}
                    onChange={(e) => updateItem('additional_fees', fee.id, { amount: Number(e.target.value) })}
                    placeholder="50"
                  />
                </div>
                <div className="w-32">
                  <Label>Frequency</Label>
                  <Select 
                    value={fee.frequency} 
                    onValueChange={(value) => updateItem('additional_fees', fee.id, { frequency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="once">One-time</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => removeItem('additional_fees', fee.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}