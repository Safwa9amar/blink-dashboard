"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button, Badge } from "@/components/ui";
import { updateUser, toggleUserActive, deleteUser, createUser } from "./actions";

interface User {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone_number: string;
  role: string;
  gender: string | null;
  is_active: boolean;
}

// --- Toggle Active Button ---
export function ToggleActiveButton({ userId, isActive }: { userId: string; isActive: boolean }) {
  const [isPending, startTransition] = useTransition();
  const t = useTranslations("users");

  return (
    <button
      disabled={isPending}
      onClick={() => startTransition(async () => { await toggleUserActive(userId, !isActive); })}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer disabled:opacity-50 ${
        isActive ? "bg-success" : "bg-border"
      }`}
      title={isActive ? t("deactivate") : t("activate")}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
          isActive ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

// --- Edit User Modal ---
export function EditUserButton({ user }: { user: User }) {
  const [open, setOpen] = useState(false);
  const t = useTranslations("users");

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-1.5 rounded-lg hover:bg-[var(--card-hover)] text-[var(--subtext)] hover:text-[var(--text)] transition-colors cursor-pointer"
        title={t("edit_user")}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
        </svg>
      </button>

      {open && <EditUserModal user={user} onClose={() => setOpen(false)} />}
    </>
  );
}

function EditUserModal({ user, onClose }: { user: User; onClose: () => void }) {
  const [firstName, setFirstName] = useState(user.first_name ?? "");
  const [lastName, setLastName] = useState(user.last_name ?? "");
  const [email, setEmail] = useState(user.email ?? "");
  const [role, setRole] = useState(user.role);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const t = useTranslations("users");

  const roles = ["customer", "rider", "merchant", "agent", "super_admin"];

  function handleSave() {
    startTransition(async () => {
      const result = await updateUser(user.id, {
        first_name: firstName || undefined,
        last_name: lastName || undefined,
        email: email || undefined,
        role,
      });
      if (result.error) {
        setError(result.error);
      } else {
        onClose();
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 w-full max-w-md shadow-xl">
        <h2 className="text-lg font-bold text-[var(--text)] mb-5">{t("edit_user")}</h2>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-[var(--subtext)] mb-1">{t("first_name")}</label>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-xl text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--subtext)] mb-1">{t("last_name")}</label>
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-xl text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--subtext)] mb-1">{t("email")}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-xl text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--subtext)] mb-1">{t("role")}</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-xl text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 cursor-pointer"
            >
              {roles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div className="px-3 py-2 bg-[var(--danger-light)] border border-[var(--danger)]/20 rounded-xl">
              <p className="text-[var(--danger)] text-sm">{error}</p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" size="sm" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button variant="primary" size="sm" loading={isPending} onClick={handleSave}>
            {isPending ? t("saving") : t("save")}
          </Button>
        </div>
      </div>
    </div>
  );
}

// --- Delete User Button ---
export function DeleteUserButton({ userId }: { userId: string }) {
  const [confirm, setConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const t = useTranslations("users");

  function handleDelete() {
    startTransition(async () => {
      await deleteUser(userId);
      setConfirm(false);
    });
  }

  return (
    <>
      <button
        onClick={() => setConfirm(true)}
        className="p-1.5 rounded-lg hover:bg-[var(--danger-light)] text-[var(--subtext)] hover:text-[var(--danger)] transition-colors cursor-pointer"
        title={t("delete")}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
        </svg>
      </button>

      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setConfirm(false)} />
          <div className="relative bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="text-lg font-bold text-[var(--text)] mb-2">{t("delete_user")}</h2>
            <p className="text-sm text-[var(--subtext)] mb-6">{t("delete_confirm")}</p>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" size="sm" onClick={() => setConfirm(false)}>
                {t("cancel")}
              </Button>
              <Button variant="danger" size="sm" loading={isPending} onClick={handleDelete}>
                {isPending ? t("deleting") : t("delete")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// --- Status Badge ---
export function UserStatusBadge({ isActive }: { isActive: boolean }) {
  const t = useTranslations("users");
  return (
    <Badge variant={isActive ? "success" : "danger"}>
      {isActive ? t("active") : t("inactive")}
    </Badge>
  );
}

// --- Add User Button + Modal ---
export function AddUserButton() {
  const [open, setOpen] = useState(false);
  const t = useTranslations("users");

  return (
    <>
      <Button variant="primary" size="sm" onClick={() => setOpen(true)}>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        {t("add_user")}
      </Button>

      {open && <AddUserModal onClose={() => setOpen(false)} />}
    </>
  );
}

function AddUserModal({ onClose }: { onClose: () => void }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("customer");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const t = useTranslations("users");

  const roles = ["customer", "rider", "merchant", "agent", "super_admin"];

  function handleCreate() {
    if (!phone.trim()) {
      setError("Phone number is required");
      return;
    }
    startTransition(async () => {
      const result = await createUser({
        first_name: firstName || undefined,
        last_name: lastName || undefined,
        email: email || undefined,
        phone_number: phone,
        role,
      });
      if (result.error) {
        setError(result.error);
      } else {
        onClose();
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 w-full max-w-md shadow-xl">
        <h2 className="text-lg font-bold text-[var(--text)] mb-1">{t("add_user")}</h2>
        <p className="text-sm text-[var(--subtext)] mb-5">{t("add_user_desc")}</p>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-[var(--subtext)] mb-1">{t("first_name")}</label>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-xl text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--subtext)] mb-1">{t("last_name")}</label>
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-xl text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--subtext)] mb-1">{t("phone_number")} *</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+213..."
              className="w-full px-3 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-xl text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--subtext)] mb-1">{t("email")}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-xl text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--subtext)] mb-1">{t("role")}</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-xl text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 cursor-pointer"
            >
              {roles.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {error && (
            <div className="px-3 py-2 bg-[var(--danger-light)] border border-[var(--danger)]/20 rounded-xl">
              <p className="text-[var(--danger)] text-sm">{error}</p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" size="sm" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button variant="primary" size="sm" loading={isPending} onClick={handleCreate}>
            {isPending ? t("creating") : t("create")}
          </Button>
        </div>
      </div>
    </div>
  );
}
