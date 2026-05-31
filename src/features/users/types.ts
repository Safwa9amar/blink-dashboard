// Domain types for the users feature.
export interface User {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone_number: string;
  role: string;
  gender: string | null;
  is_active: boolean;
}
