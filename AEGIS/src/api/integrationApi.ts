// ============================================================================
// Specialized Domain APIs — Email, Shopping, Subscriptions, Travel, Security,
// Documents, and Calendar Mock Endpoints
// ============================================================================

import { request } from './apiClient';

// ----------------------------------------------------------------------------
// 1. Email Agent API
// ----------------------------------------------------------------------------
export const emailApi = {
  /** POST /api/email/scan */
  async scan(agentId = 'agent-email-02') {
    return request('POST', '/api/email/scan', {
      agentId,
      mockData: { scannedCount: 28, threatsDetected: 1, quarantined: 1 },
      delayMs: 120,
    });
  },

  /** POST /api/email/classify */
  async classify(emailId: string, agentId = 'agent-email-02') {
    return request('POST', '/api/email/classify', {
      agentId,
      payload: { emailId },
      mockData: {
        emailId,
        classification: 'phishing' as 'important' | 'normal' | 'newsletter' | 'spam' | 'phishing',
        confidence: 0.98,
        indicators: ['Mismatched return-path', 'Urgent wire transfer phrasing'],
      },
      delayMs: 100,
    });
  },

  /** GET /api/email/threats */
  async getThreats(agentId = 'agent-email-02') {
    return request('GET', '/api/email/threats', {
      agentId,
      mockData: [
        {
          id: 'thr-01',
          sender: 'accounts-payable@n3xuslabs.ai',
          subject: 'Urgent: Wire Confirmation Required for PO-8841',
          threatType: 'BEC Spear Phishing',
          quarantinedAt: new Date().toISOString(),
        },
      ],
      delayMs: 70,
    });
  },
};

// ----------------------------------------------------------------------------
// 2. Shopping Agent API
// ----------------------------------------------------------------------------
export const shoppingApi = {
  /** GET /api/shopping/search */
  async search(query: string, agentId = 'agent-shop-01') {
    return request('GET', `/api/shopping/search?q=${encodeURIComponent(query)}`, {
      agentId,
      mockData: [
        { sku: 'BOSE-QCU-BLK', name: 'Bose QuietComfort Ultra (Black)', price: 9499, retailer: 'Tata Cliq', inStock: true },
        { sku: 'BOSE-QCU-WHT', name: 'Bose QuietComfort Ultra (White)', price: 10299, retailer: 'Amazon India', inStock: true },
        { sku: 'SONY-WH1000XM5', name: 'Sony WH-1000XM5 ANC', price: 9990, retailer: 'Croma', inStock: true },
      ],
      delayMs: 130,
    });
  },

  /** POST /api/shopping/compare */
  async compare(skus: string[], agentId = 'agent-shop-01') {
    return request('POST', '/api/shopping/compare', {
      agentId,
      payload: { skus },
      mockData: {
        topRecommendation: 'BOSE-QCU-BLK',
        savings: '₹800 below MSRP',
        specsComparison: { batteryLife: '24 hrs', noiseCancelling: 'Top-tier', multipoint: true },
      },
      delayMs: 110,
    });
  },

  /** GET /api/shopping/recommend */
  async recommend(criteria: Record<string, unknown>, agentId = 'agent-shop-01') {
    return request('POST', '/api/shopping/recommend', {
      agentId,
      payload: criteria,
      mockData: {
        recommendedSku: 'BOSE-QCU-BLK',
        reason: 'Optimal match for ANC preference & under ₹10,000 threshold',
      },
      delayMs: 90,
    });
  },

  /** GET /api/shopping/price-check */
  async priceCheck(sku: string, agentId = 'agent-shop-01') {
    return request('GET', `/api/shopping/price-check?sku=${sku}`, {
      agentId,
      mockData: { sku, currentPrice: 9499, historicLow: 9499, targetPriceMet: true },
      delayMs: 60,
    });
  },

  /**
   * POST /api/shopping/purchase
   * STRICTLY SIMULATED — Never executes real monetary transactions
   */
  async purchase(sku: string, paymentMethod: string, agentId = 'agent-shop-01') {
    return request('POST', '/api/shopping/purchase', {
      agentId,
      payload: { sku, paymentMethod },
      mockData: {
        simulated: true,
        orderId: `SIM-ORD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        status: 'simulated_success',
        amount: 9499,
        currency: 'INR',
        receiptNote: 'Hackathon simulated purchase — No funds were moved.',
      },
      delayMs: 160,
    });
  },
};

// ----------------------------------------------------------------------------
// 3. Subscription Agent API
// ----------------------------------------------------------------------------
export const subscriptionApi = {
  /** GET /api/subscriptions */
  async getSubscriptions(agentId = 'agent-sub-05') {
    return request('GET', '/api/subscriptions', {
      agentId,
      mockData: [
        { id: 'sub-01', service: 'Figma Enterprise', seats: 20, activeUsers: 17, monthlyCost: 48000, renewsInDays: 14 },
        { id: 'sub-02', service: 'GitHub Copilot Enterprise', seats: 35, activeUsers: 34, monthlyCost: 42000, renewsInDays: 22 },
        { id: 'sub-03', service: 'Datadog APM', tier: 'Pro', usageRatio: '42%', monthlyCost: 32000, renewsInDays: 6 },
      ],
      delayMs: 70,
    });
  },

  /** POST /api/subscriptions/analyze */
  async analyze(agentId = 'agent-sub-05') {
    return request('POST', '/api/subscriptions/analyze', {
      agentId,
      mockData: {
        potentialMonthlySavings: 15200,
        underutilizedSubscriptions: ['Figma Enterprise (3 unused seats)', 'Datadog APM (Over-provisioned tier)'],
      },
      delayMs: 100,
    });
  },

  /** GET /api/subscriptions/:id/recommend */
  async recommend(subId: string, agentId = 'agent-sub-05') {
    return request('GET', `/api/subscriptions/${subId}/recommend`, {
      agentId,
      mockData: { subId, recommendation: 'Downgrade 3 unassigned seats on renewal date to save ₹7,200/mo' },
      delayMs: 50,
    });
  },

  /** POST /api/subscriptions/:id/action */
  async executeAction(subId: string, action: 'cancel' | 'downgrade' | 'renew', agentId = 'agent-sub-05') {
    return request('POST', `/api/subscriptions/${subId}/action`, {
      agentId,
      payload: { action },
      mockData: { simulated: true, subId, action, status: 'scheduled_on_renewal' },
      delayMs: 90,
    });
  },
};

// ----------------------------------------------------------------------------
// 4. Travel Agent API
// ----------------------------------------------------------------------------
export const travelApi = {
  /** POST /api/travel/search */
  async search(params: { from: string; to: string; date: string }) {
    return request('POST', '/api/travel/search', {
      agentId: 'agent-travel-06',
      payload: params,
      mockData: [
        { flightNumber: '6E-204', carrier: 'IndiGo', departure: '07:15', arrival: '09:45', price: 6850 },
        { flightNumber: 'AI-802', carrier: 'Air India', departure: '09:30', arrival: '12:10', price: 7420 },
      ],
      delayMs: 110,
    });
  },

  /** POST /api/travel/compare */
  async compare(flights: string[]) {
    return request('POST', '/api/travel/compare', {
      agentId: 'agent-travel-06',
      payload: { flights },
      mockData: { bestValue: '6E-204', savings: '₹570', onTimeRating: '94%' },
      delayMs: 80,
    });
  },

  /** GET /api/travel/itinerary */
  async getItinerary(tripId: string) {
    return request('GET', `/api/travel/itinerary?id=${tripId}`, {
      agentId: 'agent-travel-06',
      mockData: { tripId, destination: 'Bangalore Tech Summit', status: 'provisional' },
      delayMs: 50,
    });
  },

  /** POST /api/travel/approval */
  async requestApproval(bookingDetails: Record<string, unknown>) {
    return request('POST', '/api/travel/approval', {
      agentId: 'agent-travel-06',
      payload: bookingDetails,
      statusText: 'APPROVAL_REQUIRED',
      responseCode: 202,
      mockData: { approvalId: 'appr-trv-1', decision: 'approval_required', risk: 'medium' },
      delayMs: 90,
    });
  },
};

// ----------------------------------------------------------------------------
// 5. Security Agent API
// ----------------------------------------------------------------------------
export const securityApi = {
  /** POST /api/security/scan */
  async scan(agentId = 'agent-sec-04') {
    return request('POST', '/api/security/scan', {
      agentId,
      mockData: { tokensScanned: 84, anomalousTokens: 1, cloudPostureScore: 94 },
      delayMs: 130,
    });
  },

  /** GET /api/security/threats */
  async getThreats(agentId = 'agent-sec-04') {
    return request('GET', '/api/security/threats', {
      agentId,
      mockData: [
        { id: 'sec-thr-01', resource: 'OAuth Client #9921', issue: 'PII access from rogue IP', severity: 'high' },
      ],
      delayMs: 60,
    });
  },

  /** POST /api/security/evaluate */
  async evaluate(token: string, agentId = 'agent-sec-04') {
    return request('POST', '/api/security/evaluate', {
      agentId,
      payload: { token },
      mockData: { valid: true, scopedRoles: ['read:billing'], expired: false },
      delayMs: 70,
    });
  },

  /** GET /api/security/events */
  async getEvents(agentId = 'agent-sec-04') {
    return request('GET', '/api/security/events', {
      agentId,
      mockData: [
        { event: 'Token Revocation Queued', timestamp: new Date().toISOString(), by: 'Aegis Sentinel' },
        { event: 'Firewall Egress Rule Enforced', timestamp: new Date(Date.now() - 3600000).toISOString() },
      ],
      delayMs: 60,
    });
  },
};

// ----------------------------------------------------------------------------
// 6. Document Agent API
// ----------------------------------------------------------------------------
export const documentApi = {
  /** POST /api/documents/analyze */
  async analyze(docId: string) {
    return request('POST', '/api/documents/analyze', {
      agentId: 'agent-doc-07',
      payload: { docId },
      mockData: { docId, entitiesExtracted: 18, keyClauses: ['Payment within 30 days', 'Confidentiality surviving 3 yrs'] },
      delayMs: 140,
    });
  },

  /** GET /api/documents/:id */
  async getDoc(id: string) {
    return request('GET', `/api/documents/${id}`, {
      agentId: 'agent-doc-07',
      mockData: { id, title: 'Master Service Agreement 2026', pages: 12 },
      delayMs: 50,
    });
  },

  /** GET /api/documents/:id/summary */
  async summary(id: string) {
    return request('GET', `/api/documents/${id}/summary`, {
      agentId: 'agent-doc-07',
      mockData: { id, executiveSummary: 'Standard non-exclusive MSA with 14-day defect warranty.' },
      delayMs: 80,
    });
  },

  /** GET /api/documents/:id/actions */
  async extractActions(id: string) {
    return request('GET', `/api/documents/${id}/actions`, {
      agentId: 'agent-doc-07',
      mockData: { actions: ['Counter-sign Schedule B', 'Deposit escrow proof'] },
      delayMs: 60,
    });
  },
};

// ----------------------------------------------------------------------------
// 7. Calendar Agent API
// ----------------------------------------------------------------------------
export const calendarApi = {
  /** GET /api/calendar/events */
  async getEvents() {
    return request('GET', '/api/calendar/events', {
      agentId: 'agent-cal-08',
      mockData: [
        { id: 'ev-1', title: 'Aegis Architecture Sync', time: '14:00 - 14:30', attendees: ['maya@nexuslabs.ai'] },
        { id: 'ev-2', title: 'Hackathon Milestone Submission', time: '17:00 - 17:30', critical: true },
      ],
      delayMs: 50,
    });
  },

  /** GET /api/calendar/conflicts */
  async detectConflicts() {
    return request('GET', '/api/calendar/conflicts', {
      agentId: 'agent-cal-08',
      mockData: { hasConflict: false, freeTimeRemaining: '4.5 hrs' },
      delayMs: 40,
    });
  },

  /** POST /api/calendar/suggest */
  async suggestSlot(durationMinutes: number) {
    return request('POST', '/api/calendar/suggest', {
      agentId: 'agent-cal-08',
      payload: { durationMinutes },
      mockData: { recommendedSlot: '15:30 - 16:00', bufferTime: '15 mins' },
      delayMs: 60,
    });
  },

  /** POST /api/calendar/create */
  async createEvent(eventDetails: Record<string, unknown>) {
    return request('POST', '/api/calendar/create', {
      agentId: 'agent-cal-08',
      payload: eventDetails,
      mockData: { created: true, eventId: `cal-${Math.random().toString(36).substring(2, 6)}` },
      delayMs: 90,
    });
  },
};
