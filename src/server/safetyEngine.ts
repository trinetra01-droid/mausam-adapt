import { WarningRecord, WarningSeverity } from './types.js';

export interface SafetyCheckResult {
  hasOverride: boolean;
  severity: WarningSeverity;
  warning?: WarningRecord;
  officialBulletinMessage?: string;
  affectedArea?: string;
  sourceAttribution?: string;
  validPeriod?: { from: string; until: string };
  actionGuidance: string;
}

export class SafetyEngine {
  /**
   * Evaluates active official warnings for a target location and activity.
   * Runs BEFORE personalization. Official MoES / IMD / INCOIS warnings take supreme precedence.
   */
  static evaluateSafety(
    warnings: WarningRecord[],
    district: string,
    state: string
  ): SafetyCheckResult {
    const normDistrict = (district || '').trim().toLowerCase();
    const normState = (state || '').trim().toLowerCase();

    // Helper to test if two location names match meaningfully
    const isNameMatch = (a: string, b: string): boolean => {
      if (!a || !b || a.length < 2 || b.length < 2) return false;
      return a === b || a.includes(b) || b.includes(a);
    };

    // Helper to test if an affected area explicitly mentions a target term as a whole word or distinct clause
    const isAreaMentioned = (areaText: string, term: string): boolean => {
      if (!areaText || !term || term.length < 3) return false;
      const cleanArea = areaText.toLowerCase();
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i');
      return regex.test(cleanArea);
    };

    // Find active warnings affecting this location
    const matchedWarnings = warnings.filter((w) => {
      if (!w.is_active) return false;
      const wDistrict = (w.district || '').trim().toLowerCase();
      const wState = (w.state || '').trim().toLowerCase();
      const wArea = (w.affected_area || '').trim().toLowerCase();

      // If warning specifies a state that is explicitly distinct from the target state,
      // it CANNOT match unless the affected_area explicitly mentions the target district or state.
      if (normState && wState && !isNameMatch(normState, wState)) {
        const areaMentionsTarget = 
          (normDistrict && isAreaMentioned(wArea, normDistrict)) ||
          (normState && isAreaMentioned(wArea, normState));
        if (!areaMentionsTarget) {
          return false;
        }
      }

      // 1. Direct District match (both have valid district strings)
      const districtMatched = Boolean(
        normDistrict && wDistrict && isNameMatch(normDistrict, wDistrict)
      );

      // 2. Direct State match (both have valid state strings)
      const stateMatched = Boolean(
        normState && wState && isNameMatch(normState, wState)
      );

      // 3. Affected area explicitly mentions the district or state
      const areaMatched = Boolean(
        (normDistrict && isAreaMentioned(wArea, normDistrict)) ||
        (normState && isAreaMentioned(wArea, normState))
      );

      // If both target district and state are specified, ensure district doesn't clash with a different district
      // in the same state when warning is district-specific
      if (wDistrict && normDistrict && !districtMatched && !areaMatched) {
        // If the warning is strictly targeted to another district and doesn't mention our area
        if (stateMatched && wArea && !isAreaMentioned(wArea, normDistrict)) {
          return false;
        }
      }

      return districtMatched || stateMatched || areaMatched;
    });

    if (matchedWarnings.length === 0) {
      return {
        hasOverride: false,
        severity: 'NONE',
        actionGuidance: 'No active official severe weather warnings for this jurisdiction.'
      };
    }

    // Sort by severity hierarchy: RED > ORANGE > YELLOW > GREEN
    const severityRank: Record<WarningSeverity, number> = {
      RED: 4,
      ORANGE: 3,
      YELLOW: 2,
      GREEN: 1,
      NONE: 0
    };

    matchedWarnings.sort((a, b) => severityRank[b.severity] - severityRank[a.severity]);
    const topWarning = matchedWarnings[0];

    // RED warning: Absolute HARD SAFETY OVERRIDE
    if (topWarning.severity === 'RED') {
      return {
        hasOverride: true,
        severity: 'RED',
        warning: topWarning,
        officialBulletinMessage: `CRITICAL WEATHER WARNING (RED ALERT): ${topWarning.title}. ${topWarning.message}`,
        affectedArea: topWarning.affected_area,
        sourceAttribution: `Official ${topWarning.provider} Severe Weather Bulletin #${topWarning.bulletin_no || 'NA'}`,
        validPeriod: { from: topWarning.valid_from, until: topWarning.valid_until },
        actionGuidance: 'MANDATORY SAFETY OVERRIDE: Outdoor activities strongly discouraged by official disaster management guidelines. Take immediate precautions.'
      };
    }

    // ORANGE warning: Severe Warning with high risk override
    if (topWarning.severity === 'ORANGE') {
      return {
        hasOverride: true,
        severity: 'ORANGE',
        warning: topWarning,
        officialBulletinMessage: `SEVERE WEATHER WARNING (ORANGE ALERT): ${topWarning.title}. ${topWarning.message}`,
        affectedArea: topWarning.affected_area,
        sourceAttribution: `Official ${topWarning.provider} Weather Warning`,
        validPeriod: { from: topWarning.valid_from, until: topWarning.valid_until },
        actionGuidance: 'SAFETY ALERT: Be prepared for severe weather disruption. Plan indoor contingencies.'
      };
    }

    // YELLOW warning: Advisory / Watch
    if (topWarning.severity === 'YELLOW') {
      return {
        hasOverride: false, // Informs decision scoring rather than full lockout
        severity: 'YELLOW',
        warning: topWarning,
        officialBulletinMessage: `WEATHER WATCH (YELLOW ADVISORY): ${topWarning.title}. ${topWarning.message}`,
        affectedArea: topWarning.affected_area,
        sourceAttribution: `Official ${topWarning.provider} Advisory`,
        validPeriod: { from: topWarning.valid_from, until: topWarning.valid_until },
        actionGuidance: 'ADVISORY: Be updated. Weather conditions may change rapidly.'
      };
    }

    return {
      hasOverride: false,
      severity: 'GREEN',
      warning: topWarning,
      actionGuidance: 'Normal weather conditions reported by IMD.'
    };
  }
}
