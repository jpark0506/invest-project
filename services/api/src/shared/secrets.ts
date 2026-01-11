/**
 * Secrets Manager utility
 */

import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const client = new SecretsManagerClient({});

// Cache for secrets
const secretsCache: Record<string, { value: string; expiresAt: number }> = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get a secret value from Secrets Manager with caching
 */
export async function getSecret(secretArn: string): Promise<string> {
  const now = Date.now();
  const cached = secretsCache[secretArn];

  if (cached && cached.expiresAt > now) {
    return cached.value;
  }

  const command = new GetSecretValueCommand({ SecretId: secretArn });
  const response = await client.send(command);

  if (!response.SecretString) {
    throw new Error(`Secret ${secretArn} has no string value`);
  }

  secretsCache[secretArn] = {
    value: response.SecretString,
    expiresAt: now + CACHE_TTL,
  };

  return response.SecretString;
}
