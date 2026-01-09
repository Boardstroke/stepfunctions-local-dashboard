import React, { useState } from "react";
import { useEndpoint } from "../context/EndpointContext";
import "./ConnectionStatus.css";

function ConnectionStatus() {
  const {
    endpoint,
    updateEndpoint,
    isConnected,
    isChecking,
    lastError,
    checkConnection
  } = useEndpoint();
  const [isEditing, setIsEditing] = useState(false);
  const [tempEndpoint, setTempEndpoint] = useState(endpoint);

  const handleSave = () => {
    updateEndpoint(tempEndpoint);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempEndpoint(endpoint);
    setIsEditing(false);
  };

  const getStatusClass = () => {
    if (isChecking) return "status-checking";
    if (isConnected) return "status-connected";
    return "status-disconnected";
  };

  const getStatusIcon = () => {
    if (isChecking) return "⟳";
    if (isConnected) return "●";
    return "●";
  };

  const getStatusText = () => {
    if (isChecking) return "Checking...";
    if (isConnected) return "Connected";
    return "Disconnected";
  };

  return (
    <div className="connection-status-container">
      <div className={`connection-status ${getStatusClass()}`}>
        <span className="status-indicator">{getStatusIcon()}</span>
        <span className="status-text">{getStatusText()}</span>

        {!isEditing ? (
          <div className="endpoint-display">
            <span className="endpoint-label">Endpoint:</span>
            <code className="endpoint-value">{endpoint}</code>
            <button
              className="btn-edit"
              onClick={() => setIsEditing(true)}
              title="Edit endpoint"
            >
              ✎
            </button>
            <button
              className="btn-refresh"
              onClick={checkConnection}
              disabled={isChecking}
              title="Test connection"
            >
              ↻
            </button>
          </div>
        ) : (
          <div className="endpoint-edit">
            <input
              type="text"
              value={tempEndpoint}
              onChange={e => setTempEndpoint(e.target.value)}
              placeholder="http://localhost:8083"
              className="endpoint-input"
            />
            <button className="btn-save" onClick={handleSave}>
              ✓
            </button>
            <button className="btn-cancel" onClick={handleCancel}>
              ✕
            </button>
          </div>
        )}
      </div>

      {lastError && !isConnected && (
        <div className="error-message">
          <span className="error-icon">⚠</span>
          {lastError}
        </div>
      )}
    </div>
  );
}

export default ConnectionStatus;
