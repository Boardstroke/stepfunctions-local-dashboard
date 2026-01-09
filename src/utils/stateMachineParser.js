/**
 * Converts AWS Step Functions State Machine definition to React Flow nodes and edges
 * with improved layout algorithm and Parallel state support
 */

const HORIZONTAL_SPACING = 240;
const VERTICAL_SPACING = 100;
const PARALLEL_BRANCH_SPACING = 200;

/**
 * Parse State Machine definition and return React Flow elements
 */
export function parseStateMachine(definition) {
  if (!definition || typeof definition === "string") {
    try {
      definition = JSON.parse(definition);
    } catch (e) {
      console.error("Failed to parse state machine definition:", e);
      return { nodes: [], edges: [] };
    }
  }

  const states = definition.States || {};
  const startAt = definition.StartAt;

  if (!startAt || Object.keys(states).length === 0) {
    return { nodes: [], edges: [] };
  }

  const nodes = [];
  const edges = [];

  // Track positions
  let currentY = 0;
  const nodePositions = new Map();
  const processedStates = new Set();

  // Create Start node
  nodes.push({
    id: "__START__",
    type: "custom",
    position: { x: 0, y: currentY },
    data: { label: "Start", type: "Start" }
  });

  currentY += VERTICAL_SPACING;

  // Edge from Start to first state
  edges.push({
    id: `__START__-${startAt}`,
    source: "__START__",
    target: startAt,
    type: "smoothstep",
    animated: true,
    style: { stroke: "#4ade80", strokeWidth: 2 }
  });

  /**
   * Process states recursively with proper positioning
   */
  function processState(stateName, x, y, parentBranch = null) {
    if (processedStates.has(stateName) || !states[stateName]) {
      return y;
    }

    processedStates.add(stateName);
    const state = states[stateName];

    // Check if this state has catch blocks
    const hasCatch = state.Catch && state.Catch.length > 0;

    // Create node
    nodes.push({
      id: stateName,
      type: "custom",
      position: { x, y },
      data: {
        label: stateName,
        type: state.Type,
        state,
        hasCatch
      }
    });

    nodePositions.set(stateName, { x, y });
    let nextY = y + VERTICAL_SPACING;

    // Handle different state types
    if (state.Type === "Parallel" && state.Branches) {
      // Create parallel branch nodes
      const branchCount = state.Branches.length;
      const totalWidth = (branchCount - 1) * PARALLEL_BRANCH_SPACING;
      const startX = x - totalWidth / 2;

      let maxBranchY = nextY;

      state.Branches.forEach((branch, index) => {
        const branchX = startX + index * PARALLEL_BRANCH_SPACING;
        const branchStartState = branch.StartAt;
        const branchStates = branch.States || {};

        if (branchStartState && branchStates[branchStartState]) {
          // Create a mini state machine for this branch
          const branchNodeId = `${stateName}_branch_${index}_${branchStartState}`;

          // Add branch start node
          nodes.push({
            id: branchNodeId,
            type: "custom",
            position: { x: branchX, y: nextY },
            data: {
              label: branchStartState,
              type: branchStates[branchStartState].Type,
              state: branchStates[branchStartState],
              isBranch: true
            }
          });

          // Connect parallel to branch
          edges.push({
            id: `${stateName}-to-${branchNodeId}`,
            source: stateName,
            target: branchNodeId,
            type: "smoothstep",
            style: { stroke: "#a78bfa", strokeWidth: 2 }
          });

          // Track for connecting to next state after parallel
          nodePositions.set(branchNodeId, { x: branchX, y: nextY });

          // Process rest of branch states
          let branchY = nextY + VERTICAL_SPACING;
          let currentBranchState = branchStates[branchStartState];
          let prevBranchNodeId = branchNodeId;

          while (currentBranchState && currentBranchState.Next) {
            const nextStateName = currentBranchState.Next;
            const nextState = branchStates[nextStateName];

            if (nextState) {
              const nextBranchNodeId = `${stateName}_branch_${index}_${nextStateName}`;

              nodes.push({
                id: nextBranchNodeId,
                type: "custom",
                position: { x: branchX, y: branchY },
                data: {
                  label: nextStateName,
                  type: nextState.Type,
                  state: nextState,
                  isBranch: true
                }
              });

              edges.push({
                id: `${prevBranchNodeId}-to-${nextBranchNodeId}`,
                source: prevBranchNodeId,
                target: nextBranchNodeId,
                type: "smoothstep",
                style: { stroke: "#6b7280", strokeWidth: 2 }
              });

              nodePositions.set(nextBranchNodeId, { x: branchX, y: branchY });
              prevBranchNodeId = nextBranchNodeId;
              currentBranchState = nextState;
              branchY += VERTICAL_SPACING;
            } else {
              break;
            }
          }

          maxBranchY = Math.max(maxBranchY, branchY);

          // Store last node of branch for connecting to next state
          nodePositions.set(
            `${stateName}_branch_${index}_end`,
            prevBranchNodeId
          );
        }
      });

      nextY = maxBranchY;

      // Connect branch ends to next state if exists
      if (state.Next) {
        state.Branches.forEach((branch, index) => {
          const lastBranchNode = nodePositions.get(
            `${stateName}_branch_${index}_end`
          );
          if (lastBranchNode) {
            edges.push({
              id: `${lastBranchNode}-to-${state.Next}`,
              source: lastBranchNode,
              target: state.Next,
              type: "smoothstep",
              style: { stroke: "#a78bfa", strokeWidth: 2 }
            });
          }
        });

        // Process next state
        nextY = processState(state.Next, x, nextY);
      }
    } else if (state.Type === "Choice" && state.Choices) {
      // Handle Choice state with multiple branches
      const choiceCount = state.Choices.length + (state.Default ? 1 : 0);
      const totalWidth = (choiceCount - 1) * HORIZONTAL_SPACING;
      const startX = x - totalWidth / 2;

      let maxChoiceY = nextY;
      const choiceTargets = new Set();

      state.Choices.forEach((choice, index) => {
        if (choice.Next && !choiceTargets.has(choice.Next)) {
          choiceTargets.add(choice.Next);
          const choiceX = startX + index * HORIZONTAL_SPACING;

          edges.push({
            id: `${stateName}-choice-${index}-${choice.Next}`,
            source: stateName,
            target: choice.Next,
            type: "smoothstep",
            label: getChoiceLabel(choice),
            labelStyle: { fill: "#fbbf24", fontSize: 11, fontWeight: 600 },
            labelBgStyle: {
              fill: "#1e2030",
              stroke: "#3a3d4e",
              strokeWidth: 1
            },
            labelBgPadding: [4, 8],
            labelBgBorderRadius: 4,
            style: { stroke: "#fbbf24", strokeWidth: 2 }
          });

          if (!processedStates.has(choice.Next)) {
            const choiceY = processState(choice.Next, choiceX, nextY);
            maxChoiceY = Math.max(maxChoiceY, choiceY);
          }
        }
      });

      if (state.Default && !choiceTargets.has(state.Default)) {
        const defaultIndex = state.Choices.length;
        const defaultX = startX + defaultIndex * HORIZONTAL_SPACING;

        edges.push({
          id: `${stateName}-default-${state.Default}`,
          source: stateName,
          target: state.Default,
          type: "smoothstep",
          label: "default",
          labelStyle: { fill: "#9ca3af", fontSize: 11 },
          labelBgStyle: { fill: "#1e2030", stroke: "#3a3d4e", strokeWidth: 1 },
          labelBgPadding: [4, 8],
          labelBgBorderRadius: 4,
          style: { stroke: "#6b7280", strokeWidth: 2, strokeDasharray: "6,4" }
        });

        if (!processedStates.has(state.Default)) {
          const defaultY = processState(state.Default, defaultX, nextY);
          maxChoiceY = Math.max(maxChoiceY, defaultY);
        }
      }

      nextY = maxChoiceY;
    } else {
      // Regular state - handle Next, Catch, End

      if (state.Catch) {
        state.Catch.forEach((catchBlock, index) => {
          if (catchBlock.Next) {
            // Check if target is a Fail state
            const targetState = states[catchBlock.Next];
            const targetIsFail = targetState && targetState.Type === "Fail";

            edges.push({
              id: `${stateName}-catch-${index}-${catchBlock.Next}`,
              source: stateName,
              target: catchBlock.Next,
              sourceHandle: "right",
              targetHandle: targetIsFail ? "left" : "top",
              type: "smoothstep",
              label: "error",
              labelStyle: { fill: "#f87171", fontSize: 11, fontWeight: 600 },
              labelBgStyle: {
                fill: "#1e2030",
                stroke: "#3a3d4e",
                strokeWidth: 1
              },
              labelBgPadding: [4, 8],
              labelBgBorderRadius: 4,
              style: {
                stroke: "#f87171",
                strokeWidth: 2,
                strokeDasharray: "4,4"
              }
            });

            // Position Fail states to the right if not already positioned
            if (targetIsFail && !processedStates.has(catchBlock.Next)) {
              processedStates.add(catchBlock.Next);
              const failX = x + HORIZONTAL_SPACING;
              const failY = y;

              nodes.push({
                id: catchBlock.Next,
                type: "custom",
                position: { x: failX, y: failY },
                data: {
                  label: catchBlock.Next,
                  type: targetState.Type,
                  state: targetState
                }
              });
              nodePositions.set(catchBlock.Next, { x: failX, y: failY });
            }
          }
        });
      }

      if (state.Next) {
        edges.push({
          id: `${stateName}-${state.Next}`,
          source: stateName,
          target: state.Next,
          type: "smoothstep",
          style: { stroke: "#6b7280", strokeWidth: 2 }
        });

        if (!processedStates.has(state.Next)) {
          nextY = processState(state.Next, x, nextY);
        }
      }

      if (state.End) {
        const endNodeId = `__END_${stateName}__`;

        nodes.push({
          id: endNodeId,
          type: "custom",
          position: { x, y: nextY },
          data: { label: "End", type: "End" }
        });

        edges.push({
          id: `${stateName}-${endNodeId}`,
          source: stateName,
          target: endNodeId,
          type: "smoothstep",
          style: { stroke: "#f87171", strokeWidth: 2 }
        });

        nextY += VERTICAL_SPACING;
      }
    }

    return nextY;
  }

  // Start processing from the initial state
  processState(startAt, 0, currentY);

  return { nodes, edges };
}

function getChoiceLabel(choice) {
  if (choice.Variable) {
    const varName = choice.Variable.split(".").pop();
    if (choice.StringEquals !== undefined)
      return `${varName} = "${choice.StringEquals}"`;
    if (choice.BooleanEquals !== undefined)
      return `${varName} = ${choice.BooleanEquals}`;
    if (choice.NumericEquals !== undefined)
      return `${varName} = ${choice.NumericEquals}`;
    if (choice.NumericGreaterThan !== undefined)
      return `${varName} > ${choice.NumericGreaterThan}`;
    if (choice.NumericLessThan !== undefined)
      return `${varName} < ${choice.NumericLessThan}`;
    if (choice.NumericGreaterThanEquals !== undefined)
      return `${varName} >= ${choice.NumericGreaterThanEquals}`;
    if (choice.NumericLessThanEquals !== undefined)
      return `${varName} <= ${choice.NumericLessThanEquals}`;
    if (choice.IsPresent !== undefined)
      return choice.IsPresent ? `${varName} exists` : `${varName} !exists`;
  }
  return "→";
}

export default parseStateMachine;
