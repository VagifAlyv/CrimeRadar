import React, { useState } from 'react';
import './FilterMenu.css';
import { crimeCategoryToIcon } from '../utils/crimeIcons';
import { useFilters } from '../context/FilterContext';

const CRIME_TYPES = [
  { url: 'anti-social-behaviour', name: 'Anti-social behaviour' },
  { url: 'bicycle-theft', name: 'Bicycle theft' },
  { url: 'burglary', name: 'Burglary' },
  { url: 'criminal-damage-arson', name: 'Criminal damage and arson' },
  { url: 'drugs', name: 'Drugs' },
  { url: 'other-theft', name: 'Other theft' },
  { url: 'possession-of-weapons', name: 'Possession of weapons' },
  { url: 'public-order', name: 'Public order' },
  { url: 'robbery', name: 'Robbery' },
  { url: 'shoplifting', name: 'Shoplifting' },
  { url: 'theft-from-the-person', name: 'Theft from the person' },
  { url: 'vehicle-crime', name: 'Vehicle crime' },
  { url: 'violent-crime', name: 'Violence and sexual offences' },
  { url: 'other-crime', name: 'Other crime' },
];

const PROPERTY_TYPES = [
  { url: 'for-sale', name: 'For Sale' },
  { url: 'for-rent', name: 'For Rent' },
];

const TOURISTIC_TYPES = [
  { url: 'museums', name: 'Museums' },
  { url: 'parks', name: 'Parks' },
  { url: 'historic-sites', name: 'Historic Sites' },
];

// Using centralized crime category icons from utils

const FilterMenu = () => {
  const { 
    selectedCrimes, 
    setSelectedCrimes, 
    selectedProperties,
    setSelectedProperties,
    selectedDateRange,
    setSelectedDateRange,
    CRIME_TYPES,
    PROPERTY_TYPES 
  } = useFilters();
  
  const [open, setOpen] = useState(false);
  const [crimeFilterOpen, setCrimeFilterOpen] = useState(false);
  const [propertyFilterOpen, setPropertyFilterOpen] = useState(false);
  const [touristicFilterOpen, setTouristicFilterOpen] = useState(false);
  const [selectedTouristic, setSelectedTouristic] = useState([]);
  const [dateError, setDateError] = useState('');
  const [tempDateFrom, setTempDateFrom] = useState(selectedDateRange?.from || '');
  const [tempDateTo, setTempDateTo] = useState(selectedDateRange?.to || '');

  const allCrimesSelected = selectedCrimes.length === CRIME_TYPES.length;
  const noneCrimesSelected = selectedCrimes.length === 0;
  const allPropertiesSelected = selectedProperties.length === PROPERTY_TYPES.length;
  const nonePropertiesSelected = selectedProperties.length === 0;
  const allTouristicSelected = selectedTouristic.length === TOURISTIC_TYPES.length;
  const noneTouristicSelected = selectedTouristic.length === 0;

  // Get current date and calculate last available month (2 months behind)
  const now = new Date();
  const lastAvailableMonth = new Date(now.getFullYear(), now.getMonth() - 2, 1);
  
  // Generate years array from 2011 to 2024
  const years = Array.from(
    { length: 2024 - 2010 },
    (_, i) => 2011 + i
  );

  const months = [
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ];

  // Get available months for a given year
  const getAvailableMonths = (year) => {
    // Show all months for all years
    return months;
  };

  // Date validation
  const handleDateFromChange = (e) => {
    const value = e.target.value;
    if (tempDateTo && value > tempDateTo) {
      setDateError('From date cannot be after To date.');
    } else if (value > lastAvailableMonth.toISOString().slice(0, 7)) {
      setDateError('Date cannot be in the future.');
    } else {
      setDateError('');
      setTempDateFrom(value);
    }
  };

  const handleDateToChange = (e) => {
    const value = e.target.value;
    if (tempDateFrom && value < tempDateFrom) {
      setDateError('To date cannot be before From date.');
    } else if (value > lastAvailableMonth.toISOString().slice(0, 7)) {
      setDateError('Date cannot be in the future.');
    } else {
      setDateError('');
      setTempDateTo(value);
    }
  };

  const handleApplyDateFilter = () => {
    // Validate dates
    if (tempDateFrom && tempDateTo) {
      const fromDate = new Date(tempDateFrom);
      const toDate = new Date(tempDateTo);
      
      if (fromDate > toDate) {
        alert('From date cannot be after To date');
        return;
      }
      
      if (fromDate > lastAvailableMonth || toDate > lastAvailableMonth) {
        alert('Selected dates are not yet available. Data is available up to ' + 
          `${lastAvailableMonth.getFullYear()}-${String(lastAvailableMonth.getMonth() + 1).padStart(2, '0')}`);
        return;
      }
    }
    
    setSelectedDateRange({
      from: tempDateFrom,
      to: tempDateTo
    });
  };

  const handleClearDateFilter = () => {
    setTempDateFrom('');
    setTempDateTo('');
    setSelectedDateRange(null);
    setDateError('');
  };

  const handleCrimeChange = (url) => {
    setSelectedCrimes((prev) =>
      prev.includes(url)
        ? prev.filter((c) => c !== url)
        : [...prev, url]
    );
  };

  const handlePropertyChange = (url) => {
    setSelectedProperties((prev) =>
      prev.includes(url)
        ? prev.filter((p) => p !== url)
        : [...prev, url]
    );
  };

  const handleTouristicChange = (url) => {
    setSelectedTouristic((prev) =>
      prev.includes(url)
        ? prev.filter((t) => t !== url)
        : [...prev, url]
    );
  };

  const handleSelectAllCrimes = () => {
    setSelectedCrimes(CRIME_TYPES.map(c => c.url));
  };
  
  const handleClearCrimes = () => {
    setSelectedCrimes([]);
  };
  const handleSelectAllProperties = () => setSelectedProperties(PROPERTY_TYPES.map(p => p.url));
  const handleClearProperties = () => setSelectedProperties([]);
  const handleSelectAllTouristic = () => setSelectedTouristic(TOURISTIC_TYPES.map(t => t.url));
  const handleClearTouristic = () => setSelectedTouristic([]);

  return (
    <div className="filter-menu-fixed">
      <input 
        type="text" 
        placeholder="Search for a location..." 
        className="search-bar-fixed"
        onKeyPress={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
          }
        }}
      />
      <button
        className={`toggle-btn slide-toggle${open ? ' open' : ''}`}
        onClick={() => setOpen((prev) => !prev)}
        title={open ? 'Close Filters' : 'Open Filters'}
      >
        <span className={`triangle${open ? ' reversed' : ''}`}>▶</span>
      </button>
      <div className={`filter-menu${open ? ' open' : ''}`}>
        {open && (
          <div className="menu-content">
            <div className="filter-section">
              <div className="filter-group">
                <div
                  style={{
                    background: selectedCrimes.length > 0 ? '#4CAF50' : 'white',
                    borderRadius: '6px',
                    padding: '6px 10px',
                    marginBottom: '10px'
                  }}
                >
                  <label style={{display: 'flex', alignItems: 'center', cursor: 'pointer', justifyContent: 'space-between'}} onClick={() => setCrimeFilterOpen(v => !v)}>
                    <span style={{ color: selectedCrimes.length > 0 ? 'white' : 'black', fontWeight: 500 }}>Crime Filter</span>
                    <span style={{
                      display: 'inline-block',
                      transition: 'transform 0.2s',
                      transform: crimeFilterOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                      fontSize: '1.5em',
                      color: 'black',
                    }}>
                      {'\u25BA'}
                    </span>
                  </label>
                </div>
                {crimeFilterOpen && (
                  <div className="crime-filter-list">
                    <div className="crime-filter-actions">
                      <span
                        className="crime-filter-select"
                        onClick={handleSelectAllCrimes}
                        style={{
                          cursor: 'pointer',
                          color: 'gray',
                          fontWeight: allCrimesSelected ? 'bold' : 'normal'
                        }}
                      >
                        Select all
                      </span>
                      <span
                        style={{
                          margin: '0 8px',
                          color: 'gray',
                          fontWeight: 'normal',
                          userSelect: 'none',
                          pointerEvents: 'none',
                          display: 'inline-block',
                          minWidth: '10px',
                          textAlign: 'center'
                        }}
                      >
                        |
                      </span>
                      <span
                        className="crime-filter-clear"
                        onClick={handleClearCrimes}
                        style={{
                          cursor: 'pointer',
                          color: 'gray',
                          fontWeight: noneCrimesSelected ? 'bold' : 'normal'
                        }}
                      >
                        Clear
                      </span>
                    </div>
                    <ul className="crime-checkbox-list">
                      {CRIME_TYPES.map((crime) => (
                        <li key={crime.url} className="crime-checkbox-item">
                          <label style={{display: 'flex', alignItems: 'center', gap: 6}}>
                            <input
                              type="checkbox"
                              checked={selectedCrimes.includes(crime.url)}
                              onChange={() => handleCrimeChange(crime.url)}
                            />
                            {/* Icon on the right of the checkbox if available */}
                            {crimeCategoryToIcon[crime.url] && (
                              <img src={crimeCategoryToIcon[crime.url]} alt="" style={{ width: 20, height: 20, marginRight: 4 }} />
                            )}
                            {crime.name}
                          </label>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="filter-group">
                <label>Date Range:</label>
                <div className="date-range">
                  <div className="date-row">
                    <span className="date-label">From:</span>
                    <div className="date-input-wrapper">
                      <select 
                        value={tempDateFrom.split('-')[0] || ''} 
                        onChange={(e) => {
                          const year = e.target.value;
                          const month = tempDateFrom.split('-')[1] || '01';
                          setTempDateFrom(`${year}-${month}`);
                        }}
                        className="year-select"
                      >
                        <option value="">Select Year</option>
                        {years.map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                      <select 
                        value={tempDateFrom.split('-')[1] || ''}
                        onChange={(e) => {
                          const year = tempDateFrom.split('-')[0] || years[0];
                          const month = e.target.value;
                          setTempDateFrom(`${year}-${month}`);
                        }}
                        className="month-select"
                      >
                        <option value="">Select Month</option>
                        {getAvailableMonths(tempDateFrom.split('-')[0] || years[0]).map(month => (
                          <option key={month.value} value={month.value}>{month.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="date-row">
                    <span className="date-label">To:</span>
                    <div className="date-input-wrapper">
                      <select 
                        value={tempDateTo.split('-')[0] || ''}
                        onChange={(e) => {
                          const year = e.target.value;
                          const month = tempDateTo.split('-')[1] || '01';
                          setTempDateTo(`${year}-${month}`);
                        }}
                        className="year-select"
                      >
                        <option value="">Select Year</option>
                        {years.map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                      <select 
                        value={tempDateTo.split('-')[1] || ''}
                        onChange={(e) => {
                          const year = tempDateTo.split('-')[0] || years[0];
                          const month = e.target.value;
                          setTempDateTo(`${year}-${month}`);
                        }}
                        className="month-select"
                      >
                        <option value="">Select Month</option>
                        {getAvailableMonths(tempDateTo.split('-')[0] || years[0]).map(month => (
                          <option key={month.value} value={month.value}>{month.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {dateError && (
                    <div style={{ color: 'red', marginTop: 4, fontSize: '0.95em' }}>{dateError}</div>
                  )}
                  <div className="date-actions">
                    <button 
                      onClick={handleApplyDateFilter}
                      className="apply-date-btn"
                      disabled={!!dateError}
                    >
                      Apply Date Filter
                    </button>
                    <button 
                      onClick={handleClearDateFilter}
                      className="clear-date-btn"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>

              <div className="filter-group">
                <div
                  style={{
                    background: selectedProperties.length > 0 ? '#4CAF50' : 'white',
                    borderRadius: '6px',
                    padding: '6px 10px',
                    marginBottom: '10px'
                  }}
                >
                  <label style={{display: 'flex', alignItems: 'center', cursor: 'pointer', justifyContent: 'space-between'}} onClick={() => setPropertyFilterOpen(v => !v)}>
                    <span style={{ color: selectedProperties.length > 0 ? 'white' : 'black', fontWeight: 500 }}>Property Filter</span>
                    <span style={{
                      display: 'inline-block',
                      transition: 'transform 0.2s',
                      transform: propertyFilterOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                      fontSize: '1.5em',
                      color: 'black',
                    }}>
                      {'\u25BA'}
                    </span>
                  </label>
                </div>
                {propertyFilterOpen && (
                  <div className="property-filter-list">
                    <div className="property-filter-actions">
                      <span
                        className="property-filter-select"
                        onClick={handleSelectAllProperties}
                        style={{
                          cursor: 'pointer',
                          color: 'gray',
                          fontWeight: allPropertiesSelected ? 'bold' : 'normal'
                        }}
                      >
                        Select all
                      </span>
                      <span
                        style={{
                          margin: '0 8px',
                          color: 'gray',
                          fontWeight: 'normal',
                          userSelect: 'none',
                          pointerEvents: 'none',
                          display: 'inline-block',
                          minWidth: '10px',
                          textAlign: 'center'
                        }}
                      >
                        |
                      </span>
                      <span
                        className="property-filter-clear"
                        onClick={handleClearProperties}
                        style={{
                          cursor: 'pointer',
                          color: 'gray',
                          fontWeight: nonePropertiesSelected ? 'bold' : 'normal'
                        }}
                      >
                        Clear
                      </span>
                    </div>
                    <ul className="property-checkbox-list">
                      {PROPERTY_TYPES.map((property) => (
                        <li key={property.url} className="property-checkbox-item">
                          <label style={{display: 'flex', alignItems: 'center', gap: 6}}>
                            <input
                              type="checkbox"
                              checked={selectedProperties.includes(property.url)}
                              onChange={() => handlePropertyChange(property.url)}
                            />
                            {property.name}
                          </label>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="filter-group">
                <div
                  style={{
                    background: selectedTouristic.length > 0 ? '#4CAF50' : 'white',
                    borderRadius: '6px',
                    padding: '6px 10px',
                    marginBottom: '10px'
                  }}
                >
                  <label style={{display: 'flex', alignItems: 'center', cursor: 'pointer', justifyContent: 'space-between'}} onClick={() => setTouristicFilterOpen(v => !v)}>
                    <span style={{ color: selectedTouristic.length > 0 ? 'white' : 'black', fontWeight: 500 }}>Touristic Attraction Filter</span>
                    <span style={{
                      display: 'inline-block',
                      transition: 'transform 0.2s',
                      transform: touristicFilterOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                      fontSize: '1.5em',
                      color: 'black',
                    }}>
                      {'\u25BA'}
                    </span>
                  </label>
                </div>
                {touristicFilterOpen && (
                  <div className="crime-filter-list">
                    <div className="crime-filter-actions">
                      <span
                        className="crime-filter-select"
                        onClick={handleSelectAllTouristic}
                        style={{
                          cursor: 'pointer',
                          color: 'gray',
                          fontWeight: allTouristicSelected ? 'bold' : 'normal'
                        }}
                      >
                        Select all
                      </span>
                      <span
                        style={{
                          margin: '0 8px',
                          color: 'gray',
                          fontWeight: 'normal',
                          userSelect: 'none',
                          pointerEvents: 'none',
                          display: 'inline-block',
                          minWidth: '10px',
                          textAlign: 'center'
                        }}
                      >
                        |
                      </span>
                      <span
                        className="crime-filter-clear"
                        onClick={handleClearTouristic}
                        style={{
                          cursor: 'pointer',
                          color: 'gray',
                          fontWeight: noneTouristicSelected ? 'bold' : 'normal'
                        }}
                      >
                        Clear
                      </span>
                    </div>
                    <ul className="crime-checkbox-list">
                      {TOURISTIC_TYPES.map((touristic) => (
                        <li key={touristic.url} className="crime-checkbox-item">
                          <label style={{display: 'flex', alignItems: 'center', gap: 6}}>
                            <input
                              type="checkbox"
                              checked={selectedTouristic.includes(touristic.url)}
                              onChange={() => handleTouristicChange(touristic.url)}
                            />
                            {touristic.name}
                          </label>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FilterMenu;
