const connectDB = require("./utils/db");
const auth = require("./utils/auth");
const Event = require("../backend/models/Event");
const SwapRequest = require("../backend/models/SwapRequest");

const handler = async (req, res) => {
  await connectDB();

  if (req.method === "GET") {
    if (req.url.includes("/swappable-slots")) {
      try {
        const slots = await Event.find({
          status: "SWAPPABLE",
        }).populate("userId", "name");
        res.json(slots);
      } catch (err) {
        res.status(500).json({ message: err.message });
      }
    } else if (req.url.includes("/incoming")) {
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
    } else if (req.url.includes("/outgoing")) {
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
    } else {
      res.status(404).json({ message: "Endpoint not found" });
    }
  } else if (req.method === "POST") {
    if (req.url.includes("/swap-request")) {
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
    } else if (req.url.includes("/swap-response")) {
      const { accepted } = req.body;
      const requestId = req.url.split("/").pop();
      try {
        const swapRequest = await SwapRequest.findById(requestId).populate(
          "requestedSlotId offeredSlotId"
        );
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
    } else {
      res.status(404).json({ message: "Endpoint not found" });
    }
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
};

export default auth(handler);
