const { Worker } = require("bullmq");
const connection = require("./redisConnection");

const worker = new Worker(
  "requestQueue",
  async (job) => {
    console.log(`Processing job: ${job.id}`);
    await new Promise((resolve) => setTimeout(resolve, job.data.num * 2000));
    return { message: "Processing Complete!", input: job.num };
  },
  {
    connection,
  }
);

console.log("Worker server is running...");
