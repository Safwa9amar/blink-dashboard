// Client-side source of truth for the staff roster. Seeded from the mock STAFF
// data so the access screen is fully interactive without a database; the guarded
// Supabase mutations in app/d/access/action.ts are the migration-ready backend
// that replaces these once `users.staff_role` ships.

import { create } from "zustand";
import { STAFF, type StaffMember, type StaffRole, type StaffStatus } from "./data";

const uid = () => `u-${Math.random().toString(36).slice(2, 8)}`;

export interface NewStaffInput {
  firstName: string;
  lastName?: string;
  email: string;
  phone?: string;
  staffRole: StaffRole;
  status: StaffStatus;
}

interface StaffState {
  staff: StaffMember[];
  addMember: (input: NewStaffInput) => StaffMember;
  inviteByEmail: (email: string, staffRole: StaffRole) => StaffMember;
  updateRole: (id: string, staffRole: StaffRole) => void;
  setStatus: (id: string, status: StaffStatus) => void;
  remove: (id: string) => void;
}

const today = () => new Date().toISOString().slice(0, 10);

export const useStaffStore = create<StaffState>((set) => ({
  staff: STAFF,

  addMember: (input) => {
    const member: StaffMember = {
      id: uid(),
      name: [input.firstName, input.lastName].filter(Boolean).join(" "),
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: input.phone,
      staffRole: input.staffRole,
      status: input.status,
      lastActive: today(),
    };
    set((s) => ({ staff: [member, ...s.staff] }));
    return member;
  },

  inviteByEmail: (email, staffRole) => {
    const member: StaffMember = {
      id: uid(),
      name: email.split("@")[0],
      email,
      staffRole,
      status: "invited",
      lastActive: today(),
    };
    set((s) => ({ staff: [member, ...s.staff] }));
    return member;
  },

  updateRole: (id, staffRole) =>
    set((s) => ({ staff: s.staff.map((m) => (m.id === id ? { ...m, staffRole } : m)) })),

  setStatus: (id, status) =>
    set((s) => ({ staff: s.staff.map((m) => (m.id === id ? { ...m, status } : m)) })),

  remove: (id) => set((s) => ({ staff: s.staff.filter((m) => m.id !== id) })),
}));
