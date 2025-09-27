// backend/src/lib/streamVideo.js
import { StreamClient } from "@stream-io/node-sdk";
import "dotenv/config";

const apiKey = process.env.STREAM_API_KEY;
const apiSecret = process.env.STREAM_API_SECRET;

if (!apiKey || !apiSecret) {
  console.error("Stream API key hoặc secret bị thiếu");
}

const client = new StreamClient(apiKey, apiSecret);

export default client;
