import React, { useState, useEffect } from "react";
import { withRouter } from "react-router-dom";
import { useEndpoint } from "../context/EndpointContext";

function ListStateMachines({ history }) {
  const { endpoint } = useEndpoint();
  const [stateMachines, setStateMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStateMachines = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/list-state-machines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ param: {}, endpoint })
      });

      if (!response.ok) {
        throw new Error("Failed to fetch state machines");
      }

      const data = await response.json();
      setStateMachines(data.stateMachines || []);
    } catch (err) {
      setError(err.message);
      setStateMachines([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStateMachines();
  }, [endpoint]);

  const viewDiagram = stateMachineArn => {
    history.push(`/state-machine/${encodeURIComponent(stateMachineArn)}`);
  };

  const deleteStateMachine = async stateMachineArn => {
    try {
      const response = await fetch("/api/delete-state-machine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          param: { stateMachineArn },
          endpoint
        })
      });

      if (response.ok) {
        setStateMachines(prev =>
          prev.filter(sm => sm.stateMachineArn !== stateMachineArn)
        );
      }
    } catch (err) {
      console.error("Failed to delete state machine:", err);
    }
  };

  if (loading) {
    return (
      <div className="loading-state">
        <span className="loading-spinner">⟳</span>
        <span>Loading state machines...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-state">
        <span className="error-icon">⚠</span>
        <span>{error}</span>
        <button className="btn btn-primary" onClick={fetchStateMachines}>
          Retry
        </button>
      </div>
    );
  }

  if (stateMachines.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-icon">📋</span>
        <h3>No State Machines Found</h3>
        <p>Create your first state machine to get started.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h2>State Machines</h2>
        <button className="btn btn-primary" onClick={fetchStateMachines}>
          ↻ Refresh
        </button>
      </div>

      <table className="table">
        <thead className="thead-light">
          <tr>
            <th scope="col">Name</th>
            <th scope="col">State Machine ARN</th>
            <th scope="col">Creation Date</th>
            <th scope="col">Action</th>
          </tr>
        </thead>
        <tbody>
          {stateMachines.map(stateMachine => (
            <tr
              key={stateMachine.stateMachineArn}
              className="clickable-row"
              onClick={() => viewDiagram(stateMachine.stateMachineArn)}
            >
              <td>
                <span className="state-machine-name">{stateMachine.name}</span>
              </td>
              <td>
                <code>{stateMachine.stateMachineArn}</code>
              </td>
              <td>{new Date(stateMachine.creationDate).toLocaleString()}</td>
              <td>
                <div
                  className="action-buttons"
                  onClick={e => e.stopPropagation()}
                >
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => viewDiagram(stateMachine.stateMachineArn)}
                  >
                    View Diagram
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() =>
                      deleteStateMachine(stateMachine.stateMachineArn)
                    }
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default withRouter(ListStateMachines);
