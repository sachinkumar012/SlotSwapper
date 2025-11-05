const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("../server");
const User = require("../models/User");
const Event = require("../models/Event");
const SwapRequest = require("../models/SwapRequest");

let mongoServer;
let server;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  process.env.MONGO_URI = mongoUri;
  await mongoose.connect(mongoUri);

  server = app.listen(5001); // Use port 5001 for tests
});

afterAll(async () => {
  if (server) {
    server.close();
  }
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

beforeEach(async () => {
  await User.deleteMany({});
  await Event.deleteMany({});
  await SwapRequest.deleteMany({});
});

describe("Swap API Tests", () => {
  let user1, user2, event1, event2, token1, token2;

  beforeEach(async () => {
    // Create test users
    user1 = new User({
      name: "User1",
      email: "user1@test.com",
      password: "password",
    });
    user2 = new User({
      name: "User2",
      email: "user2@test.com",
      password: "password",
    });
    await user1.save();
    await user2.save();

    // Create test events
    event1 = new Event({
      title: "Event1",
      startTime: new Date(),
      endTime: new Date(Date.now() + 3600000),
      status: "SWAPPABLE",
      userId: user1._id,
    });
    event2 = new Event({
      title: "Event2",
      startTime: new Date(),
      endTime: new Date(Date.now() + 3600000),
      status: "SWAPPABLE",
      userId: user2._id,
    });
    await event1.save();
    await event2.save();

    // Mock JWT tokens (simplified for testing)
    token1 = "mock-jwt-token-user1";
    token2 = "mock-jwt-token-user2";
  });

  describe("POST /api/swaps/swap-request", () => {
    it("should create a swap request successfully", async () => {
      const response = await request(app)
        .post("/api/swaps/swap-request")
        .set("Authorization", `Bearer ${token1}`)
        .send({ mySlotId: event1._id, theirSlotId: event2._id });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("_id");
      expect(response.body.requesterId).toBe(user1._id.toString());
      expect(response.body.requestedSlotId).toBe(event2._id.toString());
      expect(response.body.offeredSlotId).toBe(event1._id.toString());

      // Check if events are set to SWAP_PENDING
      const updatedEvent1 = await Event.findById(event1._id);
      const updatedEvent2 = await Event.findById(event2._id);
      expect(updatedEvent1.status).toBe("SWAP_PENDING");
      expect(updatedEvent2.status).toBe("SWAP_PENDING");
    });

    it("should return 400 for invalid slots", async () => {
      const response = await request(app)
        .post("/api/swaps/swap-request")
        .set("Authorization", `Bearer ${token1}`)
        .send({ mySlotId: "invalid", theirSlotId: event2._id });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Invalid slots");
    });
  });

  describe("POST /api/swaps/swap-response/:requestId", () => {
    let swapRequest;

    beforeEach(async () => {
      swapRequest = new SwapRequest({
        requesterId: user1._id,
        requestedSlotId: event2._id,
        offeredSlotId: event1._id,
      });
      await swapRequest.save();

      // Set events to SWAP_PENDING
      await Event.updateMany(
        { _id: { $in: [event1._id, event2._id] } },
        { status: "SWAP_PENDING" }
      );
    });

    it("should accept swap request and swap user IDs", async () => {
      const response = await request(app)
        .post(`/api/swaps/swap-response/${swapRequest._id}`)
        .set("Authorization", `Bearer ${token2}`)
        .send({ accepted: true });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("ACCEPTED");

      // Check if user IDs are swapped
      const updatedEvent1 = await Event.findById(event1._id);
      const updatedEvent2 = await Event.findById(event2._id);
      expect(updatedEvent1.userId.toString()).toBe(user2._id.toString());
      expect(updatedEvent2.userId.toString()).toBe(user1._id.toString());

      // Check if events are set to BUSY
      expect(updatedEvent1.status).toBe("BUSY");
      expect(updatedEvent2.status).toBe("BUSY");
    });

    it("should reject swap request and reset event statuses", async () => {
      const response = await request(app)
        .post(`/api/swaps/swap-response/${swapRequest._id}`)
        .set("Authorization", `Bearer ${token2}`)
        .send({ accepted: false });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("REJECTED");

      // Check if events are set back to SWAPPABLE
      const updatedEvent1 = await Event.findById(event1._id);
      const updatedEvent2 = await Event.findById(event2._id);
      expect(updatedEvent1.status).toBe("SWAPPABLE");
      expect(updatedEvent2.status).toBe("SWAPPABLE");
    });

    it("should return 404 for non-existent swap request", async () => {
      const response = await request(app)
        .post("/api/swaps/swap-response/invalidId")
        .set("Authorization", `Bearer ${token2}`)
        .send({ accepted: true });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Swap request not found");
    });
  });

  describe("GET /api/swaps/swappable-slots", () => {
    it("should return swappable slots", async () => {
      const response = await request(app)
        .get("/api/swaps/swappable-slots")
        .set("Authorization", `Bearer ${token1}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1); // Only event2 is swappable for user1
      expect(response.body[0]._id).toBe(event2._id.toString());
    });
  });

  describe("GET /api/swaps/incoming", () => {
    it("should return incoming swap requests", async () => {
      const swapRequest = new SwapRequest({
        requesterId: user1._id,
        requestedSlotId: event2._id,
        offeredSlotId: event1._id,
      });
      await swapRequest.save();

      const response = await request(app)
        .get("/api/swaps/incoming")
        .set("Authorization", `Bearer ${token2}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      expect(response.body[0]._id).toBe(swapRequest._id.toString());
    });
  });

  describe("GET /api/swaps/outgoing", () => {
    it("should return outgoing swap requests", async () => {
      const swapRequest = new SwapRequest({
        requesterId: user1._id,
        requestedSlotId: event2._id,
        offeredSlotId: event1._id,
      });
      await swapRequest.save();

      const response = await request(app)
        .get("/api/swaps/outgoing")
        .set("Authorization", `Bearer ${token1}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      expect(response.body[0]._id).toBe(swapRequest._id.toString());
    });
  });
});
