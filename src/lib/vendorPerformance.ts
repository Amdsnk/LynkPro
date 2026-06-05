import { Vendor, VendorPerformance } from '@/types/types';
import { differenceInDays, parseISO } from 'date-fns';

/**
 * Calculate vendor overall rating based on performance metrics
 */
export function calculateVendorRating(
  onTimeDeliveryRate: number,
  avgQualityRating: number,
  avgLeadTime: number,
  industryAvgLeadTime: number = 14
): number {
  // On-time delivery weight: 40%
  const deliveryScore = (onTimeDeliveryRate / 100) * 5;

  // Quality rating weight: 40%
  const qualityScore = avgQualityRating;

  // Lead time weight: 20% (shorter is better)
  const leadTimeScore = Math.max(0, 5 - ((avgLeadTime - industryAvgLeadTime) / industryAvgLeadTime) * 5);

  // Weighted average
  const rating = (deliveryScore * 0.4) + (qualityScore * 0.4) + (leadTimeScore * 0.2);

  return Math.max(1, Math.min(5, rating)); // Clamp between 1-5
}

/**
 * Calculate on-time delivery rate from performance records
 */
export function calculateOnTimeDeliveryRate(performances: VendorPerformance[]): number {
  if (performances.length === 0) return 0;

  const onTimeCount = performances.filter(p => p.on_time === true).length;
  return (onTimeCount / performances.length) * 100;
}

/**
 * Calculate average quality rating
 */
export function calculateAvgQualityRating(performances: VendorPerformance[]): number {
  const ratingsWithValues = performances.filter(p => p.quality_rating !== null && p.quality_rating !== undefined);
  if (ratingsWithValues.length === 0) return 0;

  const total = ratingsWithValues.reduce((sum, p) => sum + (p.quality_rating || 0), 0);
  return total / ratingsWithValues.length;
}

/**
 * Calculate average lead time in days
 */
export function calculateAvgLeadTime(performances: VendorPerformance[]): number {
  const deliveriesWithDates = performances.filter(
    p => p.delivery_date && p.promised_date
  );

  if (deliveriesWithDates.length === 0) return 0;

  const totalDays = deliveriesWithDates.reduce((sum, p) => {
    if (!p.delivery_date || !p.promised_date) return sum;
    const days = Math.abs(differenceInDays(parseISO(p.delivery_date), parseISO(p.promised_date)));
    return sum + days;
  }, 0);

  return totalDays / deliveriesWithDates.length;
}

/**
 * Determine if delivery was on time
 */
export function isDeliveryOnTime(deliveryDate: string, promisedDate: string): boolean {
  const delivery = parseISO(deliveryDate);
  const promised = parseISO(promisedDate);
  return delivery <= promised;
}

/**
 * Calculate vendor performance score (0-100)
 */
export function calculatePerformanceScore(vendor: Vendor): number {
  const deliveryScore = vendor.on_time_delivery_rate || 0;
  const ratingScore = ((vendor.rating || 0) / 5) * 100;

  // Lead time score (inverse - shorter is better)
  const leadTimeScore = vendor.average_lead_time_days
    ? Math.max(0, 100 - (vendor.average_lead_time_days * 2))
    : 50;

  return (deliveryScore * 0.5) + (ratingScore * 0.3) + (leadTimeScore * 0.2);
}

/**
 * Rank vendors by performance
 */
export function rankVendors(vendors: Vendor[]): Vendor[] {
  return [...vendors].sort((a, b) => {
    const scoreA = calculatePerformanceScore(a);
    const scoreB = calculatePerformanceScore(b);
    return scoreB - scoreA;
  });
}

/**
 * Identify top performing vendors
 */
export function getTopVendors(vendors: Vendor[], count: number = 5): Vendor[] {
  const ranked = rankVendors(vendors);
  return ranked.slice(0, count);
}

/**
 * Identify underperforming vendors
 */
export function getUnderperformingVendors(
  vendors: Vendor[],
  threshold: number = 60
): Vendor[] {
  return vendors.filter(v => calculatePerformanceScore(v) < threshold);
}

/**
 * Calculate delivery delay in days
 */
export function calculateDeliveryDelay(
  deliveryDate: string,
  promisedDate: string
): number {
  const delivery = parseISO(deliveryDate);
  const promised = parseISO(promisedDate);
  return differenceInDays(delivery, promised);
}

/**
 * Aggregate vendor performance metrics
 */
export interface VendorMetrics {
  totalOrders: number;
  onTimeDeliveries: number;
  lateDeliveries: number;
  avgQualityRating: number;
  avgLeadTime: number;
  onTimeRate: number;
  performanceScore: number;
}

export function aggregateVendorMetrics(
  vendor: Vendor,
  performances: VendorPerformance[]
): VendorMetrics {
  const totalOrders = performances.length;
  const onTimeDeliveries = performances.filter(p => p.on_time === true).length;
  const lateDeliveries = performances.filter(p => p.on_time === false).length;
  const avgQualityRating = calculateAvgQualityRating(performances);
  const avgLeadTime = calculateAvgLeadTime(performances);
  const onTimeRate = calculateOnTimeDeliveryRate(performances);
  const performanceScore = calculatePerformanceScore(vendor);

  return {
    totalOrders,
    onTimeDeliveries,
    lateDeliveries,
    avgQualityRating,
    avgLeadTime,
    onTimeRate,
    performanceScore,
  };
}

/**
 * Recommend vendor based on criteria
 */
export function recommendVendor(
  vendors: Vendor[],
  prioritizeSpeed: boolean = false,
  prioritizeQuality: boolean = false
): Vendor | null {
  if (vendors.length === 0) return null;

  let scored = vendors.map(v => ({
    vendor: v,
    score: 0,
  }));

  if (prioritizeSpeed) {
    // Prioritize lead time and on-time delivery
    scored = scored.map(s => ({
      ...s,
      score: (s.vendor.on_time_delivery_rate || 0) * 0.6 +
             (s.vendor.average_lead_time_days ? Math.max(0, 100 - s.vendor.average_lead_time_days * 3) : 0) * 0.4,
    }));
  } else if (prioritizeQuality) {
    // Prioritize quality rating
    scored = scored.map(s => ({
      ...s,
      score: ((s.vendor.rating || 0) / 5) * 100,
    }));
  } else {
    // Balanced approach
    scored = scored.map(s => ({
      ...s,
      score: calculatePerformanceScore(s.vendor),
    }));
  }

  scored.sort((a, b) => b.score - a.score);
  return scored[0].vendor;
}
