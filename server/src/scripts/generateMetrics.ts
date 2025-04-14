import axios from 'axios';
import dotenv from 'dotenv';
import { client } from '../config/clickhouse'; // Import ClickHouse client

dotenv.config();

// Configuration
const API_URL = process.env.API_URL || 'http://127.0.0.1:3001/api/metrics';
const SERVER_URL = (process.env.SERVER_URL || 'http://127.0.0.1:3001').replace(/\/$/, '');
const INTERVAL_MS = 5000; // Generate metrics every 5 seconds
const SERVICES = ['api-gateway', 'auth-service', 'user-service', 'payment-service', 'notification-service'];
const PODS = ['pod-1', 'pod-2', 'pod-3'];
const NAMESPACES = ['default', 'monitoring', 'application'];
const METRICS = [
  { name: 'cpu_usage', min: 0, max: 100 },
  { name: 'memory_usage', min: 100, max: 1024 },
  { name: 'network_in', min: 0, max: 1000 },
  { name: 'network_out', min: 0, max: 800 },
  { name: 'disk_read', min: 0, max: 500 },
  { name: 'disk_write', min: 0, max: 700 },
  { name: 'request_count', min: 0, max: 200 },
  { name: 'error_count', min: 0, max: 20 },
  { name: 'latency_ms', min: 5, max: 2000 }
];

// Helper to generate a random number within a range
const randomInRange = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Generate a random metric
const generateMetric = () => {
  const metricType = METRICS[randomInRange(0, METRICS.length - 1)];
  const service = SERVICES[randomInRange(0, SERVICES.length - 1)];
  const pod = PODS[randomInRange(0, PODS.length - 1)];
  const namespace = NAMESPACES[randomInRange(0, NAMESPACES.length - 1)];
  
  const value = randomInRange(metricType.min, metricType.max);
  
  return {
    name: metricType.name,
    value,
    tags: {
      service,
      pod,
      namespace,
      environment: 'development'
    }
  };
};

// Send a metric to the API
const sendMetric = async (metric: any) => {
  try {
    const response = await axios.post(API_URL, metric);
    console.log(`Sent metric: ${metric.name} = ${metric.value} for ${metric.tags.service}/${metric.tags.pod}`);
    return response.data;
  } catch (error) {
    console.error('Error sending metric:');
    return null;
  }
};

// Check if the server is available
const checkServerHealth = async (): Promise<boolean> => {
  try {
    console.log(`Sending health check request to ${SERVER_URL}/health...`);
    const response = await axios.get(`${SERVER_URL}/health`, {
      // Set a reasonable timeout
      timeout: 5000
    });
    console.log(`Health check response: ${response.status} ${JSON.stringify(response.data)}`);
    return response.status === 200;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(`Health check failed: ${error.message}`);
      if (error.response) {
        console.error(`Response status: ${error.response.status}`);
        console.error(`Response data: ${JSON.stringify(error.response.data)}`);
      } else if (error.request) {
        console.error('No response received');
      }
    } else {
      console.error(`Health check failed with unexpected error: ${error}`);
    }
    return false;
  }
};

// Wait for server to be available with exponential backoff
const waitForServer = async (maxRetries = 10, initialDelay = 1000): Promise<boolean> => {
  let retries = 0;
  let delay = initialDelay;
  
  while (retries < maxRetries) {
    console.log(`Checking server health (attempt ${retries + 1}/${maxRetries})...`);
    
    if (await checkServerHealth()) {
      console.log('Server is available!');
      return true;
    }
    
    console.log(`Server not available. Retrying in ${delay}ms...`);
    await new Promise(resolve => setTimeout(resolve, delay));
    
    retries++;
    delay = Math.min(delay * 2, 30000); // Exponential backoff, max 30 seconds
  }
  
  console.error(`Server not available after ${maxRetries} attempts. Giving up.`);
  return false;
};

// Main function to generate and send metrics continuously
const generateMetrics = async () => {
  console.log('Starting metrics generator...');
  console.log(`Will send metrics to: ${API_URL}`);
  
  // Wait for server to be available before starting
  const serverAvailable = await waitForServer();
  if (!serverAvailable) {
    console.error('Cannot connect to server. Exiting.');
    process.exit(1);
  }
  
  // Check if backfill is needed
  console.log('Checking if historical data backfill is needed...');
  let needsBackfill = false;
  try {
    const countResult = await client.query({ query: 'SELECT * FROM goatvision.metrics limit 1000' });
    const countData = await countResult.json<{ data: any[] }>();
    // Assuming the result structure is [{ data: [...] }]
    const count = countData?.data?.length || 0;

    if (count === 0) {
      console.log('Metrics table is empty. Proceeding with backfill.');
      needsBackfill = true;
    } else {
      console.log(`Metrics table already contains ${count} records. Skipping backfill.`);
    }
  } catch (error) {
    console.error('Error checking metric count in ClickHouse:', error);
    console.log('Assuming backfill is needed due to error.');
    needsBackfill = true; // Proceed with backfill if count check fails
  }

  if (needsBackfill) {
    console.log('Starting historical data backfill for the last 30 days...');
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const backfillIntervalMinutes = 15;
    const backfillIntervalMs = backfillIntervalMinutes * 60 * 1000;
    let backfillCount = 0;

    for (let currentTime = thirtyDaysAgo.getTime(); currentTime <= now.getTime(); currentTime += backfillIntervalMs) {
      const historicalTimestamp = new Date(currentTime);
      // Log progress periodically
      if (backfillCount % 100 === 0) {
        console.log(`Backfilling data point ${backfillCount}, timestamp: ${historicalTimestamp.toISOString()}`);
      }

      // Loop through each defined metric type for this historical timestamp
      for (const metricType of METRICS) {
        const service = SERVICES[randomInRange(0, SERVICES.length - 1)];
        const pod = PODS[randomInRange(0, PODS.length - 1)];
        const namespace = NAMESPACES[randomInRange(0, NAMESPACES.length - 1)];
        const value = randomInRange(metricType.min, metricType.max);
        
        // Construct the metric object with the historical timestamp
        const metric = {
          timestamp: historicalTimestamp.toISOString(), // Pass the historical timestamp
          name: metricType.name,
          value,
          tags: {
            service,
            pod,
            namespace,
            environment: 'development'
          }
        };
        await sendMetric(metric); // Send the historical metric
        backfillCount++;
      }
      // Optional: Add a small delay if needed to avoid overwhelming the server
      // await new Promise(resolve => setTimeout(resolve, 10)); 
    }

    console.log(`Historical data backfill complete. Sent ${backfillCount} total historical metrics.`);
  } // End of needsBackfill check

  console.log('Beginning to send live metrics...');
  
  // Send metrics at regular intervals (Live data)
  setInterval(async () => {
    // Loop through each defined metric type
    for (const metricType of METRICS) {
      const service = SERVICES[randomInRange(0, SERVICES.length - 1)];
      const pod = PODS[randomInRange(0, PODS.length - 1)];
      const namespace = NAMESPACES[randomInRange(0, NAMESPACES.length - 1)];
      
      const value = randomInRange(metricType.min, metricType.max);
      
      const metric = {
        name: metricType.name,
        value,
        tags: {
          service,
          pod,
          namespace,
          environment: 'development'
        }
      };
      await sendMetric(metric);
    }
  }, INTERVAL_MS);
};

// Start generating metrics
generateMetrics().catch(console.error);

// Handle process termination
process.on('SIGINT', () => {
  console.log('Stopping metrics generator...');
  process.exit(0);
}); 