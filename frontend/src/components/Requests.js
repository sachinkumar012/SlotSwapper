import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const Requests = () => {
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const [incomingRes, outgoingRes] = await Promise.all([
        axios.get("/api/swaps/incoming", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }),
        axios.get("/api/swaps/outgoing", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }),
      ]);
      setIncoming(incomingRes.data);
      setOutgoing(outgoingRes.data);
    } catch (err) {
      console.error("Error fetching requests:", err);
    } finally {
      setLoading(false);
    }
  };

  const respond = async (requestId, accepted) => {
    try {
      await axios.post(
        `/api/swaps/swap-response/${requestId}`,
        { accepted },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      fetchRequests(); // Refresh the requests
    } catch (err) {
      alert(
        "Error responding to request: " + err.response?.data?.message ||
          err.message
      );
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      PENDING: "status-pending",
      ACCEPTED: "status-accepted",
      REJECTED: "status-rejected",
    };
    return (
      <span className={`status-badge ${statusClasses[status] || ""}`}>
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="requests-container">
        <div className="loading">Loading requests...</div>
      </div>
    );
  }

  return (
    <div className="requests-container">
      <header className="page-header">
        <h1>Swap Requests</h1>
        <p>Manage your incoming and outgoing swap requests</p>
      </header>

      <div className="requests-section">
        <h2>Incoming Requests</h2>
        {incoming.length === 0 ? (
          <div className="empty-state">
            <p>No incoming requests at the moment.</p>
          </div>
        ) : (
          <div className="requests-grid">
            {incoming.map((req) => (
              <div key={req._id} className="request-card">
                <div className="request-header">
                  <h3>From: {req.requesterId.name}</h3>
                  <span className="request-date">
                    {new Date(req.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="request-details">
                  <div className="slot-info">
                    <strong>They want:</strong> {req.requestedSlotId?.title}
                    <br />
                    <small>
                      {new Date(
                        req.requestedSlotId?.startTime
                      ).toLocaleString()}{" "}
                      -{" "}
                      {new Date(req.requestedSlotId?.endTime).toLocaleString()}
                    </small>
                  </div>
                  <div className="slot-info">
                    <strong>They offer:</strong> {req.offeredSlotId?.title}
                    <br />
                    <small>
                      {new Date(req.offeredSlotId?.startTime).toLocaleString()}{" "}
                      - {new Date(req.offeredSlotId?.endTime).toLocaleString()}
                    </small>
                  </div>
                </div>
                <div className="request-actions">
                  {req.status === "PENDING" ? (
                    <>
                      <button
                        className="btn-accept"
                        onClick={() => respond(req._id, true)}
                      >
                        Accept
                      </button>
                      <button
                        className="btn-reject"
                        onClick={() => respond(req._id, false)}
                      >
                        Reject
                      </button>
                    </>
                  ) : (
                    getStatusBadge(req.status)
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="requests-section">
        <h2>Outgoing Requests</h2>
        {outgoing.length === 0 ? (
          <div className="empty-state">
            <p>You haven't made any swap requests yet.</p>
          </div>
        ) : (
          <div className="requests-grid">
            {outgoing.map((req) => (
              <div key={req._id} className="request-card">
                <div className="request-header">
                  <h3>To: {req.requestedSlotId?.userId?.name || "Unknown"}</h3>
                  <span className="request-date">
                    {new Date(req.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="request-details">
                  <div className="slot-info">
                    <strong>You want:</strong> {req.requestedSlotId?.title}
                    <br />
                    <small>
                      {new Date(
                        req.requestedSlotId?.startTime
                      ).toLocaleString()}{" "}
                      -{" "}
                      {new Date(req.requestedSlotId?.endTime).toLocaleString()}
                    </small>
                  </div>
                  <div className="slot-info">
                    <strong>You offer:</strong> {req.offeredSlotId?.title}
                    <br />
                    <small>
                      {new Date(req.offeredSlotId?.startTime).toLocaleString()}{" "}
                      - {new Date(req.offeredSlotId?.endTime).toLocaleString()}
                    </small>
                  </div>
                </div>
                <div className="request-status">
                  {getStatusBadge(req.status)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Requests;
