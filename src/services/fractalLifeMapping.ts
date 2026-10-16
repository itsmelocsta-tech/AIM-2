import type {
  AIMProject,
  DailyPlan,
  FractalLifeDependency,
  FractalLifeMap,
  FractalLifeNode,
  FractalLifeNodeKind,
  Goal,
  LifeUpdate,
  LifeUpdateAnalysisResult,
  PersonalOperatingContext,
} from '../types';

const STOP_WORDS = new Set([
  'about', 'after', 'again', 'also', 'and', 'are', 'before', 'for', 'from', 'into',
  'its', 'next', 'our', 'that', 'the', 'their', 'then', 'this', 'today', 'toward',
  'was', 'were', 'what', 'when', 'with', 'your',
]);

function words(value: string): string[] {
  return Array.from(new Set(value.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/)
    .filter(word => word.length > 2 && !STOP_WORDS.has(word))));
}

function sharedWords(left: string, right: string): string[] {
  const rightWords = new Set(words(right));
  return words(left).filter(word => rightWords.has(word));
}

function related(left: string, right: string, minimum = 2): boolean {
  const normalizedLeft = left.trim().toLowerCase();
  const normalizedRight = right.trim().toLowerCase();
  if (!normalizedLeft || !normalizedRight) return false;
  if ((normalizedLeft.length > 4 && normalizedRight.includes(normalizedLeft)) ||
      (normalizedRight.length > 4 && normalizedLeft.includes(normalizedRight))) return true;
  return sharedWords(left, right).length >= minimum;
}

function key(kind: FractalLifeNodeKind, sourceId: string): string {
  return `${kind}:${sourceId}`;
}

function safeProgress(value: number | undefined): number | undefined {
  return typeof value === 'number' ? Math.max(0, Math.min(100, value)) : undefined;
}

function addDependency(
  dependencies: FractalLifeDependency[],
  seen: Set<string>,
  from: string,
  to: string,
  relation: FractalLifeDependency['relation'],
  strength: FractalLifeDependency['strength'],
) {
  const id = `${from}->${to}`;
  if (from === to || seen.has(id)) return;
  seen.add(id);
  dependencies.push({ id, from, to, relation, strength });
}

export interface BuildFractalLifeMapInput {
  goals: Goal[];
  projects: AIMProject[];
  dailyPlan: DailyPlan;
  context?: PersonalOperatingContext;
  lifeUpdates?: LifeUpdate[];
  now?: Date;
}

/**
 * Builds a read-only graph from AIM's existing records. It never creates a second
 * source of truth: every node keeps the source record ID and navigation target.
 */
export function buildFractalLifeMap(input: BuildFractalLifeMapInput): FractalLifeMap {
  const { goals, projects, dailyPlan, context, lifeUpdates = [], now = new Date() } = input;
  const latestUpdate = [...lifeUpdates].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
  const directKeys = new Set(latestUpdate?.dependencyImpact?.directNodeKeys || []);
  const propagatedKeys = new Set(latestUpdate?.dependencyImpact?.propagatedNodeKeys || []);
  for (const id of latestUpdate?.affectedGoalIds || []) directKeys.add(key('goal', id));
  for (const id of latestUpdate?.affectedProjectIds || []) directKeys.add(key('project', id));
  for (const id of latestUpdate?.affectedTaskIds || []) directKeys.add(key('task', id));
  for (const id of latestUpdate?.affectedTimeBlockIds || []) directKeys.add(key('time_block', id));

  const nodes: FractalLifeNode[] = [];
  const addNode = (node: Omit<FractalLifeNode, 'directlyAffected' | 'propagatedAffected'>) => {
    nodes.push({
      ...node,
      directlyAffected: directKeys.has(node.key),
      propagatedAffected: propagatedKeys.has(node.key),
    });
  };

  goals.slice(0, 8).forEach(goal => addNode({
    key: key('goal', goal.id), sourceId: goal.id, kind: 'goal', label: goal.title,
    detail: goal.why || `${goal.currentProgress}% complete`,
    status: goal.status === 'completed' ? 'completed' : goal.status === 'recalculating' ? 'changed' : 'active',
    progress: safeProgress(goal.currentProgress), category: goal.category, navigationTarget: 'goals',
  }));

  projects.slice().sort((a, b) => a.priority - b.priority).slice(0, 10).forEach(project => addNode({
    key: key('project', project.id), sourceId: project.id, kind: 'project', label: project.name,
    detail: project.nextAction || project.goal,
    status: project.status === 'completed' ? 'completed' : project.status === 'blocked' ? 'blocked' :
      project.status === 'paused' || project.status === 'waiting' ? 'paused' : 'active',
    progress: safeProgress(project.progress), category: project.category, navigationTarget: 'projects',
  }));

  dailyPlan.priorityTasks.slice(0, 8).forEach(task => addNode({
    key: key('task', task.id), sourceId: task.id, kind: 'task', label: task.task,
    detail: task.description || `${task.timeEstimate} · ${task.impact} impact`,
    status: task.completed ? 'completed' : 'planned', category: task.category, navigationTarget: 'planner',
  }));

  dailyPlan.timeBlocks.slice(0, 6).forEach(block => addNode({
    key: key('time_block', block.id), sourceId: block.id, kind: 'time_block', label: block.title,
    detail: `${block.time}${block.details ? ` · ${block.details}` : ''}`,
    status: block.completed ? 'completed' : 'planned', navigationTarget: 'planner',
  }));

  const latestCheckIn = context?.auditLog?.find(item =>
    item.eventType === 'context_update' || /check-?in/i.test(item.description)
  );
  if (latestCheckIn) addNode({
    key: key('check_in', latestCheckIn.id), sourceId: latestCheckIn.id, kind: 'check_in',
    label: 'Latest check-in', detail: latestCheckIn.description, status: 'changed', navigationTarget: 'check-in',
  });

  if (latestUpdate) addNode({
    key: key('life_update', latestUpdate.id), sourceId: latestUpdate.id, kind: 'life_update',
    label: latestUpdate.confirmedSummary || 'Latest life update',
    detail: latestUpdate.rerouteExplanation || latestUpdate.originalContent,
    status: latestUpdate.rerouteStatus === 'rerouted' ? 'changed' : 'planned', navigationTarget: 'life-update',
  });

  const nodeKeys = new Set(nodes.map(node => node.key));
  const dependencies: FractalLifeDependency[] = [];
  const seenDependencies = new Set<string>();

  for (const goal of goals) {
    for (const project of projects) {
      const categoryMatch = Boolean(project.category && project.category.toLowerCase() === goal.category.toLowerCase());
      const textMatch = related(`${goal.title} ${goal.why}`, `${project.name} ${project.goal} ${project.purpose}`);
      if (categoryMatch || textMatch) addDependency(
        dependencies, seenDependencies, key('goal', goal.id), key('project', project.id), 'supports',
        categoryMatch && textMatch ? 'direct' : 'contextual',
      );
    }
  }

  for (const project of projects) {
    const projectText = `${project.name} ${project.goal} ${project.purpose} ${project.nextAction}`;
    for (const task of dailyPlan.priorityTasks) {
      const categoryMatch = Boolean(project.category && project.category.toLowerCase() === task.category.toLowerCase());
      if (categoryMatch || related(projectText, `${task.task} ${task.description || ''}`)) {
        addDependency(dependencies, seenDependencies, key('project', project.id), key('task', task.id), 'supports',
          categoryMatch ? 'direct' : 'contextual');
      }
    }
  }

  for (const task of dailyPlan.priorityTasks) {
    for (const block of dailyPlan.timeBlocks) {
      if (related(`${task.task} ${task.description || ''}`, `${block.title} ${block.details}`, 1)) {
        addDependency(dependencies, seenDependencies, key('task', task.id), key('time_block', block.id), 'scheduled_as', 'direct');
      }
    }
  }

  if (latestCheckIn) {
    for (const project of projects) {
      if (related(latestCheckIn.description, `${project.name} ${project.goal} ${project.whatChanged}`, 1)) {
        addDependency(dependencies, seenDependencies, key('check_in', latestCheckIn.id), key('project', project.id), 'reported_by', 'direct');
      }
    }
  }

  if (latestUpdate) {
    for (const target of directKeys) {
      if (nodeKeys.has(target)) addDependency(dependencies, seenDependencies, key('life_update', latestUpdate.id), target, 'changed_by', 'direct');
    }
  }

  const visibleDependencies = dependencies.filter(edge => nodeKeys.has(edge.from) && nodeKeys.has(edge.to));
  return {
    nodes,
    dependencies: visibleDependencies,
    generatedAt: now.toISOString(),
    summary: {
      goals: nodes.filter(node => node.kind === 'goal' && node.status !== 'completed').length,
      projects: nodes.filter(node => node.kind === 'project' && node.status !== 'completed').length,
      openTasks: nodes.filter(node => node.kind === 'task' && node.status !== 'completed').length,
      blocked: nodes.filter(node => node.status === 'blocked').length,
      recentlyChanged: nodes.filter(node => node.directlyAffected || node.propagatedAffected || node.status === 'changed').length,
    },
  };
}

function inferSeedKeys(analysis: LifeUpdateAnalysisResult, map: FractalLifeMap): string[] {
  const text = [analysis.importantLifeChange, ...analysis.entities, ...analysis.categories].join(' ');
  const sourceWords = new Set(words(text));
  return map.nodes
    .map(node => ({
      node,
      score: words(`${node.label} ${node.detail} ${node.category || ''}`).filter(word => sourceWords.has(word)).length,
    }))
    .filter(match => match.score >= 2)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map(match => match.node.key);
}

/** Expands only downstream dependencies and leaves the existing reroute confirmation gate intact. */
export function propagateLifeUpdateImpact(
  analysis: LifeUpdateAnalysisResult,
  map: FractalLifeMap,
): LifeUpdateAnalysisResult {
  const direct = new Set<string>();
  for (const id of analysis.affectedGoalIds || []) direct.add(key('goal', id));
  for (const id of analysis.affectedProjectIds || []) direct.add(key('project', id));
  for (const id of analysis.affectedTaskIds || []) direct.add(key('task', id));
  for (const id of analysis.affectedTimeBlockIds || []) direct.add(key('time_block', id));
  if (direct.size === 0 && analysis.planImpact !== 'none') inferSeedKeys(analysis, map).forEach(item => direct.add(item));

  const propagated = new Set<string>();
  if (analysis.planImpact !== 'none') {
    let frontier = [...direct];
    for (let depth = 0; depth < 3 && frontier.length; depth += 1) {
      const next: string[] = [];
      for (const current of frontier) {
        for (const edge of map.dependencies) {
          if (edge.from !== current || !['supports', 'scheduled_as'].includes(edge.relation)) continue;
          if (!direct.has(edge.to) && !propagated.has(edge.to)) {
            propagated.add(edge.to);
            next.push(edge.to);
          }
        }
      }
      frontier = next;
    }
  }

  const all = new Set([...direct, ...propagated]);
  const idsFor = (kind: FractalLifeNodeKind, existing: string[] = []) => Array.from(new Set([
    ...existing,
    ...map.nodes.filter(node => node.kind === kind && all.has(node.key)).map(node => node.sourceId),
  ]));
  const propagatedByKind = (kind: FractalLifeNodeKind) => map.nodes.filter(node =>
    node.kind === kind && propagated.has(node.key)
  ).length;
  const explanations = [
    ['project', 'project'], ['task', 'planner task'], ['time_block', 'time block'],
  ].flatMap(([kindName, label]) => {
    const count = propagatedByKind(kindName as FractalLifeNodeKind);
    return count ? [`Connected ${count} downstream ${label}${count === 1 ? '' : 's'} for review.`] : [];
  });

  return {
    ...analysis,
    affectedGoalIds: idsFor('goal', analysis.affectedGoalIds),
    affectedProjectIds: idsFor('project', analysis.affectedProjectIds),
    affectedTaskIds: idsFor('task', analysis.affectedTaskIds),
    affectedTimeBlockIds: idsFor('time_block', analysis.affectedTimeBlockIds),
    dependencyImpact: {
      directNodeKeys: [...direct],
      propagatedNodeKeys: [...propagated],
      explanations,
    },
  };
}
