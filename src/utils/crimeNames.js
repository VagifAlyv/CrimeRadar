// Crime category mapping based on crime_types.txt
const crimeTypeNames = {
  "all-crime": "All crime",
  "anti-social-behaviour": "Anti-social behaviour",
  "bicycle-theft": "Bicycle theft",
  "burglary": "Burglary",
  "criminal-damage-arson": "Criminal damage and arson",
  "drugs": "Drugs",
  "other-theft": "Other theft",
  "possession-of-weapons": "Possession of weapons",
  "public-order": "Public order",
  "robbery": "Robbery",
  "shoplifting": "Shoplifting",
  "theft-from-the-person": "Theft from the person",
  "vehicle-crime": "Vehicle crime",
  "violent-crime": "Violence and sexual offences",
  "violence-and-sexual-offences": "Violence and sexual offences", // API sometimes uses this format
  "other-crime": "Other crime"
};

// Function to get the display name for a crime category
export const getCrimeDisplayName = (category) => {
  // Normalize the category (handle different formats from API)
  const normalizedCategory = category?.toLowerCase().replace(/\s+/g, '-');
  
  // Try to find the display name, fallback to the original category if not found
  return crimeTypeNames[normalizedCategory] || 
         crimeTypeNames[category] || 
         category || 
         'Unknown crime type';
};

// Export the mapping for use in other components
export { crimeTypeNames }; 