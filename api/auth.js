const connectDB = require("./utils/db");
const User = require("../backend/models/User");

export default async function handler(req, res) {
  await connectDB();

  if (req.method === "POST") {
    const { name, email, password } = req.body;

    try {
      if (req.url.endsWith("/signup")) {
        const user = new User({ name, email, password });
        await user.save();
        const jwt = require("jsonwebtoken");
        const token = jwt.sign(
          { id: user._id },
          process.env.JWT_SECRET || "secret",
          { expiresIn: "1h" }
        );
        res.status(201).json({ token, user: { id: user._id, name, email } });
      } else if (req.url.endsWith("/login")) {
        const user = await User.findOne({ email });
        if (!user || !(await user.comparePassword(password))) {
          return res.status(401).json({ message: "Invalid credentials" });
        }
        const jwt = require("jsonwebtoken");
        const token = jwt.sign(
          { id: user._id },
          process.env.JWT_SECRET || "secret",
          { expiresIn: "1h" }
        );
        res.json({ token, user: { id: user._id, name: user.name, email } });
      } else {
        res.status(404).json({ message: "Endpoint not found" });
      }
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}
