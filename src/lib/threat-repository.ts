import { query, getClient } from './database';
import { 
  ThreatDataPoint, 
  ThreatDataRow, 
  CreateThreatInput, 
  UpdateThreatInput, 
  GeographicBounds,
  ThreatFilters,
  Coordinates 
} from '@/types/threat';
import { validateCreateThreatInput, validateUpdateThreatInput, validateGeographicBounds } from './validation';

// Transform database row to domain object
function transformThreatRow(row: ThreatDataRow): ThreatDataPoint {
  // Handle PostgreSQL POINT type - comes as {x: longitude, y: latitude}
  let coordinates: Coordinates = { latitude: 0, longitude: 0 };
  
  if (row.coordinates && typeof row.coordinates === 'object') {
    coordinates = {
      latitude: (row.coordinates as any).y,
      longitude: (row.coordinates as any).x
    };
  }

  return {
    id: row.id,
    title: row.title,
    subhead: row.subhead || '',
    description: row.description,
    coordinates,
    threatType: row.threat_type,
    severity: row.severity,
    region: row.region || '',
    brands: row.brands || [],
    topics: row.topics || [],
    isQuantitative: row.is_quantitative,
    statisticalData: row.statistical_data || undefined,
    sources: row.sources || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    expirationDate: row.expiration_date || undefined,
    isActive: row.is_active,
  };
}

// Repository class for threat data operations
export class ThreatRepository {
  
  // Get threats with filters (no geographic bounds required)
  async getThreats(filters?: ThreatFilters): Promise<ThreatDataPoint[]> {
    let sql = 'SELECT * FROM threat_data WHERE is_active = true';
    const params: any[] = [];
    let paramIndex = 1;

    // Apply filters
    if (filters) {
      if (filters.threatTypes && filters.threatTypes.length > 0) {
        sql += ` AND threat_type = ANY($${paramIndex})`;
        params.push(filters.threatTypes);
        paramIndex++;
      }

      if (filters.regions && filters.regions.length > 0) {
        sql += ` AND region = ANY($${paramIndex})`;
        params.push(filters.regions);
        paramIndex++;
      }

      if (filters.brands && filters.brands.length > 0) {
        sql += ` AND brands && $${paramIndex}`;
        params.push(filters.brands);
        paramIndex++;
      }

      if (filters.topics && filters.topics.length > 0) {
        sql += ` AND topics && $${paramIndex}`;
        params.push(filters.topics);
        paramIndex++;
      }

      if (filters.severityMin !== undefined) {
        sql += ` AND severity >= $${paramIndex}`;
        params.push(filters.severityMin);
        paramIndex++;
      }

      if (filters.severityMax !== undefined) {
        sql += ` AND severity <= $${paramIndex}`;
        params.push(filters.severityMax);
        paramIndex++;
      }

      if (filters.isActive !== undefined) {
        sql += ` AND is_active = $${paramIndex}`;
        params.push(filters.isActive);
        paramIndex++;
      }
    }

    sql += ' ORDER BY severity DESC, created_at DESC LIMIT 1000'; // Reasonable limit

    const result = await query(sql, params);
    return result.rows.map(transformThreatRow);
  }

  // Get threats within geographic bounds
  async getThreatsInBounds(bounds: GeographicBounds, filters?: ThreatFilters): Promise<ThreatDataPoint[]> {
    validateGeographicBounds(bounds);

    let sql = `
      SELECT * FROM threat_data 
      WHERE is_active = true 
      AND coordinates[0] BETWEEN $1 AND $3
      AND coordinates[1] BETWEEN $2 AND $4
    `;
    
    const params: any[] = [bounds.west, bounds.south, bounds.east, bounds.north];
    let paramIndex = 5;

    // Apply filters
    if (filters) {
      if (filters.threatTypes && filters.threatTypes.length > 0) {
        sql += ` AND threat_type = ANY($${paramIndex})`;
        params.push(filters.threatTypes);
        paramIndex++;
      }

      if (filters.regions && filters.regions.length > 0) {
        sql += ` AND region = ANY($${paramIndex})`;
        params.push(filters.regions);
        paramIndex++;
      }

      if (filters.brands && filters.brands.length > 0) {
        sql += ` AND brands && $${paramIndex}`;
        params.push(filters.brands);
        paramIndex++;
      }

      if (filters.topics && filters.topics.length > 0) {
        sql += ` AND topics && $${paramIndex}`;
        params.push(filters.topics);
        paramIndex++;
      }

      if (filters.severityMin !== undefined) {
        sql += ` AND severity >= $${paramIndex}`;
        params.push(filters.severityMin);
        paramIndex++;
      }

      if (filters.severityMax !== undefined) {
        sql += ` AND severity <= $${paramIndex}`;
        params.push(filters.severityMax);
        paramIndex++;
      }
    }

    sql += ' ORDER BY severity DESC, created_at DESC';

    const result = await query(sql, params);
    return result.rows.map(transformThreatRow);
  }

  // Get threat by ID
  async getThreatById(id: string): Promise<ThreatDataPoint | null> {
    const result = await query(
      'SELECT * FROM threat_data WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return transformThreatRow(result.rows[0]);
  }

  // Create new threat
  async createThreat(input: CreateThreatInput): Promise<ThreatDataPoint> {
    validateCreateThreatInput(input);

    const sql = `
      INSERT INTO threat_data (
        title, subhead, description, coordinates, threat_type, severity,
        region, brands, topics, is_quantitative, statistical_data, sources, expiration_date
      ) VALUES (
        $1, $2, $3, POINT($4, $5), $6, $7, $8, $9, $10, $11, $12, $13, $14
      ) RETURNING *
    `;

    const params = [
      input.title,
      input.subhead || null,
      input.description,
      input.coordinates.longitude,
      input.coordinates.latitude,
      input.threatType,
      input.severity,
      input.region || null,
      input.brands || null,
      input.topics || null,
      input.isQuantitative || false,
      input.statisticalData ? JSON.stringify(input.statisticalData) : null,
      input.sources || null,
      input.expirationDate || null,
    ];

    const result = await query(sql, params);
    return transformThreatRow(result.rows[0]);
  }

  // Update existing threat
  async updateThreat(id: string, input: UpdateThreatInput): Promise<ThreatDataPoint | null> {
    validateUpdateThreatInput(input);

    // Build dynamic update query
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (input.title !== undefined) {
      updates.push(`title = $${paramIndex}`);
      params.push(input.title);
      paramIndex++;
    }

    if (input.subhead !== undefined) {
      updates.push(`subhead = $${paramIndex}`);
      params.push(input.subhead);
      paramIndex++;
    }

    if (input.description !== undefined) {
      updates.push(`description = $${paramIndex}`);
      params.push(input.description);
      paramIndex++;
    }

    if (input.coordinates !== undefined) {
      updates.push(`coordinates = POINT($${paramIndex}, $${paramIndex + 1})`);
      params.push(input.coordinates.longitude, input.coordinates.latitude);
      paramIndex += 2;
    }

    if (input.threatType !== undefined) {
      updates.push(`threat_type = $${paramIndex}`);
      params.push(input.threatType);
      paramIndex++;
    }

    if (input.severity !== undefined) {
      updates.push(`severity = $${paramIndex}`);
      params.push(input.severity);
      paramIndex++;
    }

    if (input.region !== undefined) {
      updates.push(`region = $${paramIndex}`);
      params.push(input.region);
      paramIndex++;
    }

    if (input.brands !== undefined) {
      updates.push(`brands = $${paramIndex}`);
      params.push(input.brands);
      paramIndex++;
    }

    if (input.topics !== undefined) {
      updates.push(`topics = $${paramIndex}`);
      params.push(input.topics);
      paramIndex++;
    }

    if (input.isQuantitative !== undefined) {
      updates.push(`is_quantitative = $${paramIndex}`);
      params.push(input.isQuantitative);
      paramIndex++;
    }

    if (input.statisticalData !== undefined) {
      updates.push(`statistical_data = $${paramIndex}`);
      params.push(JSON.stringify(input.statisticalData));
      paramIndex++;
    }

    if (input.sources !== undefined) {
      updates.push(`sources = $${paramIndex}`);
      params.push(input.sources);
      paramIndex++;
    }

    if (input.expirationDate !== undefined) {
      updates.push(`expiration_date = $${paramIndex}`);
      params.push(input.expirationDate);
      paramIndex++;
    }

    if (input.isActive !== undefined) {
      updates.push(`is_active = $${paramIndex}`);
      params.push(input.isActive);
      paramIndex++;
    }

    if (updates.length === 0) {
      // No updates to make, return current record
      return this.getThreatById(id);
    }

    const sql = `
      UPDATE threat_data 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;
    params.push(id);

    const result = await query(sql, params);
    
    if (result.rows.length === 0) {
      return null;
    }

    return transformThreatRow(result.rows[0]);
  }

  // Delete threat (soft delete by setting is_active = false)
  async deleteThreat(id: string): Promise<boolean> {
    const result = await query(
      'UPDATE threat_data SET is_active = false WHERE id = $1 AND is_active = true',
      [id]
    );

    return result.rowCount > 0;
  }

  // Hard delete threat (permanent removal)
  async hardDeleteThreat(id: string): Promise<boolean> {
    const result = await query(
      'DELETE FROM threat_data WHERE id = $1',
      [id]
    );

    return result.rowCount > 0;
  }

  // Get all active threats
  async getAllActiveThreats(limit?: number, offset?: number): Promise<ThreatDataPoint[]> {
    let sql = 'SELECT * FROM threat_data WHERE is_active = true ORDER BY created_at DESC';
    const params: any[] = [];

    if (limit !== undefined) {
      sql += ` LIMIT $1`;
      params.push(limit);
      
      if (offset !== undefined) {
        sql += ` OFFSET $2`;
        params.push(offset);
      }
    }

    const result = await query(sql, params);
    return result.rows.map(transformThreatRow);
  }

  // Expire old threats (automated cleanup)
  async expireOldThreats(): Promise<number> {
    const result = await query('SELECT expire_old_threats()');
    return result.rows[0].expire_old_threats;
  }

  // Search threats by text
  async searchThreats(searchText: string, limit?: number): Promise<ThreatDataPoint[]> {
    const sql = `
      SELECT *, ts_rank(to_tsvector('english', title || ' ' || COALESCE(subhead, '') || ' ' || description), plainto_tsquery('english', $1)) as rank
      FROM threat_data 
      WHERE is_active = true 
      AND to_tsvector('english', title || ' ' || COALESCE(subhead, '') || ' ' || description) @@ plainto_tsquery('english', $1)
      ORDER BY rank DESC, severity DESC
      ${limit ? `LIMIT $2` : ''}
    `;

    const params = limit ? [searchText, limit] : [searchText];
    const result = await query(sql, params);
    return result.rows.map(transformThreatRow);
  }
}

// Export singleton instance
export const threatRepository = new ThreatRepository();