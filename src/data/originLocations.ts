
/**
 * Origin location data for Indian states and major tourism origin points
 */

export interface OriginLocation {
  id: string;
  name: string;
  type: 'state' | 'city';
  latitude: number;
  longitude: number;
}

export const ORIGIN_LOCATIONS: OriginLocation[] = [
  { id: 'dl', name: 'Delhi', type: 'city', latitude: 28.6139, longitude: 77.2090 },
  { id: 'mh', name: 'Maharashtra (Mumbai)', type: 'state', latitude: 19.0760, longitude: 72.8777 },
  { id: 'ka', name: 'Karnataka (Bengaluru)', type: 'state', latitude: 12.9716, longitude: 77.5946 },
  { id: 'tn', name: 'Tamil Nadu (Chennai)', type: 'state', latitude: 13.0827, longitude: 80.2707 },
  { id: 'wb', name: 'West Bengal (Kolkata)', type: 'state', latitude: 22.5726, longitude: 88.3639 },
  { id: 'gj', name: 'Gujarat (Ahmedabad)', type: 'state', latitude: 23.0225, longitude: 72.5714 },
  { id: 'ts', name: 'Telangana (Hyderabad)', type: 'state', latitude: 17.3850, longitude: 78.4867 },
  { id: 'rj', name: 'Rajasthan (Jaipur)', type: 'state', latitude: 26.9124, longitude: 75.7873 },
  { id: 'up', name: 'Uttar Pradesh (Lucknow)', type: 'state', latitude: 26.8467, longitude: 80.9462 },
  { id: 'kl', name: 'Kerala (Kochi)', type: 'state', latitude: 9.9312, longitude: 76.2673 },
  { id: 'mp', name: 'Madhya Pradesh (Bhopal)', type: 'state', latitude: 23.2599, longitude: 77.4126 },
  { id: 'pb', name: 'Punjab (Chandigarh)', type: 'state', latitude: 30.7333, longitude: 76.7794 },
  { id: 'br', name: 'Bihar (Patna)', type: 'state', latitude: 25.5941, longitude: 85.1376 },
  { id: 'or', name: 'Odisha (Bhubaneswar)', type: 'state', latitude: 20.2961, longitude: 85.8245 },
  { id: 'as', name: 'Assam (Guwahati)', type: 'state', latitude: 26.1445, longitude: 91.7362 },
  { id: 'jk', name: 'Jammu & Kashmir (Srinagar)', type: 'state', latitude: 34.0837, longitude: 74.7973 }
];

export const getOriginLocationById = (id: string) => 
  ORIGIN_LOCATIONS.find(loc => loc.id === id);

export const getOriginLocationByName = (name: string) => 
  ORIGIN_LOCATIONS.find(loc => loc.name.toLowerCase().includes(name.toLowerCase()));
