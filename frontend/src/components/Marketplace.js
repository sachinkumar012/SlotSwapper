import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import "./Marketplace.css";

const Marketplace = () => {
  const [slots, setSlots] = useState([]);
  const [userSlots, setUserSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchSlots();
    fetchUserSlots();
  }, []);

  const fetchSlots = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get("/api/swaps/swappable-slots", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setSlots(data);
    } catch (error) {
      console.error("Error fetching slots:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserSlots = async () => {
    try {
      const { data } = await axios.get("/api/events", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setUserSlots(data.filter((e) => e.status === "SWAPPABLE"));
    } catch (error) {
      console.error("Error fetching user slots:", error);
    }
  };

  const requestSwap = async (theirSlotId, mySlotId) => {
    try {
      await axios.post(
        "/api/swaps/swap-request",
        { mySlotId, theirSlotId },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      alert("Swap request sent successfully!");
      fetchSlots();
      fetchUserSlots();
      setSelectedSlot(null);
    } catch (error) {
      alert(
        "Error sending swap request: " + error.response?.data?.message ||
          error.message
      );
    }
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="marketplace-container">
        <div className="loading">Loading marketplace...</div>
      </div>
    );
  }

  return (
    <div className="marketplace-container">
      <header className="page-header">
        <h1>Swap Marketplace</h1>
        <p>Find and request swaps for available time slots</p>
      </header>

      <div className="marketplace-content">
        <section className="available-slots">
          <h2>Available Slots</h2>
          {slots.length === 0 ? (
            <div className="empty-state">
              <p>No swappable slots available at the moment.</p>
              <p>Check back later or make some of your slots swappable!</p>
            </div>
          ) : (
            <div className="slots-grid">
              {slots.map((slot) => (
                <div key={slot._id} className="slot-card">
                  <div className="slot-header">
                    <h3 className="slot-title">{slot.title}</h3>
                    <span className="slot-owner">
                      by {slot.userId.name}
                      {slot.userId._id === user.id && " (You)"}
                    </span>
                  </div>
                  <div className="slot-details">
                    <div className="slot-time">
                      <strong>Start:</strong> {formatDateTime(slot.startTime)}
                    </div>
                    <div className="slot-time">
                      <strong>End:</strong> {formatDateTime(slot.endTime)}
                    </div>
                  </div>
                  {slot.userId._id === user.id ? (
                    <div className="your-slot-note">Your swappable slot</div>
                  ) : (
                    <button
                      className="btn-request-swap"
                      onClick={() => setSelectedSlot(slot)}
                    >
                      Request Swap
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {selectedSlot && (
          <div className="swap-modal-overlay">
            <div className="swap-modal">
              <h3>Request Swap</h3>
              <div className="selected-slot-info">
                <h4>You want to swap for:</h4>
                <div className="slot-info-card">
                  <h5>{selectedSlot.title}</h5>
                  <p>by {selectedSlot.userId.name}</p>
                  <small>
                    {formatDateTime(selectedSlot.startTime)} -{" "}
                    {formatDateTime(selectedSlot.endTime)}
                  </small>
                </div>
              </div>

              <div className="offer-section">
                <h4>Select your slot to offer:</h4>
                {userSlots.length === 0 ? (
                  <div className="no-slots-message">
                    <p>You don't have any swappable slots.</p>
                    <p>
                      Go to your dashboard and make some slots swappable first.
                    </p>
                  </div>
                ) : (
                  <div className="user-slots-list">
                    {userSlots.map((slot) => (
                      <div key={slot._id} className="user-slot-item">
                        <div className="slot-info">
                          <h5>{slot.title}</h5>
                          <small>
                            {formatDateTime(slot.startTime)} -{" "}
                            {formatDateTime(slot.endTime)}
                          </small>
                        </div>
                        <button
                          className="btn-offer"
                          onClick={() =>
                            requestSwap(selectedSlot._id, slot._id)
                          }
                        >
                          Offer This
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <button
                  className="btn-cancel"
                  onClick={() => setSelectedSlot(null)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Marketplace;
