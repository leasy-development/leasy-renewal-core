import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mediaUploader } from '@/lib/mediaUploader';

describe('MediaUploader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('extractMediaUrls', () => {
    it('should extract photo URLs from CSV data', () => {
      const rowData = {
        title: 'Test Property',
        photo_urls: 'https://example.com/photo1.jpg,https://example.com/photo2.png',
        description: 'A nice place'
      };

      const result = mediaUploader.extractMediaUrls(rowData);
      
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        url: 'https://example.com/photo1.jpg',
        type: 'photo'
      });
      expect(result[1]).toEqual({
        url: 'https://example.com/photo2.png',
        type: 'photo'
      });
    });

    it('should extract floorplan URLs correctly', () => {
      const rowData = {
        title: 'Test Property',
        floorplan_urls: 'https://example.com/floorplan.pdf'
      };

      const result = mediaUploader.extractMediaUrls(rowData);
      
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        url: 'https://example.com/floorplan.pdf',
        type: 'floorplan'
      });
    });

    it('should handle semicolon-separated URLs', () => {
      const rowData = {
        images: 'https://example.com/1.jpg;https://example.com/2.jpg'
      };

      const result = mediaUploader.extractMediaUrls(rowData);
      expect(result).toHaveLength(2);
    });

    it('should filter out invalid URLs', () => {
      const rowData = {
        photo_urls: 'https://example.com/valid.jpg,invalid-url,https://example.com/also-valid.png'
      };

      const result = mediaUploader.extractMediaUrls(rowData);
      expect(result).toHaveLength(2);
    });

    it('should return empty array for no media URLs', () => {
      const rowData = {
        title: 'Test Property',
        description: 'No media here'
      };

      const result = mediaUploader.extractMediaUrls(rowData);
      expect(result).toHaveLength(0);
    });
  });

  describe('isValidUrl', () => {
    it('should validate correct image URLs', () => {
      const validUrls = [
        'https://example.com/image.jpg',
        'http://example.com/image.png',
        'https://example.com/image.gif?param=value',
        'https://example.com/floorplan.pdf'
      ];

      validUrls.forEach(url => {
        expect(mediaUploader['isValidUrl'](url)).toBe(true);
      });
    });

    it('should reject invalid URLs', () => {
      const invalidUrls = [
        'not-a-url',
        'ftp://example.com/image.jpg',
        'https://example.com/document.txt',
        'https://example.com/video.mp4',
        ''
      ];

      invalidUrls.forEach(url => {
        expect(mediaUploader['isValidUrl'](url)).toBe(false);
      });
    });
  });

  describe('generateFileName', () => {
    it('should generate unique filenames', () => {
      const url = 'https://example.com/path/image.jpg';
      
      const name1 = mediaUploader['generateFileName'](url, 'photo', 0);
      const name2 = mediaUploader['generateFileName'](url, 'photo', 0);
      
      expect(name1).not.toBe(name2);
      expect(name1).toMatch(/^photo_image_0_\d+_\d+\.jpg$/);
    });

    it('should handle URLs without extensions', () => {
      const url = 'https://example.com/image';
      
      const filename = mediaUploader['generateFileName'](url, 'photo', 0);
      expect(filename).toMatch(/^photo_image_0_\d+_\d+\.jpg$/);
    });

    it('should include media type and index', () => {
      const url = 'https://example.com/floorplan.pdf';
      
      const filename = mediaUploader['generateFileName'](url, 'floorplan', 5);
      expect(filename).toContain('floorplan_');
      expect(filename).toContain('_5_');
      expect(filename.endsWith('.pdf')).toBe(true);
    });
  });

  describe('parseMultipleUrls', () => {
    it('should parse comma-separated URLs', () => {
      const input = 'https://example.com/1.jpg, https://example.com/2.jpg';
      const result = mediaUploader['parseMultipleUrls'](input);
      
      expect(result).toHaveLength(2);
      expect(result[0]).toBe('https://example.com/1.jpg');
      expect(result[1]).toBe('https://example.com/2.jpg');
    });

    it('should parse semicolon-separated URLs', () => {
      const input = 'https://example.com/1.jpg;https://example.com/2.jpg';
      const result = mediaUploader['parseMultipleUrls'](input);
      
      expect(result).toHaveLength(2);
    });

    it('should filter out invalid URLs', () => {
      const input = 'https://example.com/valid.jpg,invalid,https://example.com/valid2.jpg';
      const result = mediaUploader['parseMultipleUrls'](input);
      
      expect(result).toHaveLength(2);
      expect(result).not.toContain('invalid');
    });
  });
});