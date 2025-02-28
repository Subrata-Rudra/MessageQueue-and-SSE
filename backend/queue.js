const { Queue } = require("bullmq");
const connection = require("./redisConnection");

const jobQueue = new Queue("requestQueue", connection);

module.exports = jobQueue;
