export type FractalLifeNodeKind =
  | 'goal'
  | 'project'
  | 'task'
  | 'time_block'
  | 'check_in'
  | 'life_update';

export type FractalLifeNodeStatus =
  | 'active'
  | 'planned'
  | 'blocked'
  | 'paused'
  | 'completed'
  | 'changed';

export interface FractalLifeNode {
  key: string;
  sourceId: string;
  kind: FractalLifeNodeKind;
  label: string;
  detail: string;
  status: FractalLifeNodeStatus;
  progress?: number;
  category?: string;
  navigationTarget: 'goals' | 'projects' | 'planner' | 'check-in' | 'life-update';
  directlyAffected: boolean;
  propagatedAffected: boolean;
}

export interface FractalLifeDependency {
  id: string;
  from: string;
  to: string;
  relation: 'supports' | 'scheduled_as' | 'reported_by' | 'changed_by';
  strength: 'direct' | 'contextual';
}

export interface FractalLifeMap {
  nodes: FractalLifeNode[];
  dependencies: FractalLifeDependency[];
  generatedAt: string;
  summary: {
    goals: number;
    projects: number;
    openTasks: number;
    blocked: number;
    recentlyChanged: number;
  };
}

export interface FractalDependencyImpact {
  directNodeKeys: string[];
  propagatedNodeKeys: string[];
  explanations: string[];
}
