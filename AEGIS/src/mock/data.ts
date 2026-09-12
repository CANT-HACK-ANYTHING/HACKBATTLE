import type {
  Agent, Memory, Entity, Relationship, Action,
  Approval, ActivityEvent, GraphNode, TrustConfig
} from '../types';

// ============================================================
// MOCK DATA — Replace with real API calls for backend integration
// ============================================================

export const mockAgent: Agent = {
  id: 'agent-001',
  name: 'Rescue AI',
  description: 'An intelligent agentic system for VIT Hackathon project coordination, automation, and knowledge management.',
  status: 'idle',
  createdAt: '2026-09-10T08:00:00Z',
  lastActiveAt: '2026-09-12T18:20:00Z',
  permissions: ['read_memory', 'write_memory', 'create_task', 'send_notification', 'update_record'],
  memoryCount: 14,
  actionCount: 6,
};

export const mockMemories: Memory[] = [
  {
    id: 'mem-001',
    title: 'VIT Hackathon Project',
    content: 'This is the core project context for the 36-hour AI hackathon at VIT. The project focuses on building an agentic AI system with memory, relationships, and human-in-the-loop approvals.',
    importance: 98,
    confidence: 100,
    createdAt: '2026-09-10T08:00:00Z',
    updatedAt: '2026-09-12T15:30:00Z',
    source: 'User input',
    tags: ['hackathon', 'core', 'project'],
    agentId: 'agent-001',
  },
  {
    id: 'mem-002',
    title: 'Frontend Architecture',
    content: 'React + Vite + TypeScript + Tailwind CSS + Framer Motion + React Flow. Component-based architecture with Zustand for state management.',
    importance: 90,
    confidence: 95,
    createdAt: '2026-09-10T09:00:00Z',
    updatedAt: '2026-09-12T16:00:00Z',
    source: 'Planning session',
    tags: ['frontend', 'architecture', 'tech'],
    agentId: 'agent-001',
  },
  {
    id: 'mem-003',
    title: 'Agentic Workflow Design',
    content: 'The agentic loop: Perceive → Think → Plan → Act → Monitor. Human approval required for high-risk actions. Trust boundaries enforced at the framework level.',
    importance: 85,
    confidence: 88,
    createdAt: '2026-09-10T10:00:00Z',
    updatedAt: '2026-09-12T14:00:00Z',
    source: 'Team brainstorm',
    tags: ['workflow', 'agent', 'design'],
    agentId: 'agent-001',
  },
  {
    id: 'mem-004',
    title: 'User Approval Protocol',
    content: 'All external actions with risk level medium or higher require explicit human approval. The AI must show reasoning and expected impact before requesting approval.',
    importance: 92,
    confidence: 100,
    createdAt: '2026-09-10T11:00:00Z',
    updatedAt: '2026-09-12T12:00:00Z',
    source: 'Safety guidelines',
    tags: ['approval', 'safety', 'human-in-loop'],
    agentId: 'agent-001',
  },
];

export const mockEntities: Entity[] = [
  {
    id: 'ent-001',
    name: 'Frontend Team',
    type: 'person',
    description: 'UI/UX and React development team responsible for the knowledge graph dashboard and interaction design.',
    importance: 88,
    confidence: 95,
    createdAt: '2026-09-10T08:30:00Z',
    updatedAt: '2026-09-12T17:00:00Z',
    source: 'Project setup',
    tags: ['team', 'frontend', 'vit'],
  },
  {
    id: 'ent-002',
    name: 'Automation Engine',
    type: 'entity',
    description: 'Backend automation system that executes approved tasks, manages schedules, and triggers workflows.',
    importance: 82,
    confidence: 78,
    createdAt: '2026-09-10T09:30:00Z',
    updatedAt: '2026-09-12T13:00:00Z',
    source: 'System design doc',
    tags: ['automation', 'backend', 'engine'],
  },
  {
    id: 'ent-003',
    name: 'Knowledge Graph DB',
    type: 'document',
    description: 'Graph database storing entity relationships, memories, and context for the AI agent.',
    importance: 79,
    confidence: 85,
    createdAt: '2026-09-10T10:30:00Z',
    updatedAt: '2026-09-12T11:00:00Z',
    source: 'Architecture doc',
    tags: ['database', 'graph', 'storage'],
  },
  {
    id: 'ent-004',
    name: 'Demo Presentation',
    type: 'event',
    description: 'Scheduled hackathon demo at VIT. AI must be demo-ready with all major flows working: graph, approval, activity.',
    importance: 96,
    confidence: 100,
    createdAt: '2026-09-11T08:00:00Z',
    updatedAt: '2026-09-12T18:00:00Z',
    source: 'Calendar',
    tags: ['event', 'deadline', 'demo'],
  },
  {
    id: 'ent-005',
    name: 'Project Context',
    type: 'memory',
    description: 'Comprehensive context about the VIT hackathon goals: build an AI with visible memory, reasoning, and trust guardrails.',
    importance: 91,
    confidence: 98,
    createdAt: '2026-09-10T08:00:00Z',
    updatedAt: '2026-09-12T15:00:00Z',
    source: 'Kickoff meeting',
    tags: ['context', 'goals', 'hackathon'],
  },
  {
    id: 'ent-006',
    name: 'API Integration Layer',
    type: 'entity',
    description: 'REST API bridge between the frontend mock state and the real backend AI agents. Teammates will replace mock functions here.',
    importance: 75,
    confidence: 70,
    createdAt: '2026-09-11T12:00:00Z',
    updatedAt: '2026-09-12T10:00:00Z',
    source: 'Integration plan',
    tags: ['api', 'integration', 'backend'],
  },
  {
    id: 'ent-007',
    name: 'Trust Guardrails',
    type: 'entity',
    description: 'Permission framework that limits AI actions, enforces approval requirements, and logs all activities for audit.',
    importance: 94,
    confidence: 99,
    createdAt: '2026-09-10T14:00:00Z',
    updatedAt: '2026-09-12T16:30:00Z',
    source: 'Safety design',
    tags: ['trust', 'safety', 'guardrails'],
  },
  {
    id: 'ent-008',
    name: 'Memory Store',
    type: 'memory',
    description: 'Vector + graph memory store for the AI. Allows semantic search, context retrieval, and relationship mapping.',
    importance: 87,
    confidence: 92,
    createdAt: '2026-09-10T15:00:00Z',
    updatedAt: '2026-09-12T14:30:00Z',
    source: 'Architecture review',
    tags: ['memory', 'vector', 'semantic'],
  },
];

export const mockRelationships: Relationship[] = [
  { id: 'rel-001', sourceId: 'agent-001', targetId: 'mem-001', label: 'core context', strength: 100, type: 'contains', createdAt: '2026-09-10T08:00:00Z' },
  { id: 'rel-002', sourceId: 'agent-001', targetId: 'mem-002', label: 'technical plan', strength: 90, type: 'contains', createdAt: '2026-09-10T09:00:00Z' },
  { id: 'rel-003', sourceId: 'agent-001', targetId: 'mem-003', label: 'workflow design', strength: 85, type: 'contains', createdAt: '2026-09-10T10:00:00Z' },
  { id: 'rel-004', sourceId: 'agent-001', targetId: 'mem-004', label: 'approval protocol', strength: 92, type: 'contains', createdAt: '2026-09-10T11:00:00Z' },
  { id: 'rel-005', sourceId: 'agent-001', targetId: 'ent-001', label: 'managed by', strength: 88, type: 'relates_to', createdAt: '2026-09-10T08:30:00Z' },
  { id: 'rel-006', sourceId: 'agent-001', targetId: 'ent-002', label: 'controls', strength: 82, type: 'triggers', createdAt: '2026-09-10T09:30:00Z' },
  { id: 'rel-007', sourceId: 'agent-001', targetId: 'ent-007', label: 'operates within', strength: 94, type: 'depends_on', createdAt: '2026-09-10T14:00:00Z' },
  { id: 'rel-008', sourceId: 'mem-001', targetId: 'ent-004', label: 'leads to', strength: 96, type: 'produces', createdAt: '2026-09-11T08:00:00Z' },
  { id: 'rel-009', sourceId: 'mem-001', targetId: 'ent-005', label: 'provides', strength: 91, type: 'contains', createdAt: '2026-09-10T08:00:00Z' },
  { id: 'rel-010', sourceId: 'mem-002', targetId: 'ent-001', label: 'implemented by', strength: 88, type: 'relates_to', createdAt: '2026-09-10T09:00:00Z' },
  { id: 'rel-011', sourceId: 'mem-003', targetId: 'ent-002', label: 'orchestrates', strength: 82, type: 'triggers', createdAt: '2026-09-10T10:00:00Z' },
  { id: 'rel-012', sourceId: 'mem-004', targetId: 'ent-007', label: 'defined by', strength: 94, type: 'depends_on', createdAt: '2026-09-10T11:00:00Z' },
  { id: 'rel-013', sourceId: 'ent-002', targetId: 'ent-003', label: 'reads from', strength: 79, type: 'depends_on', createdAt: '2026-09-10T09:30:00Z' },
  { id: 'rel-014', sourceId: 'ent-003', targetId: 'ent-008', label: 'persisted in', strength: 87, type: 'contains', createdAt: '2026-09-10T15:00:00Z' },
  { id: 'rel-015', sourceId: 'ent-006', targetId: 'ent-001', label: 'serves', strength: 75, type: 'relates_to', createdAt: '2026-09-11T12:00:00Z' },
];

export const mockActions: Action[] = [
  {
    id: 'act-001',
    agentId: 'agent-001',
    title: 'Create Task: Finalize Demo Script',
    description: 'Create a task card in the project board for writing and rehearsing the hackathon demo script, with assigned owner and deadline.',
    reasoning: 'Based on memory "VIT Hackathon Project" and entity "Demo Presentation", the demo is approaching and a structured script will maximize impact. I detected no existing task for this.',
    expectedImpact: 'Team gets a clear action item. Demo quality improves. Risk of missing demo steps reduced by ~70%.',
    riskLevel: 'low',
    status: 'pending',
    requiresApproval: true,
    createdAt: '2026-09-12T18:20:00Z',
    entityIds: ['ent-004', 'ent-001'],
    parameters: { title: 'Finalize Demo Script', assignee: 'Frontend Team', deadline: '2026-09-13T09:00:00Z' },
  },
  {
    id: 'act-002',
    agentId: 'agent-001',
    title: 'Update Memory: API Integration Status',
    description: 'Update the memory store with the current API integration progress and blockers.',
    reasoning: 'The API integration entity shows low confidence (70%). Updating with current status will help the AI make better decisions about task prioritization.',
    expectedImpact: 'Improved context accuracy. Better task recommendations from the AI.',
    riskLevel: 'low',
    status: 'completed',
    requiresApproval: false,
    createdAt: '2026-09-12T17:00:00Z',
    completedAt: '2026-09-12T17:01:00Z',
    entityIds: ['ent-006', 'ent-008'],
  },
  {
    id: 'act-003',
    agentId: 'agent-001',
    title: 'Send Notification: Demo Reminder',
    description: 'Send a push notification to all team members reminding them of the demo time and preparation checklist.',
    reasoning: 'Demo Presentation entity has high importance (96%) and the event is within 24 hours. Proactive notification will ensure team readiness.',
    expectedImpact: 'All team members reminded. Preparation checklist acknowledged. Risk of unpreparedness reduced.',
    riskLevel: 'medium',
    status: 'pending',
    requiresApproval: true,
    createdAt: '2026-09-12T18:15:00Z',
    entityIds: ['ent-004', 'ent-001'],
    parameters: { channel: 'team-notifications', urgency: 'high' },
  },
];

export const mockApprovals: Approval[] = [
  {
    id: 'appr-001',
    actionId: 'act-001',
    agentId: 'agent-001',
    requestedAt: '2026-09-12T18:20:00Z',
  },
  {
    id: 'appr-002',
    actionId: 'act-003',
    agentId: 'agent-001',
    requestedAt: '2026-09-12T18:15:00Z',
  },
];

export const mockActivityEvents: ActivityEvent[] = [
  { id: 'ev-001', agentId: 'agent-001', type: 'learned', title: 'Learned: Demo Presentation date', description: 'Extracted demo date from calendar event and stored in memory graph.', entityId: 'ent-004', timestamp: '2026-09-12T18:10:00Z', importance: 'high' },
  { id: 'ev-002', agentId: 'agent-001', type: 'connected', title: 'Connected: Frontend Architecture → Frontend Team', description: 'Established relationship between tech stack memory and team entity.', entityId: 'ent-001', timestamp: '2026-09-12T17:55:00Z', importance: 'medium' },
  { id: 'ev-003', agentId: 'agent-001', type: 'updated', title: 'Updated: API Integration confidence', description: 'Revised confidence score from 65% to 70% based on new information.', entityId: 'ent-006', timestamp: '2026-09-12T17:01:00Z', importance: 'low' },
  { id: 'ev-004', agentId: 'agent-001', type: 'executed', title: 'Executed: Update Memory action', description: 'Successfully updated API Integration Status memory with current progress.', entityId: 'ent-008', timestamp: '2026-09-12T17:01:00Z', importance: 'medium' },
  { id: 'ev-005', agentId: 'agent-001', type: 'triggered', title: 'Triggered: Approval Request for Task Creation', description: 'Requested human approval to create a demo script task.', entityId: 'act-001', timestamp: '2026-09-12T18:20:00Z', importance: 'high' },
  { id: 'ev-006', agentId: 'agent-001', type: 'remembered', title: 'Remembered: Agentic Workflow Design', description: 'Retrieved workflow design memory to plan next automation sequence.', entityId: 'mem-003', timestamp: '2026-09-12T16:30:00Z', importance: 'medium' },
  { id: 'ev-007', agentId: 'agent-001', type: 'connected', title: 'Connected: Trust Guardrails → Approval Protocol', description: 'Linked trust framework entity with user approval protocol memory.', entityId: 'ent-007', timestamp: '2026-09-12T16:00:00Z', importance: 'high' },
  { id: 'ev-008', agentId: 'agent-001', type: 'learned', title: 'Learned: Frontend Architecture details', description: 'Processed and stored technical architecture decisions in knowledge graph.', entityId: 'mem-002', timestamp: '2026-09-12T15:45:00Z', importance: 'medium' },
];

export const mockTrustConfig: TrustConfig = {
  allowedActions: ['read_memory', 'write_memory', 'create_task', 'send_notification', 'update_record', 'search_database'],
  blockedActions: ['delete_record', 'send_email_external', 'access_financial_data', 'modify_permissions', 'execute_code'],
  maxRiskLevel: 'medium',
  requireApprovalFor: ['create_task', 'send_notification', 'update_record'],
  autonomyLevel: 45,
};

// Graph node layout positions (radial around center)
export const getGraphNodes = (): GraphNode[] => {
  const centerX = 0;
  const centerY = 0;

  const rings = [
    // Ring 1: Memories (close orbit)
    { id: 'mem-001', type: 'memory' as const, angle: 315, radius: 200 },
    { id: 'mem-002', type: 'memory' as const, angle: 45, radius: 200 },
    { id: 'mem-003', type: 'memory' as const, angle: 135, radius: 200 },
    { id: 'mem-004', type: 'memory' as const, angle: 225, radius: 200 },
    // Ring 2: Entities (outer orbit)
    { id: 'ent-001', type: 'person' as const, angle: 0, radius: 380 },
    { id: 'ent-002', type: 'entity' as const, angle: 60, radius: 380 },
    { id: 'ent-003', type: 'document' as const, angle: 120, radius: 380 },
    { id: 'ent-004', type: 'event' as const, angle: 180, radius: 380 },
    { id: 'ent-005', type: 'memory' as const, angle: 240, radius: 380 },
    { id: 'ent-006', type: 'entity' as const, angle: 300, radius: 380 },
    { id: 'ent-007', type: 'entity' as const, angle: 30, radius: 500 },
    { id: 'ent-008', type: 'memory' as const, angle: 150, radius: 500 },
  ];

  const allNodes: GraphNode[] = [
    {
      id: 'agent-001',
      type: 'agent',
      label: 'Rescue AI',
      description: mockAgent.description,
      importance: 100,
      confidence: 100,
      x: centerX,
      y: centerY,
      tags: ['agent', 'core'],
      source: 'System',
      createdAt: mockAgent.createdAt,
      updatedAt: mockAgent.lastActiveAt,
    },
  ];

  rings.forEach(({ id, type, angle, radius }) => {
    const rad = (angle * Math.PI) / 180;
    const x = centerX + radius * Math.cos(rad);
    const y = centerY + radius * Math.sin(rad);

    const source =
      id.startsWith('mem-')
        ? mockMemories.find(m => m.id === id)
        : mockEntities.find(e => e.id === id);

    if (!source) return;

    if (id.startsWith('mem-')) {
      const mem = source as Memory;
      allNodes.push({
        id,
        type,
        label: mem.title,
        description: mem.content,
        importance: mem.importance,
        confidence: mem.confidence,
        x,
        y,
        tags: mem.tags,
        source: mem.source,
        createdAt: mem.createdAt,
        updatedAt: mem.updatedAt,
      });
    } else {
      const ent = source as Entity;
      allNodes.push({
        id,
        type,
        label: ent.name,
        description: ent.description,
        importance: ent.importance,
        confidence: ent.confidence,
        x,
        y,
        tags: ent.tags,
        source: ent.source,
        createdAt: ent.createdAt,
        updatedAt: ent.updatedAt,
      });
    }
  });

  return allNodes;
};
