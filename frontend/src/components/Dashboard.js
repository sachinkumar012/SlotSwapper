import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState({
    title: "",
    startTime: "",
    endTime: "",
    status: "BUSY",
  });
  const [loading, setLoading] = useState(false);
  const { user, logout } = useAuth();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const { data } = await axios.get("/api/events", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setEvents(data);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post("/api/events", form, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setForm({ title: "", startTime: "", endTime: "", status: "BUSY" });
      fetchEvents();
    } catch (error) {
      console.error("Error creating event:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await axios.put(
        `/api/events/${id}`,
        { status },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      fetchEvents();
    } catch (error) {
      console.error("Error updating event:", error);
    }
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <h1 className="dashboard-title">Dashboard</h1>
          <div className="header-actions">
            <span className="welcome-text">
              Welcome, {user?.name || "User"}!
            </span>
            <button onClick={logout} className="logout-button">
              Logout
            </button>
          </div>
        </div>
        <nav className="dashboard-nav">
          <Link to="/marketplace" className="nav-link">
            Marketplace
          </Link>
          <Link to="/requests" className="nav-link">
            Requests
          </Link>
        </nav>
      </header>

      <main className="dashboard-main">
        <section className="add-event-section">
          <div className="section-card">
            <h2 className="section-title">Add New Event</h2>
            <form className="event-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="title">Event Title</label>
                  <input
                    id="title"
                    type="text"
                    placeholder="Enter event title"
                    value={form.title}
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="status">Status</label>
                  <select
                    id="status"
                    value={form.status}
                    onChange={(e) =>
                      setForm({ ...form, status: e.target.value })
                    }
                  >
                    <option value="BUSY">Busy</option>
                    <option value="SWAPPABLE">Swappable</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="startTime">Start Time</label>
                  <input
                    id="startTime"
                    type="datetime-local"
                    value={form.startTime}
                    onChange={(e) =>
                      setForm({ ...form, startTime: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="endTime">End Time</label>
                  <input
                    id="endTime"
                    type="datetime-local"
                    value={form.endTime}
                    onChange={(e) =>
                      setForm({ ...form, endTime: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="submit-button"
                disabled={loading}
              >
                {loading ? "Adding..." : "Add Event"}
              </button>
            </form>
          </div>
        </section>

        <section className="events-section">
          <h2 className="section-title">Your Events</h2>
          {events.length === 0 ? (
            <div className="empty-state">
              <p>No events yet. Add your first event above!</p>
            </div>
          ) : (
            <div className="events-grid">
              {events.map((event) => (
                <div
                  key={event._id}
                  className={`event-card ${event.status.toLowerCase()}`}
                >
                  <div className="event-header">
                    <h3 className="event-title">{event.title}</h3>
                    <span
                      className={`status-badge ${event.status.toLowerCase()}`}
                    >
                      {event.status}
                    </span>
                  </div>
                  <div className="event-details">
                    <p className="event-time">
                      <strong>Start:</strong> {formatDateTime(event.startTime)}
                    </p>
                    <p className="event-time">
                      <strong>End:</strong> {formatDateTime(event.endTime)}
                    </p>
                  </div>
                  <div className="event-actions">
                    {event.status === "BUSY" && (
                      <button
                        className="action-button"
                        onClick={() => updateStatus(event._id, "SWAPPABLE")}
                      >
                        Make Swappable
                      </button>
                    )}
                    {event.status === "SWAPPABLE" && (
                      <button
                        className="action-button cancel-swap"
                        onClick={() => updateStatus(event._id, "BUSY")}
                      >
                        Cancel Swap
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
