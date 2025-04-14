import React, { useEffect, useRef, useMemo } from 'react';
// Import the core library
import * as echarts from 'echarts/core';

// Import charts, features and renderers
import {
    LineChart,
    LineSeriesOption // Import Series types
} from 'echarts/charts';
import {
    TitleComponent,
    TooltipComponent,
    GridComponent,
    ToolboxComponent,
    // Import Component types
    TitleComponentOption,
    TooltipComponentOption,
    GridComponentOption,
    ToolboxComponentOption
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { EChartsType } from 'echarts/core'; // Use EChartsType from core
import '../styles/Chart.css';

// Register the required components
echarts.use([
    TitleComponent,
    TooltipComponent,
    GridComponent,
    ToolboxComponent,
    LineChart,
    CanvasRenderer
]);

// Define a composed option type combining base options and component options
type ECOption = echarts.ComposeOption<
    | LineSeriesOption // Use imported Series Option
    // Add other series options (Bar, Pie) if needed
    | TitleComponentOption // Use imported Component Option
    | TooltipComponentOption // Use imported Component Option
    | GridComponentOption // Use imported Component Option
    | ToolboxComponentOption // Use imported Component Option
>;

// Final ChartProps: Expect arrays directly
interface ChartProps {
    type?: 'line' | 'bar' | 'pie';
    data: {
        xAxis?: string[]; // Expect array
        series?: Array<{
            name: string;
            data: number[]; // Expect array
        }>;
    };
    height?: string;
}

const Chart: React.FC<ChartProps> = ({ type = 'line', data, height = '300px' }) => {
    const chartRef = useRef<HTMLDivElement>(null);
    const chartInstanceRef = useRef<EChartsType | null>(null);

    // Map data.series to LineSeriesOption[] when needed
    const seriesOptions: LineSeriesOption[] = useMemo(() => 
        data.series?.map(s => ({
            name: s.name,
            type: 'line', // Set type explicitly to 'line' for LineSeriesOption
            data: s.data || [],
            // Add other series-specific options here if needed
        })) || [], 
    [data.series]); // Remove type dependency as it's now fixed to 'line'

    useEffect(() => {
        let chartInstance: EChartsType | null = null;
        if (chartRef.current) {
            chartInstance = echarts.init(chartRef.current);
            chartInstanceRef.current = chartInstance;

            let options: ECOption = {};
            if (type === 'line') {
                options = {
                    tooltip: {
                        trigger: 'axis',
                        axisPointer: {
                            type: 'cross',
                            label: { backgroundColor: '#6a7985' }
                        }
                    },
                    grid: {
                        left: '3%', right: '4%', bottom: '3%', containLabel: true
                    },
                    xAxis: {
                        type: 'category',
                        boundaryGap: false,
                        data: data.xAxis || [] // Use xAxis directly
                    },
                    yAxis: { type: 'value' },
                    series: seriesOptions, // Use directly mapped series data
                    toolbox: {
                        feature: {
                            saveAsImage: {}
                        }
                    }
                };
            }
            // ... (configurations for other types)

            chartInstance.setOption(options);

            const onChartClick = (params: any) => {
                console.log('Chart clicked:', params);
            };
            chartInstance.on('click', onChartClick);

            const handleResize = () => chartInstance?.resize();
            window.addEventListener('resize', handleResize);

            return () => {
                window.removeEventListener('resize', handleResize);
                chartInstance?.off('click', onChartClick);
                chartInstance?.dispose();
                chartInstanceRef.current = null;
            };
        }
        // Re-run if type, xAxis array ref, or seriesOptions array ref changes
    }, [type, data.xAxis, seriesOptions]);

    // Effect to update chart when data changes
    useEffect(() => {
        if (chartInstanceRef.current && type === 'line') {
            const updateOptions: ECOption = {
                xAxis: {
                    data: data.xAxis || [] // Use xAxis directly
                },
                series: seriesOptions // Use directly mapped series data
            };
            chartInstanceRef.current.setOption(updateOptions);
        }
        // Re-run if type, xAxis array ref, or seriesOptions array ref changes
    }, [type, data.xAxis, seriesOptions]);

    return (
        <div className="chart-container" style={{ height }}>
            <div ref={chartRef} style={{ height: '100%', width: '100%' }} />
        </div>
    );
};

export default Chart; 