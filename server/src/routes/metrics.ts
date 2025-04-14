import express, { Request, Response, NextFunction } from 'express';
import { client } from '../config/clickhouse';

const router = express.Router();

interface MetricRequest {
  name: string;
  value: number;
  tags?: Record<string, any>;
  timestamp?: string | number | Date;
}

// Define the structure of a row returned by the raw metrics query
interface MetricRow {
  timestamp: string; // ClickHouse DateTime often comes as string
  name: string;
  value: number;
  tags: string; // JSON string
}

// GET metrics
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, from, to } = req.query;
    
    // Basic validation
    if (!name) {
      return res.status(400).json({ error: 'Metric name is required' });
    }
    
    // Default time range (24 hours if not specified)
    const fromDate = from ? new Date(from as string) : new Date(Date.now() - 24 * 60 * 60 * 1000);
    const toDate = to ? new Date(to as string) : new Date();
    
    // Format dates for ClickHouse (YYYY-MM-DD HH:MM:SS)
    const formattedFromDate = fromDate.toISOString().slice(0, 19).replace('T', ' ');
    const formattedToDate = toDate.toISOString().slice(0, 19).replace('T', ' ');
    
    console.log(`Querying metrics from: ${formattedFromDate} to: ${formattedToDate}`);
    //[1] Querying metrics from: 2025-01-13 17:06:48 to: 2025-04-13 17:06:48
    //[1] GET /api/metrics?name=cpu_usage&from=2025-01-13T17:06:48.400Z&to=2025-04-13T17:06:48.400Z 200 21.538 ms - 109
    // Query for raw metrics data using direct SQL to avoid DateTime formatting issues
    const query = `
      SELECT 
        timestamp,
        name,
        value,
        tags
      FROM goatvision.metrics
      WHERE name = '${name}'
        AND timestamp >= toDateTime('${formattedFromDate}')
        AND timestamp <= toDateTime('${formattedToDate}')
      ORDER BY timestamp ASC
      LIMIT 1000
    `;
    console.log("Executing query:", query);
    
    const result = await client.query({
      query: query
    });

    // Process results
    // Use type assertion for the expected structure { data: MetricRow[] }
    const rows = await result.json<{ data: MetricRow[] }>();
    
    // Ensure rows.data is an array even if the result is empty
    const metricsArray = rows && Array.isArray(rows.data) ? rows.data : [];

    
    res.json({  
      metrics: metricsArray,
      query: {
        name,
        from: fromDate.toISOString(),
        to: toDate.toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    next(error);
  }
});

// Define the structure of a row returned by the aggregated metrics query
interface AggregatedMetricRow {
  timestamp: string;
  name: string;
  min: number;
  max: number;
  avg: number;
  sum: number;
  count: number; // Assuming count fits within standard number type
  tags: string;
}

// GET aggregated metrics (5-minute rollups)
// This is intentionally incomplete for interview task
router.get('/aggregated', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, from, to, tags } = req.query;
    
    // Basic validation
    if (!name) {
      return res.status(400).json({ error: 'Metric name is required' });
    }
    
    // Default time range (90 days if not specified)
    const fromDate = from ? new Date(from as string) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const toDate = to ? new Date(to as string) : new Date();
    
    // Format dates for ClickHouse (YYYY-MM-DD HH:MM:SS)
    const formattedFromDate = fromDate.toISOString().slice(0, 19).replace('T', ' ');
    const formattedToDate = toDate.toISOString().slice(0, 19).replace('T', ' ');
    
    console.log(`Querying aggregated metrics from: ${formattedFromDate} to: ${formattedToDate}`);
    
    // TODO: Implement filtering by tags
    // Currently this ignores the tags parameter
    
    // Query for aggregated data using direct SQL to avoid DateTime formatting issues
    const query = `
      SELECT 
        timestamp,
        name,
        min,
        max,
        avg,
        sum,
        count,
        tags
      FROM goatvision.metrics_5m
      WHERE name = '${name}'
        AND timestamp >= toDateTime('${formattedFromDate}')
        AND timestamp <= toDateTime('${formattedToDate}')
      ORDER BY timestamp ASC
    `;
    
    const result = await client.query({
      query: query
    });

    // Process results
    // Use type assertion for the expected structure { data: AggregatedMetricRow[] }
    const rows = await result.json<{ data: AggregatedMetricRow[] }>();
    
    // Ensure rows.data is an array even if the result is empty
    const metricsArray = rows && Array.isArray(rows.data) ? rows.data : [];
    
    res.json({
      metrics: metricsArray,
      query: {
        name,
        from: fromDate.toISOString(),
        to: toDate.toISOString(),
        tags: tags || null
      }
    });
  } catch (error) {
    console.error('Error fetching aggregated metrics:', error);
    next(error);
  }
});

// POST a new metric
router.post('/', async (req: Request<{}, {}, MetricRequest>, res: Response, next: NextFunction) => {
  try {
    const { name, value, tags = {}, timestamp: requestTimestamp } = req.body;
    
    // Basic validation
    if (!name || value === undefined) {
      return res.status(400).json({ error: 'Metric name and value are required' });
    }
    
    // Determine timestamp: use provided one if valid, otherwise use current time
    let timestamp = new Date();
    if (requestTimestamp) {
      const parsedTimestamp = new Date(requestTimestamp);
      // Check if the parsed date is valid
      if (!isNaN(parsedTimestamp.getTime())) {
        timestamp = parsedTimestamp;
      } else {
        console.warn(`Received invalid timestamp format: ${requestTimestamp}. Using current time.`);
        // Optionally return a 400 error here if strict timestamp validation is required
        // return res.status(400).json({ error: 'Invalid timestamp format provided' });
      }
    }

    const formattedTimestamp = timestamp.toISOString().slice(0, 19).replace('T', ' ');
    const tagsJson = JSON.stringify(tags);
    
    // Insert using the VALUES format with proper escaping
    const query = `
      INSERT INTO goatvision.metrics (timestamp, name, value, tags)
      VALUES ('${formattedTimestamp}', '${name}', ${Number(value)}, '${tagsJson.replace(/'/g, "''")}')
    `;
    
    // Execute the direct query
    await client.command({
      query: query.trim()
    });
    
    res.status(201).json({
      status: 'success',
      message: 'Metric recorded successfully',
      metric: {
        timestamp,
        name,
        value,
        tags
      }
    });
  } catch (error) {
    console.error('Error saving metric:', error);
    next(error);
  }
});

// TODO: Interview task - Implement 5-minute rollup aggregation
// This endpoint should be implemented by the candidate
// It should aggregate raw metrics into the metrics_5m table
router.post('/aggregate-rollups', async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.status(501).json({
      status: 'not_implemented',
      message: 'This feature needs to be implemented'
    });
  } catch (error) {
    next(error);
  }
});

export default router; 