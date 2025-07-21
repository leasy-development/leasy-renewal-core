import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { validatePassword, PasswordValidationResult } from '@/utils/passwordValidation';
import { Eye, EyeOff, Shield, AlertTriangle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SecurePasswordInputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  onValidationChange?: (isValid: boolean) => void;
  showStrengthIndicator?: boolean;
  required?: boolean;
  className?: string;
}

export const SecurePasswordInput: React.FC<SecurePasswordInputProps> = ({
  label = "Password",
  value,
  onChange,
  onValidationChange,
  showStrengthIndicator = true,
  required = false,
  className = ""
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [validation, setValidation] = useState<PasswordValidationResult>({
    isValid: false,
    errors: [],
    strength: 'weak'
  });

  useEffect(() => {
    if (value) {
      const result = validatePassword(value);
      setValidation(result);
      onValidationChange?.(result.isValid);
    } else {
      setValidation({ isValid: false, errors: [], strength: 'weak' });
      onValidationChange?.(false);
    }
  }, [value, onValidationChange]);

  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case 'strong': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-red-500';
    }
  };

  const getStrengthText = (strength: string) => {
    switch (strength) {
      case 'strong': return 'Strong';
      case 'medium': return 'Medium';
      default: return 'Weak';
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor="password" className="text-sm font-medium">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      
      <div className="relative">
        <Input
          id="password"
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pr-10"
          required={required}
          autoComplete="new-password"
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
          onClick={() => setShowPassword(!showPassword)}
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Eye className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      </div>

      {showStrengthIndicator && value && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Password strength: 
              <span className={`ml-1 font-medium ${
                validation.strength === 'strong' ? 'text-green-600' :
                validation.strength === 'medium' ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {getStrengthText(validation.strength)}
              </span>
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor(validation.strength)}`}
              style={{
                width: validation.strength === 'strong' ? '100%' :
                       validation.strength === 'medium' ? '66%' : '33%'
              }}
            />
          </div>
        </div>
      )}

      {validation.errors.length > 0 && (
        <div className="space-y-1">
          {validation.errors.map((error, index) => (
            <div key={index} className="flex items-center gap-2 text-sm text-red-600">
              <AlertTriangle className="h-3 w-3" />
              <span>{error}</span>
            </div>
          ))}
        </div>
      )}

      {validation.isValid && (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <Check className="h-3 w-3" />
          <span>Password meets all requirements</span>
        </div>
      )}
    </div>
  );
};