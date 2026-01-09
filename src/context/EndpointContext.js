import React, { createContext, useState, useContext, useEffect } from "react";

const EndpointContext = createContext();

const DEFAULT_ENDPOINT = "http://localhost:8083";
const STORAGE_KEY = "stepfunctions-endpoint";

export function EndpointProvider({ children }) {
  const [endpoint, setEndpoint] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved || DEFAULT_ENDPOINT;
  });

  const [isConnected, setIsConnected] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [lastError, setLastError] = useState(null);

  const updateEndpoint = newEndpoint => {
    setEndpoint(newEndpoint);
    localStorage.setItem(STORAGE_KEY, newEndpoint);
  };

  const checkConnection = async () => {
    setIsChecking(true);
    setLastError(null);

    try {
      const response = await fetch("/api/list-state-machines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ param: {}, endpoint })
      });

      if (response.ok) {
        setIsConnected(true);
        setLastError(null);
      } else {
        const error = await response.json();
        setIsConnected(false);
        setLastError(error.message || "Connection failed");
      }
    } catch (error) {
      setIsConnected(false);
      setLastError(error.message || "Unable to connect");
    } finally {
      setIsChecking(false);
    }
  };

  // Check connection on mount and when endpoint changes
  useEffect(() => {
    checkConnection();
  }, [endpoint]);

  // Periodically check connection every 30 seconds
  useEffect(() => {
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, [endpoint]);

  const value = {
    endpoint,
    updateEndpoint,
    isConnected,
    isChecking,
    lastError,
    checkConnection
  };

  return (
    <EndpointContext.Provider value={value}>
      {children}
    </EndpointContext.Provider>
  );
}

export function useEndpoint() {
  const context = useContext(EndpointContext);
  if (!context) {
    throw new Error("useEndpoint must be used within an EndpointProvider");
  }
  return context;
}

export default EndpointContext;
