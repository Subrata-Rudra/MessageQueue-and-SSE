const express = require("express");
const cors = require("cors");
const { QueueEvents } = require("bullmq");
const jobQueue = require("./queue");
const connection = require("./redisConnection");

const port = process.env.PORT || 5000;

const app = express();

app.use(cors());
app.use(express.json());

// Create a queueEvent to get update about every job's lifecycle
const queueEvents = new QueueEvents("requestQueue", { connection });

// To store SSE client's connection details
const clients = {};

app.get("/", (req, res) => {
  res.status(200).send("Heavy request processing server🗄️🖥 is LIVE✅");
});

app.post("/process", async (req, res) => {
  const { num } = req.body;

  // Add the job to the queue(named ad "requestQueue")
  const job = await jobQueue.add("processJob", { num: parseInt(num) % 10 });

  res
    .status(200)
    .json({ jobId: job.id, message: "Job received. Listening for updates." });
});

// SSE route for listening to job updates
app.get("/getUpdate/:jobId", (req, res) => {
  const { jobId } = req.params;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  // Store SSE client connection
  clients[jobId] = res;

  // Send an initial message to confirm the connection
  res.write(`data: {"status": "listening", "jobId": "${jobId}", "message": "Request is added to queue."}\n\n`);

  // Remove client from the storage when they disconnect
  req.on("close", () => {
    delete clients[jobId]; // Removing the client connection from the storage
  });
});

// Listen for job completion and send updates to SSE clients
queueEvents.on("completed", ({ jobId, returnValue }) => {
  if (clients[jobId]) {
    const res = clients[jobId];
    res.write(
      `data: ${JSON.stringify({
        status: "completed",
        jobId: jobId,
        result: returnValue || "No return value",
        message: "Your request processing is completed successfully🎉"
      })}\n\n`
    );
    res.end(); // Close the SSE connection
    delete clients[jobId]; // Removing the client connection from the storage
  }
});

// Listen for job failure and send updates to SSE clients
queueEvents.on("failed", ({ jobId, failedReason }) => {
  if (clients[jobId]) {
    const res = clients[jobId];
    res.write(
      `data: ${JSON.stringify({
        status: "failed",
        jobId: jobId,
        error: failedReason,
        message: "Sorry🥲, your request processing failed."
      })}\n\n`
    );
    res.end(); // Close the SSE connection
    delete clients[jobId]; // Removing the client connection from the storage
  }
});

app.listen(port, () => {
  console.log(
    `Heavy Request Processing Server is running on http://127.0.0.1:${port}`
  );
});
