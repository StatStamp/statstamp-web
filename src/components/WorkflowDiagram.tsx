'use client';

import { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  Position,
  type Node,
  type Edge,
  type NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import type { CollectionWorkflow, WorkflowStep, CollectionEventType } from '@/hooks/collections';

// ── Layout constants ─────────────────────────────────────────────────────────

const NODE_WIDTH = 220;
const STEP_NODE_BASE_HEIGHT = 60;
const DONE_NODE_WIDTH = 72;
const DONE_NODE_HEIGHT = 32;

// ── Dagre layout helper ──────────────────────────────────────────────────────

function layoutGraph(nodes: Node[], edges: Edge[]): Node[] {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'LR', nodesep: 240, ranksep: 260 });

  nodes.forEach((n) => {
    g.setNode(n.id, { width: n.width ?? NODE_WIDTH, height: n.height ?? STEP_NODE_BASE_HEIGHT });
  });
  edges.forEach((e) => {
    // Skip back-edges from dagre layout so it doesn't invert ranks
    if (!e.data?.isBackEdge) {
      g.setEdge(e.source, e.target);
    }
  });

  dagre.layout(g);

  return nodes.map((n) => {
    const pos = g.node(n.id);
    return {
      ...n,
      position: {
        x: pos.x - (n.width ?? NODE_WIDTH) / 2,
        y: pos.y - (n.height ?? STEP_NODE_BASE_HEIGHT) / 2,
      },
    };
  });
}

// ── Custom node components ───────────────────────────────────────────────────

interface StepNodeData {
  prompt: string;
  isEntry: boolean;
  isEditing: boolean;
  onClick?: () => void;
  [key: string]: unknown;
}

function StepNode({ data }: NodeProps<Node<StepNodeData>>) {
  return (
    <div
      onClick={data.onClick}
      className={[
        'rounded-lg border bg-white dark:bg-zinc-900 px-3 py-2.5 shadow-sm',
        'text-sm text-zinc-800 dark:text-zinc-100',
        data.isEntry
          ? 'border-l-4 border-l-green-500 border-zinc-200 dark:border-zinc-700'
          : 'border-zinc-200 dark:border-zinc-700',
        data.isEditing
          ? 'cursor-pointer hover:border-zinc-400 dark:hover:border-zinc-500 hover:shadow-md transition-all'
          : '',
      ].join(' ')}
      style={{ width: NODE_WIDTH }}
    >
      <p className="font-medium leading-snug line-clamp-3">{data.prompt}</p>
      <Handle type="target" position={Position.Left} className="!bg-zinc-400 dark:!bg-zinc-500 !w-2 !h-2" />
      <Handle type="source" position={Position.Right} className="!bg-zinc-400 dark:!bg-zinc-500 !w-2 !h-2" />
      {/* Extra handles on the bottom for back-edge routing (circular references) */}
      <Handle id="bottom-source" type="source" position={Position.Bottom} className="!bg-zinc-400 dark:!bg-zinc-500 !w-2 !h-2" />
      <Handle id="bottom-target" type="target" position={Position.Bottom} className="!bg-zinc-400 dark:!bg-zinc-500 !w-2 !h-2" />
    </div>
  );
}

interface DoneNodeData {
  [key: string]: unknown;
}

function DoneNode(_: NodeProps<Node<DoneNodeData>>) {
  return (
    <div
      className="rounded-full border border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-800 px-3 py-1 text-xs font-medium text-zinc-500 dark:text-zinc-400"
      style={{ width: DONE_NODE_WIDTH }}
    >
      Done
      <Handle type="target" position={Position.Left} className="!bg-zinc-300 dark:!bg-zinc-600 !w-2 !h-2" />
    </div>
  );
}

const nodeTypes = { step: StepNode, done: DoneNode };

// ── Cycle detection + graph build ────────────────────────────────────────────

function buildNodesAndEdges(
  workflow: CollectionWorkflow,
  eventTypes: CollectionEventType[],
  isEditing: boolean,
  onStepClick?: (stepId: string) => void,
): { nodes: Node[]; edges: Edge[] } {
  const { steps, first_step_id } = workflow;
  const stepMap = new Map<string, WorkflowStep>(steps.map((s) => [s.id, s]));
  const etMap = new Map<string, CollectionEventType>(eventTypes.map((et) => [et.id, et]));

  // BFS traversal to get step order and detect back-edges
  const orderedSteps: WorkflowStep[] = [];
  const visited = new Set<string>();
  const queue: string[] = first_step_id ? [first_step_id] : [];

  while (queue.length > 0) {
    const stepId = queue.shift()!;
    if (visited.has(stepId)) continue;
    visited.add(stepId);
    const step = stepMap.get(stepId);
    if (!step) continue;
    orderedSteps.push(step);
    for (const opt of step.options) {
      if (opt.next_step_id) queue.push(opt.next_step_id);
    }
  }

  // Add any orphaned steps (no path from first_step_id)
  for (const step of steps) {
    if (!visited.has(step.id)) orderedSteps.push(step);
  }

  // Assign each step a display number for back-edge labels
  const stepIndex = new Map<string, number>(orderedSteps.map((s, i) => [s.id, i + 1]));

  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const doneNodeId = `${workflow.id}-done`;
  let hasDoneNode = false;

  // Step nodes
  for (const step of orderedSteps) {
    nodes.push({
      id: step.id,
      type: 'step',
      position: { x: 0, y: 0 }, // dagre will set this
      width: NODE_WIDTH,
      height: STEP_NODE_BASE_HEIGHT,
      data: {
        prompt: step.prompt,
        isEntry: step.id === first_step_id,
        isEditing,
        onClick: isEditing && onStepClick ? () => onStepClick(step.id) : undefined,
      } satisfies StepNodeData,
    });

    // Option edges
    const visitedInBFS = new Set<string>(orderedSteps.map((s) => s.id).slice(0, stepIndex.get(step.id)));
    for (const opt of step.options) {
      const targetId = opt.next_step_id ?? doneNodeId;
      const isBackEdge = opt.next_step_id !== null && visitedInBFS.has(opt.next_step_id) && opt.next_step_id !== step.id
        ? false // forward-to-earlier-step: still a back-edge visually but not by BFS order alone
        : opt.next_step_id !== null && stepIndex.has(opt.next_step_id) && stepIndex.get(opt.next_step_id)! < stepIndex.get(step.id)!;

      if (!opt.next_step_id) hasDoneNode = true;

      // Build edge label
      const parts: string[] = [opt.label];
      if (opt.event_type_id) {
        const et = etMap.get(opt.event_type_id);
        if (et) parts.push(`[${et.abbreviation}]`);
      }
      if (opt.collect_participant) parts.push('👤');

      edges.push({
        id: `${step.id}-${opt.id}`,
        source: step.id,
        target: targetId,
        // Route back-edges (circular references) via bottom handles so they
        // arc below the diagram instead of crossing through other nodes.
        ...(isBackEdge ? { sourceHandle: 'bottom-source', targetHandle: 'bottom-target' } : {}),
        label: parts.join(' '),
        type: 'smoothstep',
        animated: false,
        data: { isBackEdge },
        style: isBackEdge
          ? { stroke: '#f59e0b', strokeDasharray: '5,3' }
          : { stroke: '#a1a1aa' },
        labelStyle: { fontSize: 11, fill: '#71717a' },
        labelBgStyle: { fill: '#f4f4f5', fillOpacity: 0.85 },
        labelBgPadding: [4, 3] as [number, number],
        markerEnd: { type: 'arrowclosed' as const, color: isBackEdge ? '#f59e0b' : '#a1a1aa' },
      });
    }
  }

  if (hasDoneNode) {
    nodes.push({
      id: doneNodeId,
      type: 'done',
      position: { x: 0, y: 0 },
      width: DONE_NODE_WIDTH,
      height: DONE_NODE_HEIGHT,
      data: {},
    });
  }

  return { nodes, edges };
}

// ── Main component ───────────────────────────────────────────────────────────

interface WorkflowDiagramProps {
  workflow: CollectionWorkflow;
  eventTypes: CollectionEventType[];
  isEditing?: boolean;
  selectedStepId?: string | null;
  onStepClick?: (stepId: string) => void;
  height?: number;
}

export function WorkflowDiagram({
  workflow,
  eventTypes,
  isEditing = false,
  onStepClick,
  height = 260,
}: WorkflowDiagramProps) {
  const handleStepClick = useCallback(
    (stepId: string) => onStepClick?.(stepId),
    [onStepClick],
  );

  const { nodes, edges } = useMemo(() => {
    const built = buildNodesAndEdges(workflow, eventTypes, isEditing, handleStepClick);
    const laidOut = layoutGraph(built.nodes, built.edges);
    return { nodes: laidOut, edges: built.edges };
  }, [workflow, eventTypes, isEditing, handleStepClick]);

  if (workflow.steps.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-lg border border-dashed border-zinc-200 dark:border-zinc-800 text-sm text-zinc-400 dark:text-zinc-600"
        style={{ height }}
      >
        No steps yet
      </div>
    );
  }

  return (
    <div style={{ height }} className="rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-zinc-50 dark:bg-zinc-950">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={isEditing}
        zoomOnScroll={false}
        panOnScroll={true}
        panOnDrag={true}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#e4e4e7" gap={16} size={1} />
        <Controls showInteractive={false} className="!bottom-2 !right-2 !left-auto !top-auto" />
      </ReactFlow>
    </div>
  );
}
