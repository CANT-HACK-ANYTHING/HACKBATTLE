// State Machine Definitions & Landmark Registry

export const PHASES = [
  {
    id: 1,
    name: 'STANDBY',
    title: 'System Standby',
    subtitle: 'Spatial grid active • Anchors listening',
    description: 'Autonomous agent awaiting directive. Memory graph initialized in low-power surveillance mode.',
    duration: 3500,
  },
  {
    id: 2,
    name: 'MEMORY_ACTIVATION',
    title: 'Context & Landmark Activation',
    subtitle: 'Extracting semantic nodes from ERP layout',
    description: 'Neural landmark graph identifies Vendor, Amount, Submit button, and Compliance contexts.',
    duration: 4000,
  },
  {
    id: 3,
    name: 'AGENT_VENDOR',
    title: 'Autonomous Navigation: Vendor Field',
    subtitle: 'Kinematic trajectory mapped • Entering supplier',
    description: 'Virtual cursor glides along cubic-bezier path. AI inputs "ACME INDUSTRIAL SUPPLY CORP" with natural cadence.',
    duration: 5500,
  },
  {
    id: 4,
    name: 'AGENT_AMOUNT',
    title: 'Autonomous Navigation: Invoice Amount',
    subtitle: 'Targeting financial input • Cadenced typing',
    description: 'Cursor repositions to amount field. AI enters formatted procurement total "₹48,250.00".',
    duration: 5000,
  },
  {
    id: 5,
    name: 'DRIFT_DETECTED',
    title: 'Anomaly Alert: Submit Landmark Drift',
    subtitle: 'UI layout perturbation detected by spatial tracker',
    description: 'Target "SUBMIT" button was displaced by simulated responsive shift/DOM update. Position delta detected!',
    duration: 4500,
  },
  {
    id: 6,
    name: 'RELOCALIZATION',
    title: 'Dynamic Vector Relocalization',
    subtitle: 'Generating vector from expected to actual target',
    description: 'Spatial memory graph recalculates offset vector. Target lock acquired with 99.8% computer vision confidence.',
    duration: 6000,
  },
  {
    id: 7,
    name: 'GUARDRAIL_CHECK',
    title: 'Guardrails & Trust: Boundary Verification',
    subtitle: 'Pre-execution safety and policy evaluation',
    description: 'Verifying PO integrity, vendor authorization, and expenditure policy limit before permitting click.',
    duration: 5000,
  },
  {
    id: 8,
    name: 'EXECUTION',
    title: 'Autonomous Action: Button Depressed',
    subtitle: 'Hardware-level click emulation & transaction dispatch',
    description: 'Cursor depresses relocalized button. ERP progresses through Checking -> Validating -> Submitted.',
    duration: 5500,
  },
  {
    id: 9,
    name: 'COMPLETE',
    title: 'Mission Complete — Audit Verified',
    subtitle: 'Legacy interaction accomplished without chat-box confinement',
    description: 'Purchase order processed successfully into Legacy ERP database. Full spatial telemetry archived.',
    duration: 5000,
  }
];

export const MOCK_ERP_DATA = {
  poNumber: 'PO-2026-8841-B',
  costCenter: 'CC-ENG-702 (AUTOMATION)',
  vendorTarget: 'ACME INDUSTRIAL SUPPLY CORP',
  amountTarget: '₹48,250.00',
  amountTargetViolating: '₹840,000.00', // Exceeds ₹100,000 policy threshold for failure demo
  invoiceRef: 'INV-2048-DX',
  taxId: '27AAACA0000A1Z5',
  date: '2026-09-12',
  statusInit: 'IDLE / AWAITING INPUT',
};

// Drift coordinates relative to standard button center
export const DRIFT_OFFSETS = {
  dx: 76,
  dy: 42,
  distance: 86.83, // sqrt(76^2 + 42^2)
  angleDeg: 28.9,
};
