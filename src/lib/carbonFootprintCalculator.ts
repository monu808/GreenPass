
import { CarbonFootprintResult, CarbonOffsetOption } from '@/types';
import { ORIGIN_LOCATIONS, getOriginLocationById } from '@/data/originLocations';

/**
 * Carbon Footprint Calculator for GreenPass
 * Provides utility functions to calculate environmental impact of travel and tourism
 */

// Emission factors (kg CO2e)
export const EMISSION_FACTORS = {
  TRANSPORT: {
    FLIGHT_PER_KM: 0.158, // Average for short-haul
    TRAIN_PER_KM: 0.041,
    BUS_PER_KM: 0.104,
    CAR_PER_KM: 0.171,
  },
  ACCOMMODATION_PER_NIGHT: 15.4, // Average hotel room
  GROUP_MULTIPLIERS: {
    INDIVIDUAL: 1.0,
    FAMILY: 0.85, // Shared resources
    LARGE_GROUP: 0.75,
  }
};

export class CarbonFootprintCalculator {
  private static instance: CarbonFootprintCalculator;

  private constructor() {}

  public static getInstance(): CarbonFootprintCalculator {
    if (!CarbonFootprintCalculator.instance) {
      CarbonFootprintCalculator.instance = new CarbonFootprintCalculator();
    }
    return CarbonFootprintCalculator.instance;
  }

  /**
   * Calculates distance between two points using Haversine formula in KM
   */
  public calculateTravelDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(value: number): number {
    return (value * Math.PI) / 180;
  }

  /**
   * Calculates the carbon footprint for a booking
   */
  public calculateBookingFootprint(
    originId: string,
    destinationId: string,
    groupSize: number,
    transportType: keyof typeof EMISSION_FACTORS.TRANSPORT = 'CAR_PER_KM',
    stayNights: number
  ): CarbonFootprintResult {
    // Validate groupSize
    const validatedGroupSize = groupSize > 0 ? groupSize : 1;
    
    const origin = getOriginLocationById(originId);
    // In a real app, we'd fetch the destination from a service, 
    // but for now we'll use placeholder coords based on destinationId or common spots
    const destCoords = { lat: 34.0837, lon: 74.7973 }; // Default to Srinagar/Gulmarg region

    const distance = origin 
      ? this.calculateTravelDistance(origin.latitude, origin.longitude, destCoords.lat, destCoords.lon)
      : 500; // Default distance

    const emissionFactor = EMISSION_FACTORS.TRANSPORT[transportType] || EMISSION_FACTORS.TRANSPORT.CAR_PER_KM;
    const travelEmissions = distance * emissionFactor * validatedGroupSize;
    const accommodationEmissions = EMISSION_FACTORS.ACCOMMODATION_PER_NIGHT * stayNights * validatedGroupSize;
    const totalEmissions = travelEmissions + accommodationEmissions;
    const emissionsPerPerson = totalEmissions / validatedGroupSize;

    let impactLevel: 'low' | 'medium' | 'high' = 'low';
    if (emissionsPerPerson > 200) impactLevel = 'high';
    else if (emissionsPerPerson > 100) impactLevel = 'medium';

    return {
      totalEmissions,
      emissionsPerPerson,
      travelEmissions,
      accommodationEmissions,
      impactLevel,
      ecoPointsReward: this.calculateEcoPoints(totalEmissions),
      comparison: {
        trees_equivalent: Math.round(totalEmissions / 21),
        car_miles_equivalent: Math.round(totalEmissions / 0.4),
        smartphone_charges: Math.round(totalEmissions / 0.008)
      },
      offsetOptions: this.getOffsetOptions(totalEmissions)
    };
  }

  private calculateEcoPoints(emissions: number): number {
    // Base 50 points, bonus for lower emissions
    return Math.max(10, Math.round(100 - (emissions / 10)));
  }

  private getOffsetOptions(emissions: number): CarbonOffsetOption[] {
    const baseCost = Math.ceil(emissions * 0.5); // ₹0.5 per kg
    return [
      {
        id: 'reforestation',
        name: 'Himalayan Reforestation',
        description: 'Plant native trees in the local ecosystem to sequester carbon and restore biodiversity.',
        cost: baseCost,
        ecoPointsBonus: Math.round(emissions * 0.2)
      },
      {
        id: 'clean-energy',
        name: 'Rural Clean Energy',
        description: 'Support solar and wind projects in local communities to reduce reliance on biomass.',
        cost: Math.ceil(baseCost * 1.5),
        ecoPointsBonus: Math.round(emissions * 0.4)
      }
    ];
  }

  public getSustainabilityTips(sensitivity: string): string[] {
    const tips = [
      "Carry a reusable water bottle to avoid single-use plastics.",
      "Stay on marked trails to prevent soil erosion and protect local flora.",
      "Dispose of all waste in designated bins or carry it back with you.",
      "Respect local wildlife by maintaining a safe distance."
    ];

    if (sensitivity === 'high' || sensitivity === 'critical') {
      tips.push("Use eco-friendly sunscreens and toiletries to protect water sources.");
      tips.push("Minimize noise pollution to avoid disturbing sensitive wildlife.");
    }

    return tips;
  }
}

/**
 * Singleton factory for CarbonFootprintCalculator
 */
export const getCarbonCalculator = () => CarbonFootprintCalculator.getInstance();
