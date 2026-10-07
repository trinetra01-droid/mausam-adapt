import { RainAroundYouReport, PlanRecord, UserPersona } from '../types.js';

export interface PlanConflictAnalysis {
  hasConflict: boolean;
  impactedPlan: PlanRecord | null;
  message: string | null;
}

export type RainCardPriority = 'CRITICAL' | 'HIGH' | 'STANDARD' | 'LOW';

export class RainSpatialAnalysis {
  /**
   * Evaluates whether current observed spatial precipitation conflicts with any scheduled user plan.
   * Requirement: "Connect Rain Around You to Mausam Adapt's personalization engine. If the user has a plan:
   * Example: Outdoor run 6 PM and the precipitation field is relevant:
   * Show: 'Rain around your location may affect your plan.' Provide: [Challenge this plan]"
   */
  public static evaluatePlanConflict(
    report: RainAroundYouReport | null,
    plans: PlanRecord[] = []
  ): PlanConflictAnalysis {
    if (!report || report.status === 'CLEAR_AROUND_YOU' || plans.length === 0) {
      return { hasConflict: false, impactedPlan: null, message: null };
    }

    // Check if rain is over or tracking toward location
    const isThreatening = 
      report.status === 'RAIN_OVER_YOU' || 
      report.status === 'RAIN_APPROACHING' || 
      (report.status === 'RAIN_NEARBY' && report.nearestCellDistanceKm !== null && report.nearestCellDistanceKm <= 12);

    if (!isThreatening) {
      return { hasConflict: false, impactedPlan: null, message: null };
    }

    // Find first upcoming or today's plan
    // e.g. RUNNING, CYCLING, OUTDOOR_WALK, COMMUTE, OUTDOOR_EVENT, FARMING
    const outdoorActivities = ['RUNNING', 'CYCLING', 'OUTDOOR_WALK', 'COMMUTE', 'OUTDOOR_EVENT', 'FARMING_SPRAY', 'FARMING_HARVEST', 'SPORTS', 'BEACH_VISIT'];
    const conflictingPlan = plans.find(p => outdoorActivities.includes(p.activity)) || plans[0];

    if (!conflictingPlan) {
      return { hasConflict: false, impactedPlan: null, message: null };
    }

    const directionNote = report.movement ? ` moving ${report.movement.directionCardinal.toLowerCase()}` : '';
    const message = `Rain around your location${directionNote} may affect your planned ${conflictingPlan.title} (${conflictingPlan.start_time || 'today'}).`;

    return {
      hasConflict: true,
      impactedPlan: conflictingPlan,
      message
    };
  }

  /**
   * Determines prominence of the Rain Around You section based on active persona and conditions.
   * Requirement: "The homepage should decide whether the feature deserves priority based on the active persona
   * and current conditions. Do not show it at maximum prominence when it is irrelevant."
   */
  public static determineDisplayPriority(
    report: RainAroundYouReport | null,
    activePersona: UserPersona
  ): RainCardPriority {
    if (!report) return 'LOW';

    // 1. Critical if precipitation is actively over the user or directly approaching
    if (report.status === 'RAIN_OVER_YOU' || report.status === 'RAIN_APPROACHING') {
      return 'CRITICAL';
    }

    // 2. High if rain is nearby and persona is weather-vulnerable
    const highSensitivityPersonas: UserPersona[] = [
      'FITNESS',
      'COMMUTER',
      'AGRICULTURE',
      'EVENT_PLANNER',
      'TRAVEL'
    ];

    if (report.status === 'RAIN_NEARBY') {
      if (highSensitivityPersonas.includes(activePersona)) {
        return 'HIGH';
      }
      return 'STANDARD';
    }

    // 3. Clear skies / no rain
    if (report.status === 'CLEAR_AROUND_YOU') {
      if (highSensitivityPersonas.includes(activePersona)) {
        return 'STANDARD';
      }
      return 'LOW';
    }

    return 'STANDARD';
  }
}
