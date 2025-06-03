import { Icon } from "leaflet";

// Map crime categories from the API to their corresponding icon files
const crimeCategoryToIcon = {
  'anti-social-behaviour': '/anti-social-behaviour.svg',
  'bicycle-theft': '/bicycle-theft.svg',
  'burglary': '/burglary.svg',
  'criminal-damage-arson': '/criminal-damage-and-arson.svg',
  'drugs': '/drugs.svg',
  'other-theft': '/other-theft.svg',
  'possession-of-weapons': '/possession-of-weapons.svg',
  'public-order': '/public-order.svg',
  'robbery': '/robbery.svg',
  'shoplifting': '/shoplifting.svg',
  'theft-from-the-person': '/theft-from-the-person.svg',
  'vehicle-crime': '/vehicle-crime.svg',
  'violent-crime': '/violent-crime.svg',
  'violence-and-sexual-offences': '/violent-crime.svg', // API sometimes uses this format
  'other-crime': '/other-crime.svg',
};

// Default icon for unknown crime types
const defaultCrimeIcon = '/other-crime.svg';

// Function to get the appropriate icon for a crime category
export const getCrimeIcon = (category) => {
  // Normalize the category (handle different formats from API)
  const normalizedCategory = category?.toLowerCase().replace(/\s+/g, '-');
  const iconPath = crimeCategoryToIcon[normalizedCategory] || crimeCategoryToIcon[category] || defaultCrimeIcon;
  
  // Log when using default icon for debugging
  if (iconPath === defaultCrimeIcon && category) {
    console.log(`Using default icon for crime category: "${category}" (normalized: "${normalizedCategory}")`);
  }
  
  return new Icon({
    iconUrl: iconPath,
    iconSize: [25, 25],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
  });
};

// Function to get all available crime categories (for future use if needed)
export const getAvailableCrimeCategories = () => {
  return Object.keys(crimeCategoryToIcon);
};

// Export the mapping for use in other components
export { crimeCategoryToIcon }; 