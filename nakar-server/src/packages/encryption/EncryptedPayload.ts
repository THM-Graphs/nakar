export interface EncryptedPayload {
  keyId: string;
  iv: string;
  authTag: string;
  ciphertext: string;
}
