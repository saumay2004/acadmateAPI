import { createClient } from "redis"

const client = createClient ({
  url: process.env.REDIS_URL,
  socket: {
    tls: true,
    connectTimeout: 20000, // Increase timeout to 20 seconds
  },
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
