import React, { useState, useEffect, useCallback, useMemo } from "react";
import { withRouter } from "react-router-dom";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Handle,
  Position
} from "reactflow";
import "reactflow/dist/style.css";
import { useEndpoint } from "../context/EndpointContext";
import { parseStateMachine } from "../utils/stateMachineParser";
import "./StateMachineDiagram.css";

// Custom Node Component - Clean design with multiple handles
function CustomNode({ data }) {
  const { label, type, isBranch, hasCatch } = data;
  const isStart = type === "Start";
  const isEnd = type === "End";
  const isFail = type === "Fail";

  // Clean icons
  const icons = {
    Start: "▶",
    End: "■",
    Task: "⚡",
    Pass: "→",
    Choice: "◇",
    Wait: "⏱",
    Succeed: "✓",
    Fail: "✗",
    Parallel: "⫼",
    Map: "↻"
  };

  const nodeClasses = [
    "custom-node",
    `custom-node-${type.toLowerCase()}`,
    isBranch ? "is-branch" : ""
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={nodeClasses}>
      {/* Top handle - main input */}
      {!isStart && (
        <Handle
          type="target"
          position={Position.Top}
          id="top"
          className="custom-handle"
        />
      )}

      {/* Left handle - for receiving error connections */}
      {isFail && (
        <Handle
          type="target"
          position={Position.Left}
          id="left"
          className="custom-handle custom-handle-error"
        />
      )}

      <div className="custom-node-content">
        <span className="custom-node-icon">{icons[type] || "●"}</span>
        <span className="custom-node-label">{label}</span>
        {!isStart && !isEnd && <span className="custom-node-type">{type}</span>}
      </div>

      {/* Bottom handle - main output */}
      {!isEnd && !isFail && (
        <Handle
          type="source"
          position={Position.Bottom}
          id="bottom"
          className="custom-handle"
        />
      )}

      {/* Right handle - for error/catch outputs */}
      {hasCatch && (
        <Handle
          type="source"
          position={Position.Right}
          id="right"
          className="custom-handle custom-handle-error"
        />
      )}
    </div>
  );
}

const nodeTypes = {
  custom: CustomNode
};

function StateMachineDiagram({ match, history }) {
  const { arn } = match.params;
  const { endpoint } = useEndpoint();

  const [stateMachine, setStateMachine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const decodedArn = useMemo(() => decodeURIComponent(arn || ""), [arn]);

  const fetchStateMachine = useCallback(async () => {
    if (!decodedArn) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/describe-state-machine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          param: { stateMachineArn: decodedArn },
          endpoint
        })
      });

      if (!response.ok) {
        throw new Error("Failed to fetch state machine");
      }

      const data = await response.json();
      setStateMachine(data);

      // Parse definition and create flow elements
      const { nodes: parsedNodes, edges: parsedEdges } = parseStateMachine(
        data.definition
      );
      setNodes(parsedNodes);
      setEdges(parsedEdges);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [decodedArn, endpoint, setNodes, setEdges]);

  useEffect(() => {
    fetchStateMachine();
  }, [fetchStateMachine]);

  const handleBack = () => {
    history.push("/");
  };

  if (loading) {
    return (
      <div className="diagram-container">
        <div className="loading-state">
          <span className="loading-spinner">⟳</span>
          <span>Loading state machine...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="diagram-container">
        <div className="error-state">
          <span className="error-icon">⚠</span>
          <span>{error}</span>
          <button className="btn btn-primary" onClick={fetchStateMachine}>
            Retry
          </button>
          <button className="btn btn-secondary" onClick={handleBack}>
            Back to List
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="diagram-page">
      <div className="diagram-header">
        <button className="btn-back" onClick={handleBack}>
          ← Back
        </button>
        <div className="diagram-title">
          <h2>{stateMachine?.name}</h2>
          <code className="diagram-arn">{decodedArn}</code>
        </div>
        <div className="diagram-actions">
          <button
            className="btn btn-primary"
            onClick={() =>
              history.push(
                `/startExecution?arn=${encodeURIComponent(decodedArn)}`
              )
            }
          >
            ▶ Start Execution
          </button>
        </div>
      </div>

      <div className="diagram-container">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          defaultEdgeOptions={{
            type: "smoothstep",
            style: { strokeWidth: 2 }
          }}
        >
          <Background color="#2a2d3e" gap={24} size={1} />
          <Controls className="flow-controls" />
          <MiniMap
            className="flow-minimap"
            nodeColor={node => {
              const type = node.data?.type?.toLowerCase();
              if (type === "start") return "#4ade80";
              if (type === "end" || type === "fail") return "#f87171";
              if (type === "choice") return "#fbbf24";
              if (type === "succeed") return "#4ade80";
              if (type === "wait") return "#f472b6";
              if (type === "parallel") return "#a78bfa";
              if (type === "map") return "#2dd4bf";
              if (type === "pass") return "#38bdf8";
              return "#818cf8";
            }}
            maskColor="rgba(13, 14, 20, 0.85)"
          />
        </ReactFlow>
      </div>

      <div className="diagram-legend">
        <div className="legend-title">States</div>
        <div className="legend-items">
          <div className="legend-item">
            <span
              className="legend-color"
              style={{ background: "#818cf8" }}
            ></span>
            <span>Task</span>
          </div>
          <div className="legend-item">
            <span
              className="legend-color"
              style={{ background: "#fbbf24" }}
            ></span>
            <span>Choice</span>
          </div>
          <div className="legend-item">
            <span
              className="legend-color"
              style={{ background: "#38bdf8" }}
            ></span>
            <span>Pass</span>
          </div>
          <div className="legend-item">
            <span
              className="legend-color"
              style={{ background: "#f472b6" }}
            ></span>
            <span>Wait</span>
          </div>
          <div className="legend-item">
            <span
              className="legend-color"
              style={{ background: "#4ade80" }}
            ></span>
            <span>Succeed</span>
          </div>
          <div className="legend-item">
            <span
              className="legend-color"
              style={{ background: "#f87171" }}
            ></span>
            <span>Fail</span>
          </div>
          <div className="legend-item">
            <span
              className="legend-color"
              style={{ background: "#a78bfa" }}
            ></span>
            <span>Parallel</span>
          </div>
          <div className="legend-item">
            <span
              className="legend-color"
              style={{ background: "#2dd4bf" }}
            ></span>
            <span>Map</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default withRouter(StateMachineDiagram);
