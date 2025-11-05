const express = require("express");
const Event = require("../models/Event");
const SwapRequest = require("../models/SwapRequest");
const auth = require("../middleware/auth");

const router = express.Router();

// Get swappable slots
router.get("/swappable-slots", auth, async (req, res) => {
  try {
    const slots = await Event.find({
      status: "SWAPPABLE",
    }).populate("userId", "name");
    res.json(slots);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create swap request
router.post("/swap-request", auth, async (req, res) => {
  const { mySlotId, theirSlotId } = req.body;
  try {
    const mySlot = await Event.findOne({
      _id: mySlotId,
      userId: req.user.id,
      status: "SWAPPABLE",
    });
    const theirSlot = await Event.findOne({
      _id: theirSlotId,
      status: "SWAPPABLE",
    });
    if (!mySlot || !theirSlot)
      return res.status(400).json({ message: "Invalid slots" });

    const swapRequest = new SwapRequest({
      requesterId: req.user.id,
      requestedSlotId: theirSlotId,
      offeredSlotId: mySlotId,
    });
    await swapRequest.save();

    await Event.updateMany(
      { _id: { $in: [mySlotId, theirSlotId] } },
      { status: "SWAP_PENDING" }
    );

    res.status(201).json(swapRequest);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Respond to swap request
router.post("/swap-response/:requestId", auth, async (req, res) => {
  const { accepted } = req.body;
  try {
    const swapRequest = await SwapRequest.findById(
      req.params.requestId
    ).populate("requestedSlotId offeredSlotId");
    if (!swapRequest)
      return res.status(404).json({ message: "Swap request not found" });

    if (accepted) {
      // Swap owners
      const tempUserId = swapRequest.requestedSlotId.userId;
      swapRequest.requestedSlotId.userId = swapRequest.offeredSlotId.userId;
      swapRequest.offeredSlotId.userId = tempUserId;

      await swapRequest.requestedSlotId.save();
      await swapRequest.offeredSlotId.save();

      swapRequest.status = "ACCEPTED";
      await Event.updateMany(
        {
          _id: {
            $in: [
              swapRequest.requestedSlotId._id,
              swapRequest.offeredSlotId._id,
            ],
          },
        },
        { status: "BUSY" }
      );
    } else {
      swapRequest.status = "REJECTED";
      await Event.updateMany(
        {
          _id: {
            $in: [
              swapRequest.requestedSlotId._id,
              swapRequest.offeredSlotId._id,
            ],
          },
        },
        { status: "SWAPPABLE" }
      );
    }

    await swapRequest.save();
    res.json(swapRequest);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get incoming swap requests (requests made to user's slots)
router.get("/incoming", auth, async (req, res) => {
  try {
    const requests = await SwapRequest.find({
      $or: [
        {
          requestedSlotId: {
            $in: await Event.find({ userId: req.user.id }).select("_id"),
          },
        },
        {
          offeredSlotId: {
            $in: await Event.find({ userId: req.user.id }).select("_id"),
          },
        },
      ],
    })
      .populate("requesterId", "name")
      .populate("requestedSlotId")
      .populate("offeredSlotId")
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get outgoing swap requests (requests made by user)
router.get("/outgoing", auth, async (req, res) => {
  try {
    const requests = await SwapRequest.find({ requesterId: req.user.id })
      .populate("requesterId", "name")
      .populate("requestedSlotId")
      .populate("offeredSlotId")
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
