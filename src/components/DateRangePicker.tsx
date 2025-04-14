import React, { useState, ChangeEvent } from 'react';
import '../styles/DateRangePicker.css';

interface DateRangePickerProps {
  startDate: Date;
  endDate: Date;
  onDateRangeChange: (range: { startDate: Date; endDate: Date }) => void;
}

interface QuickSelectOption {
  label: string;
  value: string;
  days: number;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onDateRangeChange
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [selectedRange, setSelectedRange] = useState<string>('custom');
  
  // Format date for display
  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };
  
  // Quick select options
  const quickSelects: QuickSelectOption[] = [
    { label: 'Last 24 hours', value: '24h', days: 1 },
    { label: 'Last 7 days', value: '7d', days: 7 },
    { label: 'Last 30 days', value: '30d', days: 30 },
    { label: 'Last 90 days', value: '90d', days: 90 }
  ];
  
  // Handle quick select change
  const handleQuickSelectChange = (days: number): void => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    
    // TODO: Interview task - Implement proper date range handling
    // This is intentionally incomplete and doesn't actually update the parent component
    console.log('Quick select:', { start, end });
    setSelectedRange(days === 90 ? '90d' : 'custom');
    
    // Just close the dropdown without applying the change
    setIsOpen(false);
  };
  
  // Handle custom date change
  const handleCustomDateChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    
    // TODO: Interview task - Implement proper date range validation and handling
    // This is intentionally incomplete and doesn't actually update anything
    console.log('Custom date change:', name, value);
  };
  
  // Apply date range
  const applyDateRange = (): void => {
    // TODO: Interview task - Implement date range application
    // This should call onDateRangeChange with the selected range
    // Currently it just closes the dropdown
    
    setIsOpen(false);
  };
  
  return (
    <div className="date-range-picker">
      <button 
        className="date-range-button"
        onClick={() => setIsOpen(!isOpen)}
      >
        {formatDate(startDate)} - {formatDate(endDate)}
        <span className="arrow-down">▼</span>
      </button>
      
      {isOpen && (
        <div className="date-range-dropdown">
          <div className="quick-selects">
            {quickSelects.map(option => (
              <button
                key={option.value}
                className={`quick-select-option ${selectedRange === option.value ? 'active' : ''}`}
                onClick={() => handleQuickSelectChange(option.days)}
              >
                {option.label}
              </button>
            ))}
          </div>
          
          <div className="custom-range">
            <h4>Custom Range</h4>
            <div className="date-inputs">
              <div className="date-input-group">
                <label>Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  value={formatDate(startDate)}
                  onChange={handleCustomDateChange}
                />
              </div>
              
              <div className="date-input-group">
                <label>End Date</label>
                <input
                  type="date"
                  name="endDate"
                  value={formatDate(endDate)}
                  onChange={handleCustomDateChange}
                />
              </div>
            </div>
          </div>
          
          <div className="date-range-actions">
            <button className="cancel-button" onClick={() => setIsOpen(false)}>
              Cancel
            </button>
            <button className="apply-button" onClick={applyDateRange}>
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangePicker; 