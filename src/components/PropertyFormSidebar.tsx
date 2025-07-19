import { cn } from "@/lib/utils";
import { 
  Home, 
  MapPin, 
  DollarSign, 
  Camera, 
  Receipt,
  Settings,
  FileText,
  Bed
} from "lucide-react";

interface Section {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  completed?: boolean;
}

interface PropertyFormSidebarProps {
  activeSection: string;
  onSectionChange: (sectionId: string) => void;
  completedSections?: Set<string>;
  className?: string;
}

const sections: Section[] = [
  { id: 'basic', title: 'Basic Details', icon: Home },
  { id: 'location', title: 'Location', icon: MapPin },
  { id: 'pricing', title: 'Pricing', icon: DollarSign },
  { id: 'media', title: 'Images & Media', icon: Camera },
  { id: 'fees', title: 'Additional Fees', icon: Receipt },
  { id: 'amenities', title: 'Amenities', icon: Settings },
  { id: 'policies', title: 'Policies', icon: FileText },
  { id: 'rooms', title: 'Room Details', icon: Bed },
];

export function PropertyFormSidebar({ 
  activeSection, 
  onSectionChange, 
  completedSections = new Set(),
  className 
}: PropertyFormSidebarProps) {
  return (
    <div className={cn("w-64 border-r bg-background/50 backdrop-blur-sm", className)}>
      <div className="p-6">
        <h2 className="text-lg font-semibold mb-6">Property Form</h2>
        <nav className="space-y-2">
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            const isCompleted = completedSections.has(section.id);
            
            return (
              <button
                key={section.id}
                onClick={() => onSectionChange(section.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-lg transition-all duration-200",
                  "hover:bg-muted/50 group",
                  isActive && "bg-primary/10 text-primary border border-primary/20",
                  !isActive && "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className={cn(
                  "h-4 w-4 transition-colors",
                  isActive && "text-primary",
                  isCompleted && !isActive && "text-green-600"
                )} />
                <span className="text-sm font-medium">{section.title}</span>
                {isCompleted && (
                  <div className="ml-auto w-2 h-2 rounded-full bg-green-600" />
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}