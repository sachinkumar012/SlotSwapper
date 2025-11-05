// File: request.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import "./requests.css";

function Request() {
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchRequests();
  }, []);

  async function fetchRequests() {
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
      setIncoming(incomingRes.data || []);
      setOutgoing(outgoingRes.data || []);
    } catch (err) {
      console.error("Error fetching requests:", err);
      setError("Unable to load requests. Try again later.");
    } finally {
      setLoading(false);
    }
  }

  async function respond(requestId, accepted) {
    if (responding) return;
    setResponding(requestId);
    setError(null);
    setSuccess(null);

    try {
      await axios.post(
        `/api/swaps/swap-response/${requestId}`,
        { accepted },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      setSuccess(accepted ? "Request accepted" : "Request rejected");
      await fetchRequests();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Server error");
    } finally {
      setResponding(null);
    }
  }

  function getStatusBadge(status) {
    return React.createElement(
      "span",
      { className: `status-badge ${status?.toLowerCase()}` },
      status
    );
  }

  if (loading) {
    return React.createElement(
      "div",
      { className: "page-wrap" },
      React.createElement(
        "div",
        { className: "panel centered" },
        "Loading requests..."
      )
    );
  }

  return React.createElement("div", { className: "page-wrap" }, [
    (error || success) &&
      React.createElement(
        "div",
        { className: `toast ${error ? "error" : "success"}` },
        [
          React.createElement(
            "div",
            { className: "toast-text" },
            error || success
          ),
          React.createElement(
            "button",
            {
              className: "toast-close",
              onClick: () => {
                setError(null);
                setSuccess(null);
              },
            },
            "×"
          ),
        ]
      ),
    React.createElement("div", { className: "content-grid" }, [
      React.createElement("section", { className: "col" }, [
        React.createElement("h2", { className: "section-title" }, "Incoming"),
        incoming.length === 0
          ? React.createElement("div", { className: "panel empty" }, [
              React.createElement("div", { className: "empty-emoji" }, "📭"),
              React.createElement(
                "div",
                null,
                "No incoming requests at the moment."
              ),
            ])
          : incoming.map((req) =>
              React.createElement(
                "article",
                { key: req._id, className: "request-box" },
                [
                  React.createElement("div", { className: "box-head" }, [
                    React.createElement(
                      "div",
                      { className: "who" },
                      `From: ${req.requesterId?.name || "Unknown"}`
                    ),
                    React.createElement(
                      "div",
                      { className: "when" },
                      new Date(req.createdAt).toLocaleDateString()
                    ),
                  ]),
                  React.createElement("div", { className: "box-body" }, [
                    React.createElement("div", { className: "slot" }, [
                      React.createElement(
                        "div",
                        { className: "slot-title" },
                        "They want"
                      ),
                      React.createElement(
                        "div",
                        { className: "slot-main" },
                        req.requestedSlotId?.title || "—"
                      ),
                      React.createElement(
                        "div",
                        { className: "slot-time" },
                        `${new Date(
                          req.requestedSlotId?.startTime
                        ).toLocaleString()} - ${new Date(
                          req.requestedSlotId?.endTime
                        ).toLocaleString()}`
                      ),
                    ]),
                    React.createElement("div", { className: "slot" }, [
                      React.createElement(
                        "div",
                        { className: "slot-title" },
                        "They offer"
                      ),
                      React.createElement(
                        "div",
                        { className: "slot-main" },
                        req.offeredSlotId?.title || "—"
                      ),
                      React.createElement(
                        "div",
                        { className: "slot-time" },
                        `${new Date(
                          req.offeredSlotId?.startTime
                        ).toLocaleString()} - ${new Date(
                          req.offeredSlotId?.endTime
                        ).toLocaleString()}`
                      ),
                    ]),
                  ]),
                  React.createElement("div", { className: "box-foot" }, [
                    req.status === "PENDING"
                      ? React.createElement("div", { className: "actions" }, [
                          React.createElement(
                            "button",
                            {
                              className: "btn accept",
                              onClick: () => respond(req._id, true),
                              disabled: responding === req._id,
                            },
                            responding === req._id ? "Accepting..." : "Accept"
                          ),
                          React.createElement(
                            "button",
                            {
                              className: "btn reject",
                              onClick: () => respond(req._id, false),
                              disabled: responding === req._id,
                            },
                            responding === req._id ? "Rejecting..." : "Reject"
                          ),
                        ])
                      : React.createElement(
                          "div",
                          { className: "status-wrap" },
                          getStatusBadge(req.status)
                        ),
                  ]),
                ]
              )
            ),
      ]),
    ]),
  ]);
}

export default Request;
