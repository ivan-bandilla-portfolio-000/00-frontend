export interface NonceEntry {
  id: string;         // The nonce value (could be a UUID or random string)
  createdAt: number;  // Timestamp when the nonce was created
}