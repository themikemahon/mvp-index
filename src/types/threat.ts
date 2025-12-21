// Core threat data types based on design document

export type ThreatType = 'vulnerability' | 'scam' | 'financial_risk' | 'protection';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface StatisticalData {
  value: number;
  unit: string;
  context: string;
}

export interface ThreatDataPoint {
  id: string;
  title: string;
  subhead: string;
  description: string;
  coordinates: Coordinates;
  threatType: ThreatType;
  severity: number; // 1-10 scale
  region: string;
  brands: string[];
  topics: string[];
  isQuantitative: boolean;
  statisticalData?: StatisticalData;
  sources: string[];
  createdAt: Date;
  updatedAt: Date;
  expirationDate?: Date;
  isActive: boolean;
}

// Database row type (matches PostgreSQL schema)
export interface ThreatDataRow {
  id: string;
  title: string;
  subhead: string | null;
  description: string;
  coordinates: string; // PostGIS POINT as string
  threat_type: ThreatType;
  severity: number;
  region: string | null;
  brands: string[] | null;
  topics: string[] | null;
  is_quantitative: boolean;
  statistical_data: any; // JSONB
  sources: string[] | null;
  created_at: Date;
  updated_at: Date;
  expiration_date: Date | null;
  is_active: boolean;
}

// Input type for creating new threats
export interface CreateThreatInput {
  title: string;
  subhead?: string;
  description: string;
  coordinates: Coordinates;
  threatType: ThreatType;
  severity: number;
  region?: string;
  brands?: string[];
  topics?: string[];
  isQuantitative?: boolean;
  statisticalData?: StatisticalData;
  sources?: string[];
  expirationDate?: Date;
}

// Input type for updating threats
export interface UpdateThreatInput {
  title?: string;
  subhead?: string;
  description?: string;
  coordinates?: Coordinates;
  threatType?: ThreatType;
  severity?: number;
  region?: string;
  brands?: string[];
  topics?: string[];
  isQuantitative?: boolean;
  statisticalData?: StatisticalData;
  sources?: string[];
  expirationDate?: Date;
  isActive?: boolean;
}

// Geographic bounds for queries
export interface GeographicBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

// Cluster data for visualization
export interface ClusterData {
  id: string;
  centerCoordinates: Coordinates;
  threatCount: number;
  averageSeverity: number;
  dominantThreatType: ThreatType;
  zoomThreshold: number;
  boundingBox: GeographicBounds;
}

// Query filters
export interface ThreatFilters {
  regions?: string[];
  brands?: string[];
  topics?: string[];
  threatTypes?: ThreatType[];
  severityMin?: number;
  severityMax?: number;
  isActive?: boolean;
}

// Natural language query processing types
export interface ProcessedQuery {
  originalQuery: string;
  extractedIntent: {
    geographic: {
      locations: string[];
      coordinates?: Coordinates[];
      regions: string[];
    };
    topical: {
      threatTypes: ThreatType[];
      brands: string[];
      topics: string[];
    };
    temporal: {
      timeframe?: string;
      urgency?: 'immediate' | 'recent' | 'historical';
    };
  };
  suggestedFilters: ThreatFilters;
  confidence: number;
}

export interface QueryProcessingRequest {
  query: string;
  context?: {
    currentView: {
      lat: number;
      lng: number;
      zoom: number;
    };
    activeFilters?: ThreatFilters;
  };
}

export interface QueryProcessingResponse {
  processedQuery: ProcessedQuery;
  results: ThreatDataPoint[];
  totalCount: number;
  cached: boolean;
}