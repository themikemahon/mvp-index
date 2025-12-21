import { Coordinates, CreateThreatInput, UpdateThreatInput, ThreatType } from '@/types/threat';

// Validation error class
export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Coordinate validation
export function validateCoordinates(coordinates: Coordinates): void {
  if (typeof coordinates.latitude !== 'number' || typeof coordinates.longitude !== 'number') {
    throw new ValidationError('Coordinates must be numbers', 'coordinates');
  }

  if (coordinates.latitude < -90 || coordinates.latitude > 90) {
    throw new ValidationError('Latitude must be between -90 and 90 degrees', 'coordinates.latitude');
  }

  if (coordinates.longitude < -180 || coordinates.longitude > 180) {
    throw new ValidationError('Longitude must be between -180 and 180 degrees', 'coordinates.longitude');
  }
}

// Severity validation
export function validateSeverity(severity: number): void {
  if (typeof severity !== 'number' || !Number.isInteger(severity)) {
    throw new ValidationError('Severity must be an integer', 'severity');
  }

  if (severity < 1 || severity > 10) {
    throw new ValidationError('Severity must be between 1 and 10', 'severity');
  }
}

// Threat type validation
export function validateThreatType(threatType: string): ThreatType {
  const validTypes: ThreatType[] = ['vulnerability', 'scam', 'financial_risk', 'protection'];
  
  if (!validTypes.includes(threatType as ThreatType)) {
    throw new ValidationError(`Threat type must be one of: ${validTypes.join(', ')}`, 'threatType');
  }

  return threatType as ThreatType;
}

// String validation helpers
export function validateRequiredString(value: string, fieldName: string, maxLength?: number): void {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new ValidationError(`${fieldName} is required and must be a non-empty string`, fieldName);
  }

  if (maxLength && value.length > maxLength) {
    throw new ValidationError(`${fieldName} must not exceed ${maxLength} characters`, fieldName);
  }
}

export function validateOptionalString(value: string | undefined, fieldName: string, maxLength?: number): void {
  if (value !== undefined) {
    if (typeof value !== 'string') {
      throw new ValidationError(`${fieldName} must be a string`, fieldName);
    }

    if (maxLength && value.length > maxLength) {
      throw new ValidationError(`${fieldName} must not exceed ${maxLength} characters`, fieldName);
    }
  }
}

// Array validation
export function validateStringArray(value: string[] | undefined, fieldName: string): void {
  if (value !== undefined) {
    if (!Array.isArray(value)) {
      throw new ValidationError(`${fieldName} must be an array`, fieldName);
    }

    for (let i = 0; i < value.length; i++) {
      if (typeof value[i] !== 'string') {
        throw new ValidationError(`All items in ${fieldName} must be strings`, `${fieldName}[${i}]`);
      }
    }
  }
}

// Date validation
export function validateOptionalDate(value: Date | undefined, fieldName: string): void {
  if (value !== undefined) {
    if (!(value instanceof Date) || isNaN(value.getTime())) {
      throw new ValidationError(`${fieldName} must be a valid date`, fieldName);
    }
  }
}

// Main validation functions
export function validateCreateThreatInput(input: CreateThreatInput): void {
  // Required fields
  validateRequiredString(input.title, 'title', 255);
  validateRequiredString(input.description, 'description');
  validateCoordinates(input.coordinates);
  validateThreatType(input.threatType);
  validateSeverity(input.severity);

  // Optional fields
  validateOptionalString(input.subhead, 'subhead', 500);
  validateOptionalString(input.region, 'region', 100);
  validateStringArray(input.brands, 'brands');
  validateStringArray(input.topics, 'topics');
  validateStringArray(input.sources, 'sources');
  validateOptionalDate(input.expirationDate, 'expirationDate');

  // Statistical data validation
  if (input.statisticalData) {
    if (typeof input.statisticalData.value !== 'number') {
      throw new ValidationError('Statistical data value must be a number', 'statisticalData.value');
    }
    validateRequiredString(input.statisticalData.unit, 'statisticalData.unit');
    validateRequiredString(input.statisticalData.context, 'statisticalData.context');
  }

  // Logical validations
  if (input.isQuantitative && !input.statisticalData) {
    throw new ValidationError('Statistical data is required when isQuantitative is true', 'statisticalData');
  }

  if (input.expirationDate && input.expirationDate <= new Date()) {
    throw new ValidationError('Expiration date must be in the future', 'expirationDate');
  }
}

export function validateUpdateThreatInput(input: UpdateThreatInput): void {
  // All fields are optional for updates, but if provided, must be valid
  if (input.title !== undefined) {
    validateRequiredString(input.title, 'title', 255);
  }

  if (input.description !== undefined) {
    validateRequiredString(input.description, 'description');
  }

  if (input.coordinates !== undefined) {
    validateCoordinates(input.coordinates);
  }

  if (input.threatType !== undefined) {
    validateThreatType(input.threatType);
  }

  if (input.severity !== undefined) {
    validateSeverity(input.severity);
  }

  validateOptionalString(input.subhead, 'subhead', 500);
  validateOptionalString(input.region, 'region', 100);
  validateStringArray(input.brands, 'brands');
  validateStringArray(input.topics, 'topics');
  validateStringArray(input.sources, 'sources');
  validateOptionalDate(input.expirationDate, 'expirationDate');

  // Statistical data validation
  if (input.statisticalData) {
    if (typeof input.statisticalData.value !== 'number') {
      throw new ValidationError('Statistical data value must be a number', 'statisticalData.value');
    }
    validateRequiredString(input.statisticalData.unit, 'statisticalData.unit');
    validateRequiredString(input.statisticalData.context, 'statisticalData.context');
  }

  // Logical validations
  if (input.expirationDate && input.expirationDate <= new Date()) {
    throw new ValidationError('Expiration date must be in the future', 'expirationDate');
  }
}

// Geographic bounds validation
export function validateGeographicBounds(bounds: { north: number; south: number; east: number; west: number }): void {
  if (bounds.north <= bounds.south) {
    throw new ValidationError('North bound must be greater than south bound', 'bounds');
  }

  if (bounds.east <= bounds.west) {
    throw new ValidationError('East bound must be greater than west bound', 'bounds');
  }

  if (bounds.north > 90 || bounds.south < -90) {
    throw new ValidationError('Latitude bounds must be between -90 and 90', 'bounds');
  }

  if (bounds.east > 180 || bounds.west < -180) {
    throw new ValidationError('Longitude bounds must be between -180 and 180', 'bounds');
  }
}