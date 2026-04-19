import { StreamChat } from "stream-chat";

const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY ?? "";
const apiSecret = process.env.STREAM_API_SECRET ?? "";

let _serverClient: StreamChat | null = null;

export function getStreamServerClient(): StreamChat {
  if (!apiKey || !apiSecret) {
    throw new Error("Stream API key or secret is not configured.");
  }
  if (!_serverClient) {
    _serverClient = StreamChat.getInstance(apiKey, apiSecret);
  }
  return _serverClient;
}
