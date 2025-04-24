import { createClient, ClickHouseClient } from '@clickhouse/client';

const client: ClickHouseClient = createClient({
  host: process.env.CLICKHOUSE_HOST || 'http://localhost:8123',
  username: process.env.CLICKHOUSE_USER || 'default',
  password: process.env.CLICKHOUSE_PASSWORD || 'default',
  database: process.env.CLICKHOUSE_DB || 'goatvision',
});

// Function to initialize database and create tables
async function initializeDatabase(): Promise<void> {
  try {
    // Create database if it doesn't exist
    await client.query({
      query: `CREATE DATABASE IF NOT EXISTS goatvision`,
    });

    // Create metrics table for raw data
    await client.query({
      query: `
        CREATE TABLE IF NOT EXISTS goatvision.metrics (
          timestamp DateTime,
          name String,
          value Float64,
          tags String,
          INDEX tags_index tags TYPE bloom_filter GRANULARITY 1
        ) ENGINE = MergeTree()
        PARTITION BY toYYYYMM(timestamp)
        ORDER BY (name, timestamp)
      `,
    });

    // Create 5-minute rollup table
    // You can use this but it's not gonna work how you think!
    // await client.query({
    //   query: `
    //     CREATE TABLE IF NOT EXISTS goatvision.metrics_5m (
    //       timestamp DateTime,
    //       name String,
    //       min Float64,
    //       max Float64,
    //       avg Float64,
    //       sum Float64,
    //       count UInt64,
    //       tags String,
    //       INDEX tags_index tags TYPE bloom_filter GRANULARITY 1
    //     ) ENGINE = MergeTree()
    //     PARTITION BY toYYYYMM(timestamp)
    //     ORDER BY (name, timestamp)
    //   `,
    // });

    console.log('ClickHouse database and tables initialized successfully');
  } catch (error) {
    console.error('Error initializing ClickHouse database:', error);
    throw error;
  }
}

export {
  client,
  initializeDatabase,
}; 