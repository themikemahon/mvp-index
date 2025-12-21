# Cyber Threat Globe API Documentation

## Overview

The Cyber Threat Globe API provides endpoints for managing and querying global cybersecurity threat intelligence data. The API supports geographic queries, filtering, search, and administrative operations.

## Base URL

```
http://localhost:3000/api
```

## Authentication

Currently, the API does not require authentication. Admin endpoints (`/api/admin/*`) should be protected in production environments.

## Endpoints

### Health Check

#### GET /api/health

Check the health status of the API and database connectivity.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-12-18T23:00:00.000Z",
  "database": {
    "connected": true,
    "server_time": "2024-12-18T23:00:00.000Z",
    "active_threats": 8
  },
  "version": "1.0.0"
}
```

### Threat Data Queries

#### GET /api/threats

Get threat data within geographic bounds with optional filters.

**Query Parameters:**
- `bounds` (required): Geographic bounds in format `lat1,lng1,lat2,lng2`
- `regions` (optional): Comma-separated list of regions to filter by
- `brands` (optional): Comma-separated list of brands to filter by
- `topics` (optional): Comma-separated list of topics to filter by
- `types` (optional): Comma-separated list of threat types (`vulnerability`, `scam`, `financial_risk`, `protection`)
- `severityMin` (optional): Minimum severity level (1-10)
- `severityMax` (optional): Maximum severity level (1-10)

**Example:**
```
GET /api/threats?bounds=45,-75,40,-70&types=vulnerability,scam&severityMin=5
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "title": "Critical Infrastructure Vulnerability",
      "subhead": "Power grid systems exposed to cyber attacks",
      "description": "Multiple power grid control systems...",
      "coordinates": {
        "latitude": 40.7128,
        "longitude": -74.0060
      },
      "threatType": "vulnerability",
      "severity": 9,
      "region": "North America",
      "brands": ["ConEd", "National Grid"],
      "topics": ["infrastructure", "power grid"],
      "isQuantitative": true,
      "statisticalData": {
        "affected_systems": 47,
        "potential_impact": "2.3 million customers",
        "cvss_score": 9.1
      },
      "sources": ["DHS-CISA", "Internal Research"],
      "createdAt": "2024-12-18T20:00:00.000Z",
      "updatedAt": "2024-12-18T20:00:00.000Z",
      "isActive": true
    }
  ],
  "count": 1,
  "bounds": {
    "north": 45,
    "south": 40,
    "east": -70,
    "west": -75
  },
  "filters": {
    "threatTypes": ["vulnerability", "scam"],
    "severityMin": 5
  }
}
```

#### GET /api/threats/[id]

Get a specific threat by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "title": "Critical Infrastructure Vulnerability",
    // ... full threat object
  }
}
```

#### GET /api/threats/search

Search threats by text query.

**Query Parameters:**
- `q` (required): Search query text
- `limit` (optional): Maximum number of results (1-1000, default: no limit)

**Example:**
```
GET /api/threats/search?q=banking malware&limit=10
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "456e7890-e89b-12d3-a456-426614174001",
      "title": "Banking Malware Campaign",
      // ... threat object
    }
  ],
  "count": 1,
  "query": "banking malware",
  "limit": 10
}
```

### Administrative Endpoints

#### POST /api/admin/threats

Create a new threat record.

**Request Body:**
```json
{
  "title": "New Threat Title",
  "subhead": "Optional subheading",
  "description": "Detailed threat description",
  "coordinates": {
    "latitude": 40.7128,
    "longitude": -74.0060
  },
  "threatType": "vulnerability",
  "severity": 8,
  "region": "North America",
  "brands": ["Brand1", "Brand2"],
  "topics": ["topic1", "topic2"],
  "isQuantitative": true,
  "statisticalData": {
    "value": 100,
    "unit": "affected systems",
    "context": "Critical infrastructure"
  },
  "sources": ["Source1", "Source2"],
  "expirationDate": "2024-12-31T23:59:59.000Z"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "789e0123-e89b-12d3-a456-426614174002",
    "title": "New Threat Title",
    // ... full created threat object
  },
  "message": "Threat created successfully"
}
```

#### GET /api/admin/threats

Get all active threats with pagination (admin view).

**Query Parameters:**
- `limit` (optional): Number of results per page (1-1000)
- `offset` (optional): Number of results to skip

**Response:**
```json
{
  "success": true,
  "data": [
    // ... array of threat objects
  ],
  "count": 25,
  "pagination": {
    "limit": 25,
    "offset": 0
  }
}
```

#### PUT /api/threats/[id]

Update an existing threat record.

**Request Body:** (all fields optional)
```json
{
  "title": "Updated Title",
  "severity": 9,
  "isActive": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    // ... updated threat object
  },
  "message": "Threat updated successfully"
}
```

#### DELETE /api/threats/[id]

Delete a threat record (soft delete by default).

**Query Parameters:**
- `hard` (optional): Set to `true` for permanent deletion

**Response:**
```json
{
  "success": true,
  "message": "Threat deactivated successfully"
}
```

#### POST /api/admin/threats/expire

Manually trigger expiration of old threats.

**Response:**
```json
{
  "success": true,
  "message": "Expired 3 old threats",
  "expiredCount": 3
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Error message describing what went wrong",
  "field": "fieldName" // Optional: specific field that caused validation error
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created (for POST requests)
- `400` - Bad Request (validation errors, malformed requests)
- `404` - Not Found (resource doesn't exist)
- `409` - Conflict (duplicate resource)
- `500` - Internal Server Error
- `503` - Service Unavailable (health check failure)

## Data Types

### ThreatType
- `vulnerability` - Security vulnerabilities and exploits
- `scam` - Fraudulent schemes and scams
- `financial_risk` - Financial threats and market risks
- `protection` - Security protections and defensive measures

### Coordinates
```json
{
  "latitude": number,  // -90 to 90
  "longitude": number  // -180 to 180
}
```

### StatisticalData
```json
{
  "value": number,
  "unit": string,
  "context": string
}
```

## Database Setup

Before using the API, initialize the database:

```bash
# Run migrations
npm run db:migrate

# Seed with sample data
npm run db:seed
```

## Development

Start the development server:

```bash
npm run dev
```

Run tests:

```bash
npm test
```

The API will be available at `http://localhost:3000/api`.