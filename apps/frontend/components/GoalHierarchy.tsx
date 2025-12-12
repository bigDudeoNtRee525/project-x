"use client";

import React, { useCallback, useMemo, useEffect, useState } from 'react';
import { ReactFlow, Background, Controls, MiniMap, useNodesState, useEdgesState, type Node, type Edge, Position, ConnectionLineType } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import { GoalNode, CategoryNode, TaskNode } from './nodes/CustomNodes';
import { goalsApi, type Goal } from "@/lib/api";

const nodeTypes = {
    goal: GoalNode,
    category: CategoryNode,
    task: TaskNode,
};

// --- Layout Logic using Dagre ---
const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    const isHorizontal = direction === 'LR';
    dagreGraph.setGraph({
        rankdir: direction,
        nodesep: 100, // Horizontal spacing between nodes
        ranksep: 150  // Vertical spacing between ranks
    });

    nodes.forEach((node) => {
        // Approximate dimensions based on node type for layout
        let width = 300;
        let height = 100;
        if (node.type === 'category') { width = 260; height = 60; }
        if (node.type === 'task') { width = 280; height = 80; }

        dagreGraph.setNode(node.id, { width, height });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    const layoutedNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        return {
            ...node,
            targetPosition: isHorizontal ? Position.Left : Position.Top,
            sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
            // We are shifting the dagre node position (anchor=center center) to the top left
            // so it matches the React Flow node anchor point (top left).
            position: {
                x: nodeWithPosition.x - nodeWithPosition.width / 2,
                y: nodeWithPosition.y - nodeWithPosition.height / 2,
            },
        };
    });

    return { nodes: layoutedNodes, edges };
};

// --- Data Transformation ---
// --- Data Transformation ---
const buildGraphData = (goals: Goal[], onEdit?: (goal: Goal) => void, onDelete?: (goal: Goal) => void) => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    goals.forEach((yearly) => {
        // Yearly Goal Node
        nodes.push({
            id: yearly.id,
            type: 'goal',
            data: {
                title: yearly.title,
                type: 'YEARLY',
                label: 'Strategic',
                onEdit: onEdit ? () => onEdit(yearly) : undefined,
                onDelete: onDelete ? () => onDelete(yearly) : undefined,
            },
            position: { x: 0, y: 0 }, // Initial position, will be calculated by dagre
        });

        // Tasks for Yearly Goal
        if (yearly.tasks) {
            yearly.tasks.forEach((task: any) => {
                const assigneeNames = task.assignees?.map((a: any) => a.name).join(', ') || null;
                nodes.push({
                    id: task.id,
                    type: 'task',
                    data: {
                        title: task.title || task.description,
                        status: task.status,
                        assignee: assigneeNames
                    },
                    position: { x: 0, y: 0 },
                });

                edges.push({
                    id: `${yearly.id}-${task.id}`,
                    source: yearly.id,
                    target: task.id,
                    type: 'default',
                    style: { stroke: '#334155' },
                });
            });
        }

        if (yearly.children) {
            yearly.children.forEach((quarterly) => {
                // Quarterly Goal Node
                nodes.push({
                    id: quarterly.id,
                    type: 'goal',
                    data: {
                        title: quarterly.title,
                        type: 'QUARTERLY',
                        label: 'Quarterly',
                        onEdit: onEdit ? () => onEdit(quarterly) : undefined,
                        onDelete: onDelete ? () => onDelete(quarterly) : undefined,
                    },
                    position: { x: 0, y: 0 },
                });

                // Edge: Yearly -> Quarterly
                edges.push({
                    id: `${yearly.id}-${quarterly.id}`,
                    source: yearly.id,
                    target: quarterly.id,
                    type: 'smoothstep',
                    animated: true,
                    style: { stroke: '#9333ea', strokeWidth: 2 },
                });

                // Tasks for Quarterly Goal
                if (quarterly.tasks) {
                    quarterly.tasks.forEach((task: any) => {
                        const assigneeNames = task.assignees?.map((a: any) => a.name).join(', ') || null;
                        nodes.push({
                            id: task.id,
                            type: 'task',
                            data: {
                                title: task.title || task.description,
                                status: task.status,
                                assignee: assigneeNames
                            },
                            position: { x: 0, y: 0 },
                        });

                        edges.push({
                            id: `${quarterly.id}-${task.id}`,
                            source: quarterly.id,
                            target: task.id,
                            type: 'default',
                            style: { stroke: '#334155' },
                        });
                    });
                }

                // Categories
                if (quarterly.categories) {
                    quarterly.categories.forEach((cat) => {
                        nodes.push({
                            id: cat.id,
                            type: 'category',
                            data: { name: cat.name },
                            position: { x: 0, y: 0 },
                        });

                        // Edge: Quarterly -> Category
                        edges.push({
                            id: `${quarterly.id}-${cat.id}`,
                            source: quarterly.id,
                            target: cat.id,
                            type: 'smoothstep',
                            style: { stroke: '#eab308', strokeWidth: 2 },
                        });

                        // Tasks
                        if (cat.tasks) {
                            cat.tasks.forEach((task: any) => {
                                const assigneeNames = task.assignees?.map((a: any) => a.name).join(', ') || null;
                                nodes.push({
                                    id: task.id,
                                    type: 'task',
                                    data: {
                                        title: task.title || task.description,
                                        status: task.status,
                                        assignee: assigneeNames
                                    },
                                    position: { x: 0, y: 0 },
                                });

                                // Edge: Category -> Task
                                edges.push({
                                    id: `${cat.id}-${task.id}`,
                                    source: cat.id,
                                    target: task.id,
                                    type: 'default',
                                    style: { stroke: '#334155' },
                                });
                            });
                        }
                    });
                }
            });
        }
    });

    return getLayoutedElements(nodes, edges);
};

interface GoalHierarchyProps {
    onEditGoal?: (goal: Goal) => void;
    onDeleteGoal?: (goal: Goal) => void;
}

export function GoalHierarchy({ onEditGoal, onDeleteGoal }: GoalHierarchyProps) {
    const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = (await goalsApi.list() as unknown) as { goals: Goal[] };
                // Ensure response.goals is an array
                const goalsData = response.goals || [];
                const { nodes: layoutedNodes, edges: layoutedEdges } = buildGraphData(goalsData, onEditGoal, onDeleteGoal);
                setNodes(layoutedNodes);
                setEdges(layoutedEdges);
            } catch (error) {
                console.error("Failed to fetch goals:", error);
            }
        };

        fetchData();
    }, [onEditGoal, onDeleteGoal]);

    return (
        <div className="w-full h-full bg-background">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                fitView
                attributionPosition="bottom-right"
                minZoom={0.1}
            >
                <Background color="#333" gap={16} />
                <Controls />
                <MiniMap nodeStrokeColor={(n) => {
                    if (n.type === 'goal') return '#9333ea';
                    if (n.type === 'category') return '#eab308';
                    return '#334155';
                }} />
            </ReactFlow>
        </div>
    );
}
