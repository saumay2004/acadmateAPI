const redis = require("redis");

const client = redis.createClient({
  url: "redis://localhost:6379",
});

client.on("error", (error: any) => {
  console.error("Redis client error:", error);
  if (error.code === "ECONNREFUSED") {
    console.error(
      "Connection refused. Please check if the Redis server is running."
    );
  } else if (error.code === "ENOTFOUND") {
    console.error("Host not found. Please check your Redis URL.");
  } else if (error.message.includes("Socket closed unexpectedly")) {
    console.error(
      "Socket closed unexpectedly. Check for network issues or incorrect credentials."
    );
  }
});

client.on("connect", () => console.log("Connected to Redis"));
client.on("ready", () => console.log("Redis client ready"));
client.on("end", () => console.log("Redis client disconnected"));

(async () => {
  try {
    await client.connect();
    console.log("Connection to Redis established successfully.");
  } catch (error) {
    console.error("Failed to connect to Redis:", error);
  }
})();

module.exports = client;
