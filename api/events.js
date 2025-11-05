const connectDB = require("./utils/db");
const auth = require("./utils/auth");
const Event = require("../backend/models/Event");

const handler = async (req, res) => {
  await connectDB();

  if (req.method === "GET") {
    try {
      const events = await Event.find({ userId: req.user.id });
      res.json(events);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  } else if (req.method === "POST") {
    const { title, startTime, endTime, status } = req.body;
    try {
      const event = new Event({
        title,
        startTime,
        endTime,
        status,
        userId: req.user.id,
      });
      await event.save();
      res.status(201).json(event);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  } else if (req.method === "PUT") {
    const { title, startTime, endTime, status } = req.body;
    try {
      const event = await Event.findOneAndUpdate(
        { _id: req.query.id, userId: req.user.id },
        { title, startTime, endTime, status },
        { new: true }
      );
      if (!event) return res.status(404).json({ message: "Event not found" });
      res.json(event);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  } else if (req.method === "DELETE") {
    try {
      const event = await Event.findOneAndDelete({
        _id: req.query.id,
        userId: req.user.id,
      });
      if (!event) return res.status(404).json({ message: "Event not found" });
      res.json({ message: "Event deleted" });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
};

export default auth(handler);
