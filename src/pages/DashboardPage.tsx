import React, { useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { AuthContext } from '../App';
import Navbar from '../components/Navbar';
import Chart from '../components/Chart';
import DateRangePicker from '../components/DateRangePicker';
import '../styles/DashboardPage.css';

interface DateRange {
  startDate: Date;
  endDate: Date;
}

interface MetricData {
  timestamp: string;
  name: string;
  value: number;
  tags: string; // JSON string
}

interface ChartData {
  xAxis: string[];
  series: Array<{
    name: string;
    data: number[];
  }>;
}

const DashboardPage: React.FC = () => {
  const { user, logout } = useContext(AuthContext);
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
    endDate: new Date(),
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [metricsData, setMetricsData] = useState<Record<string, ChartData>>({});
  
  // Fallback data for when API data is not available
  const getFallbackData = (): ChartData => {
    const timestamps = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (30 - i));
      return date.toISOString().split('T')[0];
    });
    
    return {
      xAxis: timestamps,
      series: [{
        name: 'No Data',
        data: Array(30).fill(0)
      }]
    };
  };
  
  // Fetch metrics data from the API
  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch data for each metric type
        const metricTypes = ['cpu_usage', 'memory_usage', 'network_in', 'network_out', 'disk_read', 'disk_write'];
        const results: Record<string, ChartData> = {};
        
        for (const metricType of metricTypes) {
          const response = await axios.get(`http://127.0.0.1:3001/api/metrics`, {
            params: {
              name: metricType,
              from: dateRange.startDate.toISOString(),
              to: dateRange.endDate.toISOString()
            },
            withCredentials: true
          });
          
          if (response.data && Array.isArray(response.data.metrics) && response.data.metrics.length > 0) {
            try {
              // Transform API data to chart format
              const timestamps = response.data.metrics.map((m: MetricData) => 
                new Date(m.timestamp).toISOString().split('T')[0]
              ) as string[];
              
              // Remove duplicates and sort timestamps
              const uniqueTimestamps = [...new Set(timestamps)].sort();
              
              // Create data series
              results[metricType] = {
                xAxis: uniqueTimestamps,
                series: [{
                  name: metricType,
                  data: response.data.metrics.map((m: MetricData) => m.value)
                }]
              };
            } catch (error) {
              console.warn(`Error processing ${metricType} data:`, error);
              // Use fallback data for this metric type
              results[metricType] = getFallbackData();
            }
          } else {
            console.log(`No data for ${metricType} or invalid response format`, response.data);
            // Use fallback data for this metric type
            results[metricType] = getFallbackData();
          }
        }
        
        setMetricsData(results);
      } catch (err) {
        console.error('Error fetching metrics:', err);
        setError('Failed to fetch metrics data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchMetrics();
  }, [dateRange]);
  
  // Handle date range change
  const handleDateRangeChange = (newRange: DateRange) => {
    setDateRange(newRange);
    // The useEffect will trigger a data refresh
  };
  
  return (
    <div className="dashboard-container">
      <Navbar user={user} onLogout={logout} />
      
      <div className="dashboard-header">
        <h1>Metrics Dashboard</h1>
        <DateRangePicker 
          startDate={dateRange.startDate}
          endDate={dateRange.endDate}
          onDateRangeChange={handleDateRangeChange}
        />
      </div>
      
      {error && <div className="error-message">{error}</div>}
      {loading && <div className="loading-message">Loading metrics data...</div>}
      
      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h2>CPU Usage</h2>
          <Chart 
            type="line"
            data={metricsData['cpu_usage'] || getFallbackData()}
          />
        </div>
        
        <div className="dashboard-card">
          <h2>Memory Usage</h2>
          <Chart 
            type="line"
            data={metricsData['memory_usage'] || getFallbackData()}
          />
        </div>
        
        <div className="dashboard-card">
          <h2>Network Traffic</h2>
          <Chart 
            type="line"
            data={{
              xAxis: metricsData['network_in']?.xAxis || getFallbackData().xAxis,
              series: [
                metricsData['network_in']?.series?.[0] || { name: 'Network In', data: [] },
                metricsData['network_out']?.series?.[0] || { name: 'Network Out', data: [] }
              ]
            }}
          />
        </div>
        
        <div className="dashboard-card">
          <h2>Disk I/O</h2>
          <Chart 
            type="line"
            data={{
              xAxis: metricsData['disk_read']?.xAxis || getFallbackData().xAxis,
              series: [
                metricsData['disk_read']?.series?.[0] || { name: 'Disk Read', data: [] },
                metricsData['disk_write']?.series?.[0] || { name: 'Disk Write', data: [] }
              ]
            }}
          />
        </div>
      </div>
      
      <div className="dashboard-footer">
        <p>GoatVision Monitoring - {new Date().getFullYear()}</p>
      </div>
    </div>
  );
};

export default DashboardPage; 