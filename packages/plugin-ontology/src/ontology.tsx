import { useMemo } from "react"
import { Link } from "react-router"
import dagre from "@dagrejs/dagre"
import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  Position,
  MarkerType,
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
  type NodeProps,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { getDocuments, getRelationDefinitions } from "@the-docs/core"
import { selectGraph, type OntologyProps } from "./graph.js"

function DocumentNode({ data }: NodeProps) {
  return (
    <div
      style={{
        width: 200,
        minHeight: 70,
        padding: 12,
        borderRadius: 12,
        border: data.subject ? "2px solid #333" : "1px solid #333",
        background: "white",
        color: "black",
        textAlign: "center",
      }}
    >
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <Link
        className="nodrag"
        style={{ color: "black", textDecoration: "none" }}
        to={`/p/${encodeURIComponent(String(data.slug))}`}
      >
        {String(data.label)}
      </Link>
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
    </div>
  )
}
const nodeTypes = { document: DocumentNode }

function RelationEdge(props: EdgeProps) {
  const [path, labelX, labelY] = getSmoothStepPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    targetX: props.targetX,
    targetY: props.targetY,
    sourcePosition: props.sourcePosition,
    targetPosition: props.targetPosition,
    offset: Number(props.data?.offset ?? 25),
  })
  return (
    <>
      <BaseEdge
        id={props.id}
        path={path}
        markerStart={props.markerStart}
        markerEnd={props.markerEnd}
        style={{ stroke: "#333" }}
      />
      <EdgeLabelRenderer>
        <div
          className="nodrag nopan"
          title={
            typeof props.data?.description === "string"
              ? props.data.description
              : undefined
          }
          style={{
            pointerEvents: "all",
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            background: "white",
            color: "black",
            padding: "3px 6px",
            maxWidth: 180,
            whiteSpace: "pre-wrap",
            textAlign: "center",
            fontSize: 12,
          }}
        >
          {props.label}
        </div>
      </EdgeLabelRenderer>
    </>
  )
}
const edgeTypes = { relation: RelationEdge }

export function Ontology(props: OntologyProps) {
  const { nodes, edges } = useMemo(() => {
    const selected = selectGraph(getDocuments(), props)
    const titles = new Map(
      getRelationDefinitions().map((r) => [r.slug, r.title])
    )
    const layout = new dagre.graphlib.Graph({ multigraph: true })
    layout.setGraph({ rankdir: "LR", nodesep: 70, ranksep: 180 })
    layout.setDefaultEdgeLabel(() => ({}))
    for (const doc of selected.documents)
      layout.setNode(doc.slug, { width: 224, height: 98 })
    for (const edge of selected.edges)
      layout.setEdge(
        edge.subject,
        edge.relatedDoc,
        { width: 160, height: 25 },
        edge.id
      )
    dagre.layout(layout)
    return {
      nodes: selected.documents.map((doc) => {
        const point = layout.node(doc.slug)
        return {
          id: doc.slug,
          type: "document",
          position: { x: point.x - 112, y: point.y - 49 },
          data: {
            label: doc.frontmatter.title,
            slug: doc.slug,
            subject: selected.subjects.has(doc.slug),
          },
        }
      }),
      edges: selected.edges.map((edge, index) => ({
        id: edge.id,
        source: edge.subject,
        target: edge.relatedDoc,
        type: "relation",
        data: { offset: 25 + index * 8, description: edge.description },
        label: (
          <div
            style={{
              maxWidth: 180,
              whiteSpace: "pre-wrap",
              textAlign: "center",
              fontSize: 12,
            }}
          >
            {titles.get(edge.relationSlug) ?? edge.relationSlug}
          </div>
        ),
        markerStart:
          edge.subjectEnd === "arrow"
            ? { type: MarkerType.ArrowClosed }
            : undefined,
        markerEnd:
          edge.relatedEnd === "arrow"
            ? { type: MarkerType.ArrowClosed }
            : undefined,
      })),
    }
  }, [props.subjectFilter, props.extensionFilter, props.extensionMaxHops])
  if (!nodes.length)
    return <p role="status">No documents match this ontology filter.</p>
  return (
    <div
      style={{
        height: 560,
        width: "100%",
        border: "1px solid #94a3b8",
        borderRadius: 12,
      }}
      aria-label="Document ontology graph"
    >
      <ReactFlow
        key={JSON.stringify(nodes.map((n) => n.id))}
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        nodesDraggable={false}
        nodesConnectable={false}
        minZoom={0.1}
        maxZoom={2}
      >
        <Background />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  )
}
