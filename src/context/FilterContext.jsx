import React, { createContext, useContext, useState } from 'react';

// Crime types from the filter menu
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
  { url: 'sale', name: 'For Sale' },
  { url: 'rent', name: 'For Rent' },
];

const FilterContext = createContext();

export const useFilters = () => {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilters must be used within a FilterProvider');
  }
  return context;
};

export const FilterProvider = ({ children }) => {
  // Initialize with all crime types selected (show all crimes by default)
  const [selectedCrimes, setSelectedCrimes] = useState(CRIME_TYPES.map(c => c.url));
  // Initialize with no properties selected (show only crimes by default)
  const [selectedProperties, setSelectedProperties] = useState([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedDateRange, setSelectedDateRange] = useState(null);

  const value = {
    selectedCrimes,
    setSelectedCrimes,
    selectedProperties,
    setSelectedProperties,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    selectedDateRange,
    setSelectedDateRange,
    CRIME_TYPES,
    PROPERTY_TYPES
  };

  return (
    <FilterContext.Provider value={value}>
      {children}
    </FilterContext.Provider>
  );
}; 