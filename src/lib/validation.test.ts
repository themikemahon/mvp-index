import { describe, it, expect } from 'vitest';
import {
  validateCoordinates,
  validateSeverity,
  validateThreatType,
  validateRequiredString,
  validateCreateThreatInput,
  validateGeographicBounds,
  ValidationError,
} from './validation';
import { CreateThreatInput } from '@/types/threat';

describe('Validation Functions', () => {
  describe('validateCoordinates', () => {
    it('should accept valid coordinates', () => {
      expect(() => validateCoordinates({ latitude: 40.7128, longitude: -74.0060 })).not.toThrow();
      expect(() => validateCoordinates({ latitude: 0, longitude: 0 })).not.toThrow();
      expect(() => validateCoordinates({ latitude: 90, longitude: 180 })).not.toThrow();
      expect(() => validateCoordinates({ latitude: -90, longitude: -180 })).not.toThrow();
    });

    it('should reject invalid latitude', () => {
      expect(() => validateCoordinates({ latitude: 91, longitude: 0 })).toThrow(ValidationError);
      expect(() => validateCoordinates({ latitude: -91, longitude: 0 })).toThrow(ValidationError);
    });

    it('should reject invalid longitude', () => {
      expect(() => validateCoordinates({ latitude: 0, longitude: 181 })).toThrow(ValidationError);
      expect(() => validateCoordinates({ latitude: 0, longitude: -181 })).toThrow(ValidationError);
    });

    it('should reject non-numeric coordinates', () => {
      expect(() => validateCoordinates({ latitude: 'invalid' as any, longitude: 0 })).toThrow(ValidationError);
      expect(() => validateCoordinates({ latitude: 0, longitude: 'invalid' as any })).toThrow(ValidationError);
    });
  });

  describe('validateSeverity', () => {
    it('should accept valid severity levels', () => {
      for (let i = 1; i <= 10; i++) {
        expect(() => validateSeverity(i)).not.toThrow();
      }
    });

    it('should reject invalid severity levels', () => {
      expect(() => validateSeverity(0)).toThrow(ValidationError);
      expect(() => validateSeverity(11)).toThrow(ValidationError);
      expect(() => validateSeverity(1.5)).toThrow(ValidationError);
      expect(() => validateSeverity('5' as any)).toThrow(ValidationError);
    });
  });

  describe('validateThreatType', () => {
    it('should accept valid threat types', () => {
      expect(validateThreatType('vulnerability')).toBe('vulnerability');
      expect(validateThreatType('scam')).toBe('scam');
      expect(validateThreatType('financial_risk')).toBe('financial_risk');
      expect(validateThreatType('protection')).toBe('protection');
    });

    it('should reject invalid threat types', () => {
      expect(() => validateThreatType('invalid')).toThrow(ValidationError);
      expect(() => validateThreatType('')).toThrow(ValidationError);
    });
  });

  describe('validateRequiredString', () => {
    it('should accept valid strings', () => {
      expect(() => validateRequiredString('valid string', 'field')).not.toThrow();
      expect(() => validateRequiredString('a', 'field', 10)).not.toThrow();
    });

    it('should reject empty or invalid strings', () => {
      expect(() => validateRequiredString('', 'field')).toThrow(ValidationError);
      expect(() => validateRequiredString('   ', 'field')).toThrow(ValidationError);
      expect(() => validateRequiredString(null as any, 'field')).toThrow(ValidationError);
    });

    it('should enforce max length', () => {
      expect(() => validateRequiredString('too long', 'field', 5)).toThrow(ValidationError);
    });
  });

  describe('validateCreateThreatInput', () => {
    const validInput: CreateThreatInput = {
      title: 'Test Threat',
      description: 'Test description',
      coordinates: { latitude: 40.7128, longitude: -74.0060 },
      threatType: 'vulnerability',
      severity: 5,
    };

    it('should accept valid input', () => {
      expect(() => validateCreateThreatInput(validInput)).not.toThrow();
    });

    it('should reject missing required fields', () => {
      expect(() => validateCreateThreatInput({ ...validInput, title: '' })).toThrow(ValidationError);
      expect(() => validateCreateThreatInput({ ...validInput, description: '' })).toThrow(ValidationError);
    });

    it('should validate statistical data when isQuantitative is true', () => {
      const inputWithStats = {
        ...validInput,
        isQuantitative: true,
        statisticalData: {
          value: 100,
          unit: 'count',
          context: 'test context',
        },
      };
      expect(() => validateCreateThreatInput(inputWithStats)).not.toThrow();

      // Should fail when isQuantitative is true but no statistical data
      expect(() => validateCreateThreatInput({ ...validInput, isQuantitative: true })).toThrow(ValidationError);
    });

    it('should validate expiration date is in the future', () => {
      const pastDate = new Date(Date.now() - 86400000); // Yesterday
      expect(() => validateCreateThreatInput({ ...validInput, expirationDate: pastDate })).toThrow(ValidationError);

      const futureDate = new Date(Date.now() + 86400000); // Tomorrow
      expect(() => validateCreateThreatInput({ ...validInput, expirationDate: futureDate })).not.toThrow();
    });
  });

  describe('validateGeographicBounds', () => {
    it('should accept valid bounds', () => {
      const bounds = { north: 45, south: 40, east: -70, west: -75 };
      expect(() => validateGeographicBounds(bounds)).not.toThrow();
    });

    it('should reject invalid bounds', () => {
      // North <= South
      expect(() => validateGeographicBounds({ north: 40, south: 45, east: -70, west: -75 })).toThrow(ValidationError);
      
      // East <= West
      expect(() => validateGeographicBounds({ north: 45, south: 40, east: -75, west: -70 })).toThrow(ValidationError);
      
      // Out of range coordinates
      expect(() => validateGeographicBounds({ north: 95, south: 40, east: -70, west: -75 })).toThrow(ValidationError);
      expect(() => validateGeographicBounds({ north: 45, south: -95, east: -70, west: -75 })).toThrow(ValidationError);
    });
  });
});