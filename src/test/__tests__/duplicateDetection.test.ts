import { describe, it, expect, beforeEach } from 'vitest';
import { DuplicateDetectionService, DEFAULT_CONFIG } from '@/lib/duplicateDetection';

describe('DuplicateDetectionService', () => {
  let service: DuplicateDetectionService;

  beforeEach(() => {
    service = new DuplicateDetectionService(DEFAULT_CONFIG);
  });

  describe('calculateTitleSimilarity', () => {
    it('should return 100 for identical titles', () => {
      const result = service['calculateTitleSimilarity']('Beautiful Apartment', 'Beautiful Apartment');
      expect(result).toBe(100);
    });

    it('should return high score for similar titles', () => {
      const result = service['calculateTitleSimilarity']('Beautiful Apartment', 'Beautiful Apt');
      expect(result).toBeGreaterThan(70);
    });

    it('should return 0 for completely different titles', () => {
      const result = service['calculateTitleSimilarity']('Beautiful Apartment', 'Ugly House');
      expect(result).toBeLessThan(50);
    });

    it('should handle empty titles', () => {
      const result = service['calculateTitleSimilarity']('', 'Beautiful Apartment');
      expect(result).toBe(0);
    });
  });

  describe('calculateAddressMatch', () => {
    it('should return 100 for identical addresses', () => {
      const prop1 = {
        title: 'Test',
        street_name: 'Main Street',
        street_number: '123',
        zip_code: '12345',
        city: 'Berlin'
      };
      const prop2 = { ...prop1 };
      
      const result = service['calculateAddressMatch'](prop1, prop2);
      expect(result).toBe(100);
    });

    it('should give partial scores for partial matches', () => {
      const prop1 = {
        title: 'Test',
        street_name: 'Main Street',
        zip_code: '12345',
        city: 'Berlin'
      };
      const prop2 = {
        title: 'Test',
        street_name: 'Different Street',
        zip_code: '12345',
        city: 'Berlin'
      };
      
      const result = service['calculateAddressMatch'](prop1, prop2);
      expect(result).toBe(70); // zip (40) + city (30) = 70
    });
  });

  describe('calculatePriceMatch', () => {
    it('should return 100 for prices within tolerance', () => {
      const result = service['calculatePriceMatch'](1000, 1020); // 2% difference, within 5% tolerance
      expect(result).toBe(100);
    });

    it('should return lower score for prices outside tolerance', () => {
      const result = service['calculatePriceMatch'](1000, 1200); // 20% difference
      expect(result).toBeLessThan(100);
      expect(result).toBeGreaterThan(0);
    });

    it('should return 0 for missing prices', () => {
      const result = service['calculatePriceMatch'](undefined, 1000);
      expect(result).toBe(0);
    });
  });

  describe('calculateDistance', () => {
    it('should calculate distance between Berlin and Munich correctly', () => {
      // Approximate coordinates: Berlin (52.5200, 13.4050), Munich (48.1351, 11.5820)
      const distance = service['calculateDistance'](52.5200, 13.4050, 48.1351, 11.5820);
      expect(distance).toBeGreaterThan(500000); // ~500km+
      expect(distance).toBeLessThan(600000); // ~600km-
    });

    it('should return 0 for identical coordinates', () => {
      const distance = service['calculateDistance'](52.5200, 13.4050, 52.5200, 13.4050);
      expect(distance).toBe(0);
    });
  });

  describe('config management', () => {
    it('should update config correctly', () => {
      const newConfig = { duplicateThreshold: 90 };
      service.updateConfig(newConfig);
      
      const config = service.getConfig();
      expect(config.duplicateThreshold).toBe(90);
      expect(config.titleWeight).toBe(DEFAULT_CONFIG.titleWeight); // Other values should remain
    });

    it('should return config copy to prevent external mutation', () => {
      const config1 = service.getConfig();
      const config2 = service.getConfig();
      
      config1.duplicateThreshold = 999;
      expect(config2.duplicateThreshold).toBe(DEFAULT_CONFIG.duplicateThreshold);
    });
  });
});