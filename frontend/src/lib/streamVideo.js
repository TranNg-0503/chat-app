import { StreamVideoClient } from "@stream-io/video-react-sdk";

let client;

export function initStreamVideoClient({ apiKey, user, token }) {
  client = new StreamVideoClient({
    apiKey,
    user,
    token,
  });
  return client;
}

export function getStreamVideoClient() {
  if (!client) throw new Error("StreamVideoClient chưa được khởi tạo");
  return client;
}
