import { useState, useEffect, useCallback, useRef } from 'react'
import './App.css'
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, ZoomControl } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import { Icon, divIcon, point } from "leaflet";
import "leaflet/dist/leaflet.css";
import FilterMenu from './components/FilterMenu';
import { getCrimeIcon } from './utils/crimeIcons';
import { getCrimeDisplayName } from './utils/crimeNames';
import { useFilters } from './context/FilterContext';

// Import data from CSV
import csvData from './components/data/data.csv?raw';

// Parse CSV data
const parseCSVData = (csvString) => {
    const lines = csvString.split('\n');
    const headers = lines[0].replace(/"/g, '').split(',');
    
    return lines.slice(1).map(line => {
        const values = line.split(',').map(value => value.replace(/"/g, '').trim());
        const obj = {};
        headers.forEach((header, index) => {
            obj[header] = values[index];
        });
        return obj;
    }).filter(item => item.id && item.latitude && item.longitude);
};

// create custom icons for properties
const rentPropertyIcon = new Icon({
    iconUrl: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMiAzMiI+PHBhdGggZmlsbD0iIzI3YWU2MCIgZD0iTTE2IDJMMiA4djE2aDI4VjhMMTYgMnptMCAyLjVsMTIgNnYxM0g0VjEwLjVsMTItNnptLTggMHYxM0g0VjEwLjVsNC0yem04IDB2MTNoNFYxMC41bC00LTJ6Ii8+PC9zdmc+",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
});

const salePropertyIcon = new Icon({
    iconUrl: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMiAzMiI+PHBhdGggZmlsbD0iI2U3NGMzYyIgZD0iTTE2IDJMMiA4djE2aDI4VjhMMTYgMnptMCAyLjVsMTIgNnYxM0g0VjEwLjVsMTItNnptLTggMHYxM0g0VjEwLjVsNC0yem04IDB2MTNoNFYxMC41bC00LTJ6Ii8+PC9zdmc+",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
});

// custom cluster icons
const createClusterCustomIcon = function (cluster) {
    return new divIcon({
        html: `<span class="cluster-icon">${cluster.getChildCount()}</span>`,
        className: "custom-marker-cluster",
        iconSize: point(33, 33, true)
    });
};

const createRentClusterIcon = function (cluster) {
    return new divIcon({
        html: `<span class="cluster-icon rent-cluster">${cluster.getChildCount()}</span>`,
        className: "custom-marker-cluster",
        iconSize: point(33, 33, true)
    });
};

const createSaleClusterIcon = function (cluster) {
    return new divIcon({
        html: `<span class="cluster-icon sale-cluster">${cluster.getChildCount()}</span>`,
        className: "custom-marker-cluster",
        iconSize: point(33, 33, true)
    });
};

// Function to handle corner coordinates
const handleCornerCoordinates = (corners) => {
    console.log("Received corner coordinates:", corners);
    // Burada koordinatlar ile yapmak istediğiniz işlemleri gerçekleştirebilirsiniz
    // Örnek: API çağrısı, veri filtreleme, vs.
    
    // Örnek kullanım:
    const { northEast, northWest, southEast, southWest } = corners;
    console.log("North-East corner:", northEast.lat, northEast.lng);
    console.log("North-West corner:", northWest.lat, northWest.lng);
    console.log("South-East corner:", southEast.lat, southEast.lng);
    console.log("South-West corner:", southWest.lat, southWest.lng);
    
    // API çağrısı örneği:
    // fetchDataInBounds(northEast, southWest);
};

// Add debounce function at the top level
const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

// Add movement check function at the top level
const isSignificantMovement = (oldBounds, newBounds) => {
    if (!oldBounds || !newBounds) return true;
    
    // Calculate center points manually
    const oldCenter = {
        lat: (oldBounds.northEast.lat + oldBounds.southWest.lat) / 2,
        lng: (oldBounds.northEast.lng + oldBounds.southWest.lng) / 2
    };
    
    const newCenter = {
        lat: (newBounds.northEast.lat + newBounds.southWest.lat) / 2,
        lng: (newBounds.northEast.lng + newBounds.southWest.lng) / 2
    };
    
    // Calculate distance between centers
    const latDiff = Math.abs(oldCenter.lat - newCenter.lat);
    const lngDiff = Math.abs(oldCenter.lng - newCenter.lng);
    
    // If the map moved more than 0.005 degrees (roughly 500m) or zoom level changed, consider it significant
    return latDiff > 0.005 || lngDiff > 0.005 || oldBounds.zoom !== newBounds.zoom;
};

// Function to fetch crime data for a specific crime type
const fetchCrimeDataForType = async (crimeType, bounds, selectedDate) => {
    try {
        // Create polygon string from the actual map bounds
        const { northEast, southWest } = bounds;
        const poly = `${northEast.lat},${northEast.lng}:${northEast.lat},${southWest.lng}:${southWest.lat},${southWest.lng}:${southWest.lat},${northEast.lng}:${northEast.lat},${northEast.lng}`;
        
        console.log('Fetching crimes for area:', poly);
        
        const url = `https://data.police.uk/api/crimes-street/${crimeType}?poly=${poly}&date=${selectedDate}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            console.error(`Failed to fetch ${crimeType}:`, response.status);
            return [];
        }
        
        const data = await response.json();
        console.log(`Fetched ${data.length} crimes for ${crimeType} in current area`);
        return data;
        
    } catch (error) {
        console.error(`Error fetching ${crimeType}:`, error);
        return [];
    }
};

// Function to fetch crime data from police.uk API for multiple crime types
const fetchCrimeData = async (bounds, selectedCrimeTypes = ['all-crime'], dateRange = null) => {
    try {
        // Get current date and calculate last available month (2 months behind)
        const now = new Date();
        const lastAvailableMonth = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        const defaultDate = `${lastAvailableMonth.getFullYear()}-${String(lastAvailableMonth.getMonth() + 1).padStart(2, '0')}`;
        
        // Use selected date if available, otherwise use last available month
        let selectedDate = defaultDate;
        if (dateRange?.from) {
            // Format the date to YYYY-MM
            const [year, month] = dateRange.from.split('-');
            const selectedDateObj = new Date(year, parseInt(month) - 1, 1);
            
            // If selected date is more recent than last available month, use last available month
            if (selectedDateObj > lastAvailableMonth) {
                console.log('Selected date is not yet available, using last available month:', defaultDate);
                selectedDate = defaultDate;
            } else {
                selectedDate = `${year}-${month}`;
            }
        }
        
        console.log('Making API requests for crime types:', selectedCrimeTypes);
        console.log('Date:', selectedDate);
        console.log('Bounds:', bounds);
        
        // If no crime types are selected, return empty array (no API calls)
        if (selectedCrimeTypes.length === 0) {
            console.log('No crime types selected - returning empty results');
            return [];
        }
        
        // If all crime types are selected, use 'all-crime'
        if (selectedCrimeTypes.length >= 14) {
            console.log('Fetching all crimes...');
            const data = await fetchCrimeDataForType('all-crime', bounds, selectedDate);
            return data;
        }
        
        // Fetch data for each selected crime type
        console.log('Fetching specific crime types...');
        const promises = selectedCrimeTypes.map(crimeType => 
            fetchCrimeDataForType(crimeType, bounds, selectedDate)
        );
        
        const results = await Promise.all(promises);
        
        // Combine all results and remove duplicates
        const allCrimes = results.flat();
        const uniqueCrimes = allCrimes.filter((crime, index, self) => 
            index === self.findIndex(c => c.id === crime.id)
        );
        
        console.log(`Crime data received: ${uniqueCrimes.length} crimes from ${selectedCrimeTypes.length} types`);
        return uniqueCrimes;
        
    } catch (error) {
        console.error('Error fetching crime data:', error);
        return [];
    }
};

// Function to handle location search
const handleLocationSearch = async (searchQuery) => {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
        const data = await response.json();
        
        if (data && data.length > 0) {
            return {
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon)
            };
        }
        return null;
    } catch (error) {
        console.error('Error searching location:', error);
        return null;
    }
};

// Component to display bounds and handle data fetching
function BoundsDisplay() {
    const { selectedCrimes, selectedProperties, selectedDateRange } = useFilters();
    const [bounds, setBounds] = useState(null);
    const [crimes, setCrimes] = useState([]);
    const [properties, setProperties] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const lastBoundsRef = useRef(null);
    const map = useMap();
    
    // Create debounced fetch function with shorter delay
    const debouncedFetchData = useCallback(
        debounce(async (newBounds) => {
            if (selectedCrimes.length > 0) {
                setIsLoading(true);
                setError(null);
                try {
                    const crimeData = await fetchCrimeData(newBounds, selectedCrimes, selectedDateRange);
                    setCrimes(crimeData);
                    if (crimeData.length === 0) {
                        setError('No crime data available for the selected area and date range. Try selecting a different date or area.');
                    }
                } catch (error) {
                    console.error('Error fetching crime data:', error);
                    setError('Failed to load crime data. Please try again later.');
                } finally {
                    setIsLoading(false);
                }
            }
        }, 300), // Reduced debounce delay for more responsive updates
        [selectedCrimes, selectedDateRange]
    );

    // Add search handler
    const handleSearch = async (e) => {
        if (e.key === 'Enter' && searchQuery.trim()) {
            const location = await handleLocationSearch(searchQuery.trim());
            if (location) {
                map.setView([location.lat, location.lng], 16);
            }
        }
    };

    // Add search input change handler
    useEffect(() => {
        const searchInput = document.querySelector('.search-bar-fixed');
        if (searchInput) {
            searchInput.addEventListener('keyup', handleSearch);
            searchInput.addEventListener('input', (e) => setSearchQuery(e.target.value));
        }
        return () => {
            if (searchInput) {
                searchInput.removeEventListener('keyup', handleSearch);
            }
        };
    }, [searchQuery]);

    // Get initial bounds and data immediately after mount
    useEffect(() => {
        const fetchInitialData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // Wait for map to be ready
                await new Promise(resolve => setTimeout(resolve, 100));
                
                const initialBounds = map.getBounds();
                const cornerCoordinates = {
                    northEast: initialBounds.getNorthEast(),
                    northWest: {lat: initialBounds.getNorth(), lng: initialBounds.getWest()},
                    southEast: {lat: initialBounds.getSouth(), lng: initialBounds.getEast()},
                    southWest: initialBounds.getSouthWest(),
                    zoom: map.getZoom()
                };
                setBounds(cornerCoordinates);
                lastBoundsRef.current = cornerCoordinates;
                
                // Fetch initial crime data if crime types are selected
                if (selectedCrimes.length > 0) {
                    const crimeData = await fetchCrimeData(cornerCoordinates, selectedCrimes, selectedDateRange);
                    setCrimes(crimeData);
                    if (crimeData.length === 0) {
                        setError('No crime data available for the selected area and date range. Try selecting a different date or area.');
                    }
                }

                // Set properties data
                const parsedData = parseCSVData(csvData);
                setProperties(parsedData);
            } catch (error) {
                console.error('Error fetching initial data:', error);
                setError('Failed to load initial data. Please try again later.');
            } finally {
                setIsLoading(false);
            }
        };
        
        fetchInitialData();
    }, [map, selectedCrimes, selectedDateRange]);

    // Handle map movement
    useEffect(() => {
        const handleMoveEnd = () => {
            const newBounds = map.getBounds();
            const currentZoom = map.getZoom();
            
            const cornerCoordinates = {
                northEast: newBounds.getNorthEast(),
                northWest: {lat: newBounds.getNorth(), lng: newBounds.getWest()},
                southEast: {lat: newBounds.getSouth(), lng: newBounds.getEast()},
                southWest: newBounds.getSouthWest(),
                zoom: currentZoom
            };
            
            // Always update bounds and fetch data on zoom change
            if (currentZoom !== lastBoundsRef.current?.zoom) {
                setBounds(cornerCoordinates);
                lastBoundsRef.current = cornerCoordinates;
                if (selectedCrimes.length > 0) {
                    debouncedFetchData(cornerCoordinates);
                }
                return;
            }
            
            // For panning, check if movement is significant
            if (isSignificantMovement(lastBoundsRef.current, cornerCoordinates)) {
                setBounds(cornerCoordinates);
                lastBoundsRef.current = cornerCoordinates;
                if (selectedCrimes.length > 0) {
                    debouncedFetchData(cornerCoordinates);
                }
            }
        };

        map.on('moveend', handleMoveEnd);
        return () => {
            map.off('moveend', handleMoveEnd);
        };
    }, [map, selectedCrimes, selectedDateRange, debouncedFetchData]);

    // Refetch data when selected crimes or dates change
    useEffect(() => {
        if (bounds) {
            if (selectedCrimes.length === 0) {
                setCrimes([]);
            } else {
                debouncedFetchData(bounds);
            }
        }
    }, [selectedCrimes, selectedDateRange, bounds, debouncedFetchData]);

    if (!bounds) return null;

    // Separate properties into rent and sales based on selected filters
    const rentProperties = properties.filter(property => 
        property.type === 'rent' && 
        (selectedProperties.includes('rent') || selectedProperties.length === 2)
    );
    const saleProperties = properties.filter(property => 
        property.type === 'sale' && 
        (selectedProperties.includes('sale') || selectedProperties.length === 2)
    );

    return (
        <>
            {/* Loading Overlay */}
            {isLoading && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(255, 255, 255, 0.7)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000,
                }}>
                    <div style={{
                        padding: '20px',
                        backgroundColor: 'white',
                        borderRadius: '8px',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                        textAlign: 'center'
                    }}>
                        <div style={{ marginBottom: '10px' }}>Loading data...</div>
                        <div style={{ 
                            width: '40px', 
                            height: '40px', 
                            border: '4px solid #f3f3f3',
                            borderTop: '4px solid #3498db',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                        }}></div>
                    </div>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div style={{
                    position: 'absolute',
                    top: '20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: '#fff3f3',
                    border: '1px solid #ffcdd2',
                    borderRadius: '4px',
                    padding: '12px 20px',
                    color: '#d32f2f',
                    zIndex: 1000,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    maxWidth: '80%',
                    textAlign: 'center'
                }}>
                    {error}
                </div>
            )}
            
            <div style={{
                position: 'absolute',
                bottom: '20px',
                left: '20px',
                zIndex: 1000,
                background: 'white',
                padding: '10px',
                borderRadius: '4px',
                boxShadow: '0 0 10px rgba(0,0,0,0.1)',
                fontSize: '12px',
                maxWidth: '300px'
            }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>Map Information:</h3>
                <p style={{ margin: '2px 0' }}>Total Properties: {properties.length}</p>
                <p style={{ margin: '2px 0' }}>Rent Properties: {rentProperties.length}</p>
                <p style={{ margin: '2px 0' }}>Sale Properties: {saleProperties.length}</p>
                <p style={{ margin: '2px 0' }}>Total Crimes: {crimes.length}</p>
                {!isLoading && selectedCrimes.length === 0 && (
                    <p style={{ color: '#666', fontStyle: 'italic', margin: '4px 0' }}>
                        No crime filters selected - select crime types to view data
                    </p>
                )}
                {!isLoading && selectedProperties.length === 0 && (
                    <p style={{ color: '#666', fontStyle: 'italic', margin: '4px 0' }}>
                        No property filters selected - showing only crimes
                    </p>
                )}
                {!isLoading && selectedProperties.length === 2 && (
                    <p style={{ color: '#666', fontStyle: 'italic', margin: '4px 0' }}>
                        All property types selected - showing all properties
                    </p>
                )}
            </div>
            
            {/* Crime Markers Cluster */}
            <MarkerClusterGroup
                chunkedLoading
                iconCreateFunction={createClusterCustomIcon}
                spiderfyOnMaxZoom={true}
                showCoverageOnHover={true}
                zoomToBoundsOnClick={true}
                disableClusteringAtZoom={16}
                maxClusterRadius={function(zoom) {
                    return zoom <= 10 ? 80 : 50;
                }}
            >
                {crimes.map((crime) => (
                    <Marker 
                        key={crime.id} 
                        position={[parseFloat(crime.location.latitude), parseFloat(crime.location.longitude)]}
                        icon={getCrimeIcon(crime.category)}
                    >
                        <Popup>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', minWidth: '250px' }}>
                                <div style={{ flexShrink: 0, marginTop: '4px' }}>
                                    <img 
                                        src={getCrimeIcon(crime.category).options.iconUrl} 
                                        alt={getCrimeDisplayName(crime.category)}
                                        style={{ width: '32px', height: '32px' }}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>Crime Details</h3>
                                    <p style={{ margin: '4px 0' }}><strong>Category:</strong> {getCrimeDisplayName(crime.category)}</p>
                                    <p style={{ margin: '4px 0' }}><strong>Location:</strong> {crime.location.street.name}</p>
                                    <p style={{ margin: '4px 0' }}><strong>Date:</strong> {crime.month}</p>
                                    {crime.outcome_status && (
                                        <p style={{ margin: '4px 0' }}><strong>Outcome:</strong> {crime.outcome_status.category}</p>
                                    )}
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MarkerClusterGroup>

            {/* Rent Properties Cluster - Only show if rent is selected or all properties are selected */}
            {(selectedProperties.includes('rent') || selectedProperties.length === 2) && rentProperties.length > 0 && (
                <MarkerClusterGroup
                    chunkedLoading
                    iconCreateFunction={createRentClusterIcon}
                    spiderfyOnMaxZoom={true}
                    showCoverageOnHover={true}
                    zoomToBoundsOnClick={true}
                    disableClusteringAtZoom={16}
                    maxClusterRadius={function(zoom) {
                        return zoom <= 10 ? 80 : 50;
                    }}
                >
                    {rentProperties.map((property) => (
                        <Marker 
                            key={property.id} 
                            position={[parseFloat(property.latitude), parseFloat(property.longitude)]}
                            icon={rentPropertyIcon}
                        >
                            <Popup>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', minWidth: '250px' }}>
                                    <div style={{ flexShrink: 0, marginTop: '4px' }}>
                                        <img 
                                            src={rentPropertyIcon.options.iconUrl} 
                                            alt="Rental Property"
                                            style={{ width: '32px', height: '32px' }}
                                        />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#2c3e50' }}>Rental Property</h3>
                                        <p style={{ margin: '4px 0', fontSize: '14px' }}><strong>Name:</strong> {property.name}</p>
                                        {property.price ? (
                                            <p style={{ margin: '4px 0', fontSize: '14px', color: '#27ae60' }}>
                                                <strong>Monthly Rent:</strong> £{parseFloat(property.price).toLocaleString()}
                                            </p>
                                        ) : (
                                            <p style={{ margin: '4px 0', fontSize: '14px', color: '#e74c3c' }}>
                                                <strong>Price:</strong> Not available
                                            </p>
                                        )}
                                        <p style={{ margin: '4px 0', fontSize: '12px', color: '#7f8c8d' }}>
                                            <strong>Location:</strong> {parseFloat(property.latitude).toFixed(4)}, {parseFloat(property.longitude).toFixed(4)}
                                        </p>
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MarkerClusterGroup>
            )}

            {/* Sale Properties Cluster - Only show if sale is selected or all properties are selected */}
            {(selectedProperties.includes('sale') || selectedProperties.length === 2) && saleProperties.length > 0 && (
                <MarkerClusterGroup
                    chunkedLoading
                    iconCreateFunction={createSaleClusterIcon}
                    spiderfyOnMaxZoom={true}
                    showCoverageOnHover={true}
                    zoomToBoundsOnClick={true}
                    disableClusteringAtZoom={16}
                    maxClusterRadius={function(zoom) {
                        return zoom <= 10 ? 80 : 50;
                    }}
                >
                    {saleProperties.map((property) => (
                        <Marker 
                            key={property.id} 
                            position={[parseFloat(property.latitude), parseFloat(property.longitude)]}
                            icon={salePropertyIcon}
                        >
                            <Popup>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', minWidth: '250px' }}>
                                    <div style={{ flexShrink: 0, marginTop: '4px' }}>
                                        <img 
                                            src={salePropertyIcon.options.iconUrl} 
                                            alt="Property For Sale"
                                            style={{ width: '32px', height: '32px' }}
                                        />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#2c3e50' }}>Property For Sale</h3>
                                        <p style={{ margin: '4px 0', fontSize: '14px' }}><strong>Name:</strong> {property.name}</p>
                                        {property.price ? (
                                            <p style={{ margin: '4px 0', fontSize: '14px', color: '#27ae60' }}>
                                                <strong>Sale Price:</strong> £{parseFloat(property.price).toLocaleString()}
                                            </p>
                                        ) : (
                                            <p style={{ margin: '4px 0', fontSize: '14px', color: '#e74c3c' }}>
                                                <strong>Price:</strong> Not available
                                            </p>
                                        )}
                                        <p style={{ margin: '4px 0', fontSize: '12px', color: '#7f8c8d' }}>
                                            <strong>Location:</strong> {parseFloat(property.latitude).toFixed(4)}, {parseFloat(property.longitude).toFixed(4)}
                                        </p>
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MarkerClusterGroup>
            )}
        </>
    );
}

const App = () => {
    return (
        <div className="map-container">
            <style>
                {`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}
            </style>
            <FilterMenu />
            <MapContainer 
                center={[51.5154, -0.1419]}
                zoom={16}
                zoomControl={false}
                minZoom={13}
                maxZoom={18}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                />
                <ZoomControl position="bottomright" />
                <BoundsDisplay />
            </MapContainer>
        </div>
    )
}

export default App
