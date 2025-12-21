import OpenAI from 'openai';
import { ProcessedQuery, ThreatFilters, ThreatType, Coordinates } from '@/types/threat';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Cache for query results
const queryCache = new Map<string, { result: ProcessedQuery; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export class QueryProcessor {
  /**
   * Process natural language query and extract geographic and topical intent
   */
  static async processQuery(
    query: string,
    context?: {
      currentView: { lat: number; lng: number; zoom: number };
      activeFilters?: ThreatFilters;
    }
  ): Promise<ProcessedQuery> {
    // Check cache first
    const cacheKey = this.generateCacheKey(query, context);
    const cached = queryCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.result;
    }

    try {
      const processedQuery = await this.processWithOpenAI(query, context);
      
      // Cache the result
      queryCache.set(cacheKey, {
        result: processedQuery,
        timestamp: Date.now()
      });
      
      return processedQuery;
    } catch (error) {
      console.error('OpenAI processing failed, using fallback:', error);
      return this.fallbackProcessing(query, context);
    }
  }

  /**
   * Process query using OpenAI GPT-4
   */
  private static async processWithOpenAI(
    query: string,
    context?: {
      currentView: { lat: number; lng: number; zoom: number };
      activeFilters?: ThreatFilters;
    }
  ): Promise<ProcessedQuery> {
    const systemPrompt = `You are a cybersecurity threat intelligence query processor. 
    Extract geographic and topical intent from user queries about cyber threats.
    
    Available threat types: vulnerability, scam, financial_risk, protection
    
    Return a JSON object with this structure:
    {
      "extractedIntent": {
        "geographic": {
          "locations": ["city/country names"],
          "coordinates": [{"latitude": number, "longitude": number}],
          "regions": ["region names"]
        },
        "topical": {
          "threatTypes": ["vulnerability", "scam", etc.],
          "brands": ["company/brand names"],
          "topics": ["topic keywords"]
        },
        "temporal": {
          "timeframe": "recent/historical/current",
          "urgency": "immediate/recent/historical"
        }
      },
      "suggestedFilters": {
        "regions": ["extracted regions"],
        "brands": ["extracted brands"],
        "topics": ["extracted topics"],
        "threatTypes": ["extracted threat types"]
      },
      "confidence": 0.8
    }`;

    const userPrompt = `Query: "${query}"
    ${context ? `Current context: viewing ${context.currentView.lat}, ${context.currentView.lng} at zoom ${context.currentView.zoom}` : ''}
    ${context?.activeFilters ? `Active filters: ${JSON.stringify(context.activeFilters)}` : ''}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 1000,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    try {
      const parsed = JSON.parse(response);
      return {
        originalQuery: query,
        extractedIntent: parsed.extractedIntent,
        suggestedFilters: parsed.suggestedFilters,
        confidence: parsed.confidence || 0.5
      };
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError);
      throw new Error('Invalid response format from OpenAI');
    }
  }

  /**
   * Fallback processing when OpenAI is unavailable
   */
  private static fallbackProcessing(
    query: string,
    context?: {
      currentView: { lat: number; lng: number; zoom: number };
      activeFilters?: ThreatFilters;
    }
  ): ProcessedQuery {
    const lowerQuery = query.toLowerCase();
    
    // Simple keyword matching for fallback
    const threatTypeKeywords = {
      vulnerability: ['vulnerability', 'vuln', 'exploit', 'cve', 'security hole'],
      scam: ['scam', 'fraud', 'phishing', 'fake', 'malicious'],
      financial_risk: ['financial', 'money', 'payment', 'banking', 'credit'],
      protection: ['protection', 'secure', 'safe', 'defended', 'protected']
    };

    const locationKeywords = [
      'usa', 'united states', 'america', 'china', 'russia', 'europe', 'asia',
      'africa', 'australia', 'canada', 'mexico', 'brazil', 'india', 'japan'
    ];

    const brandKeywords = [
      'microsoft', 'apple', 'google', 'amazon', 'facebook', 'meta', 'twitter',
      'tesla', 'nvidia', 'intel', 'cisco', 'oracle', 'salesforce'
    ];

    // Extract threat types
    const threatTypes: ThreatType[] = [];
    for (const [type, keywords] of Object.entries(threatTypeKeywords)) {
      if (keywords.some(keyword => lowerQuery.includes(keyword))) {
        threatTypes.push(type as ThreatType);
      }
    }

    // Extract locations
    const locations = locationKeywords.filter(location => 
      lowerQuery.includes(location)
    );

    // Extract brands
    const brands = brandKeywords.filter(brand => 
      lowerQuery.includes(brand)
    );

    // Extract topics (simple keyword extraction)
    const topics = lowerQuery.split(' ').filter(word => 
      word.length > 3 && !['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use'].includes(word)
    );

    return {
      originalQuery: query,
      extractedIntent: {
        geographic: {
          locations,
          coordinates: [],
          regions: locations
        },
        topical: {
          threatTypes,
          brands,
          topics: topics.slice(0, 5) // Limit to 5 topics
        },
        temporal: {
          timeframe: lowerQuery.includes('recent') ? 'recent' : 
                   lowerQuery.includes('historical') ? 'historical' : 'current',
          urgency: lowerQuery.includes('urgent') || lowerQuery.includes('immediate') ? 'immediate' :
                  lowerQuery.includes('recent') ? 'recent' : 'historical'
        }
      },
      suggestedFilters: {
        regions: locations,
        brands,
        topics: topics.slice(0, 5),
        threatTypes
      },
      confidence: 0.3 // Lower confidence for fallback
    };
  }

  /**
   * Generate cache key for query and context
   */
  private static generateCacheKey(
    query: string,
    context?: {
      currentView: { lat: number; lng: number; zoom: number };
      activeFilters?: ThreatFilters;
    }
  ): string {
    const contextStr = context ? JSON.stringify(context) : '';
    return `${query}:${contextStr}`;
  }

  /**
   * Clear expired cache entries
   */
  static clearExpiredCache(): void {
    const now = Date.now();
    const entries = Array.from(queryCache.entries());
    for (const [key, value] of entries) {
      if (now - value.timestamp >= CACHE_DURATION) {
        queryCache.delete(key);
      }
    }
  }
}