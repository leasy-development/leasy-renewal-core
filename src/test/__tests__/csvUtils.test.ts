import { describe, it, expect } from 'vitest';
import { validatePropertyData, sanitizePropertyInput, convertToNumeric } from '@/lib/csvUtils';

describe('CSV Utils', () => {
  describe('validatePropertyData', () => {
    it('should validate complete property data', () => {
      const data = {
        title: 'Beautiful Apartment',
        apartment_type: 'apartment',
        category: 'rental',
        street_name: 'Main Street',
        city: 'Berlin',
        monthly_rent: 1000,
        bedrooms: 2
      };

      const result = validatePropertyData(data, 1);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing required fields', () => {
      const data = {
        apartment_type: 'apartment',
        category: 'rental'
        // Missing title, street_name, city
      };

      const result = validatePropertyData(data, 1);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(3);
      expect(result.errors.some(e => e.field === 'title')).toBe(true);
      expect(result.errors.some(e => e.field === 'street_name')).toBe(true);
      expect(result.errors.some(e => e.field === 'city')).toBe(true);
    });

    it('should validate numeric fields', () => {
      const data = {
        title: 'Test',
        apartment_type: 'apartment',
        category: 'rental',
        street_name: 'Main St',
        city: 'Berlin',
        monthly_rent: -500, // Invalid
        bedrooms: 'not-a-number', // Invalid
        square_meters: 0 // Invalid
      };

      const result = validatePropertyData(data, 1);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'monthly_rent')).toBe(true);
      expect(result.errors.some(e => e.field === 'bedrooms')).toBe(true);
      expect(result.errors.some(e => e.field === 'square_meters')).toBe(true);
    });

    it('should validate email format in landlord info', () => {
      const data = {
        title: 'Test',
        apartment_type: 'apartment',
        category: 'rental',
        street_name: 'Main St',
        city: 'Berlin',
        landlord_email: 'invalid-email'
      };

      const result = validatePropertyData(data, 1);
      expect(result.errors.some(e => e.field === 'landlord_email')).toBe(true);
    });

    it('should accept valid email format', () => {
      const data = {
        title: 'Test',
        apartment_type: 'apartment',
        category: 'rental',
        street_name: 'Main St',
        city: 'Berlin',
        landlord_email: 'landlord@example.com'
      };

      const result = validatePropertyData(data, 1);
      expect(result.errors.some(e => e.field === 'landlord_email')).toBe(false);
    });
  });

  describe('sanitizePropertyInput', () => {
    it('should sanitize HTML content', () => {
      const input = {
        title: '<script>alert("xss")</script>Safe Title',
        description: 'Normal text with <b>bold</b> and <script>dangerous()</script>',
        house_rules: '<p>Valid paragraph</p><script>bad()</script>'
      };

      const result = sanitizePropertyInput(input);
      
      expect(result.title).toBe('Safe Title');
      expect(result.description).toBe('Normal text with <b>bold</b> and ');
      expect(result.house_rules).toBe('<p>Valid paragraph</p>');
    });

    it('should trim whitespace', () => {
      const input = {
        title: '  Trimmed Title  ',
        city: '\n  Berlin  \t'
      };

      const result = sanitizePropertyInput(input);
      
      expect(result.title).toBe('Trimmed Title');
      expect(result.city).toBe('Berlin');
    });

    it('should handle numeric conversions', () => {
      const input = {
        monthly_rent: '1000.50',
        bedrooms: '2',
        square_meters: '75.5'
      };

      const result = sanitizePropertyInput(input);
      
      expect(result.monthly_rent).toBe(1000.50);
      expect(result.bedrooms).toBe(2);
      expect(result.square_meters).toBe(75.5);
    });

    it('should handle boolean conversions', () => {
      const input = {
        provides_wgsb: 'true',
        another_bool: 'false',
        yes_bool: 'yes',
        no_bool: 'no'
      };

      const result = sanitizePropertyInput(input);
      
      expect(result.provides_wgsb).toBe(true);
      expect(result.another_bool).toBe(false);
      expect(result.yes_bool).toBe(true);
      expect(result.no_bool).toBe(false);
    });
  });

  describe('convertToNumeric', () => {
    it('should convert string numbers', () => {
      expect(convertToNumeric('123')).toBe(123);
      expect(convertToNumeric('123.45')).toBe(123.45);
    });

    it('should handle European number format', () => {
      expect(convertToNumeric('1.234,56')).toBe(1234.56);
      expect(convertToNumeric('1,234.56')).toBe(1234.56);
    });

    it('should handle currency symbols', () => {
      expect(convertToNumeric('€1,000')).toBe(1000);
      expect(convertToNumeric('$1,234.56')).toBe(1234.56);
    });

    it('should return null for invalid input', () => {
      expect(convertToNumeric('not-a-number')).toBeNull();
      expect(convertToNumeric('')).toBeNull();
      expect(convertToNumeric(null)).toBeNull();
    });

    it('should handle percentage conversion for square_feet', () => {
      // 100 sq ft = ~9.29 sq m
      expect(convertToNumeric('100', 'square_feet')).toBeCloseTo(9.29, 1);
    });
  });
});