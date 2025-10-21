export default function ModelsChatIsland(): null {
  if (import.meta.env.DEV) {
    console.warn('[ModelsChatIsland] React chat island is deprecated; relying on global ChatPanel.');
  }
  return null;
}