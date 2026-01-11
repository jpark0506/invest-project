/**
 * User module types
 */

export interface User {
  userId: string;
  email: string;
  locale: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export interface MeResponse {
  user: {
    id: string;
    email: string;
    locale: string;
  };
}

export interface UpdateLocaleRequest {
  locale: string;
}
