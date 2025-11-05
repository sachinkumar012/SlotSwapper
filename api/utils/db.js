const mongoose = require("mongoose");

const connectDB = async () => {
  if (mongoose.connections[0].readyState) return;
  await mongoose.connect(
    process.env.MONGO_URI || "mongodb://localhost:27017/slotswapper",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  );
};

module.exports = connectDB;
