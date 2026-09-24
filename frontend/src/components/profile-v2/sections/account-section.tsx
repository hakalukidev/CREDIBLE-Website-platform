'use client';

/**
 * AccountSection — owner-only account-settings card on the About tab.
 *
 * Surfaces the six fields the owner is allowed to edit on the public
 * profile + their sign-in credentials:
 *
 *   • Username    — inline edit, capped at 2 lifetime changes
 *   • Name        — inline edit (first + last)
 *   • Email       — expand-to-edit with current-password + OTP flow
 *   • Phone       — inline edit (no verification)
 *   • Address     — inline edit (reuses `User.location`)
 *   • Password    — expand-to-edit with current-password check
 *
 * Network calls are injected as a single `api` object so the parent
 * orchestrator (`profile-page-content.tsx`) owns the cache invalidation,
 * session-user patching, and toast semantics. This file stays focused
 * on the form UX.
 */

import { useState } from 'react';
import {
  AtSign,
  Check,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Save,
  User as UserIcon,
} from 'lucide-react';
import { fullName as buildFullName } from '@credible/shared';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

import type { OwnerAccount } from '@/lib/hooks/use-owner-account';

const USERNAME_MAX = 2;

export interface AccountSectionApi {
  saveUsername: (next: string) => Promise<void>;
  saveName: (next: { firstName: string; lastName: string }) => Promise<void>;
  savePhone: (next: string) => Promise<void>;
  saveAddress: (next: string | null) => Promise<void>;
  requestEmailChange: (next: string, currentPassword: string) => Promise<{ devCode?: string }>;
  verifyEmailChange: (next: string, code: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  /** Called after any successful save so the orchestrator can patch
   *  the local "owner account" snapshot. */
  onPatched?: (patch: Partial<OwnerAccount> & { address?: string | null }) => void;
}

export interface AccountSectionProps {
  account: OwnerAccount;
  address: string | null;
  api: AccountSectionApi;
}

export function AccountSection({ account, address, api }: AccountSectionProps) {
  return (
    <Card className="space-y-1 divide-y divide-border p-0">
      <div className="flex items-center gap-2 p-4 pb-3">
        <Lock className="h-4 w-4 text-primary" />
        <h2 className="font-display text-lg font-semibold">Account</h2>
        <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
          You only
        </span>
      </div>

      <UsernameRow account={account} api={api} />
      <NameRow account={account} api={api} />
      <EmailRow account={account} api={api} />
      <PhoneRow account={account} api={api} />
      <AddressRow address={address} api={api} />
      <PasswordRow api={api} />
    </Card>
  );
}

// ───────────────────────────────────────────── Username

function UsernameRow({ account, api }: { account: OwnerAccount; api: AccountSectionApi }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(account.username ?? '');
  const [pending, setPending] = useState(false);
  const used = account.usernameChangedCount ?? 0;
  const remaining = Math.max(0, USERNAME_MAX - used);
  const locked = remaining === 0;

  async function save() {
    const next = value.trim().toLowerCase();
    if (!next || next === (account.username ?? '').toLowerCase()) {
      setEditing(false);
      return;
    }
    setPending(true);
    try {
      await api.saveUsername(next);
      api.onPatched?.({ username: next });
      toast.success('Username updated.');
      setEditing(false);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Could not save username.');
    } finally {
      setPending(false);
    }
  }

  return (
    <Row icon={<AtSign className="h-4 w-4" />} label="Username" hint={`${used} of ${USERNAME_MAX} changes used`}>
      {editing ? (
        <InlineEdit
          value={value}
          onChange={setValue}
          onSave={save}
          onCancel={() => {
            setValue(account.username ?? '');
            setEditing(false);
          }}
          pending={pending}
          disabled={locked}
          placeholder="letters, numbers, dashes"
        />
      ) : (
        <ReadOnlyValue
          value={account.username ? `@${account.username}` : 'Not set'}
          onEdit={() => setEditing(true)}
          disabled={locked}
          editHint={locked ? 'No changes left' : undefined}
        />
      )}
    </Row>
  );
}

// ───────────────────────────────────────────── Name

function NameRow({ account, api }: { account: OwnerAccount; api: AccountSectionApi }) {
  const [editing, setEditing] = useState(false);
  const [first, setFirst] = useState(account.firstName ?? '');
  const [last, setLast] = useState(account.lastName ?? '');
  const [pending, setPending] = useState(false);

  async function save() {
    if (!first.trim() || !last.trim()) {
      toast.error('First and last name are required.');
      return;
    }
    setPending(true);
    try {
      await api.saveName({ firstName: first.trim(), lastName: last.trim() });
      api.onPatched?.({ firstName: first.trim(), lastName: last.trim() });
      toast.success('Name updated.');
      setEditing(false);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Could not save name.');
    } finally {
      setPending(false);
    }
  }

  return (
    <Row icon={<UserIcon className="h-4 w-4" />} label="Name">
      {editing ? (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Input
              value={first}
              onChange={(e) => setFirst(e.target.value)}
              placeholder="First name"
              maxLength={80}
              autoFocus
            />
            <Input
              value={last}
              onChange={(e) => setLast(e.target.value)}
              placeholder="Last name"
              maxLength={80}
            />
          </div>
          <InlineActions
            onSave={save}
            onCancel={() => {
              setFirst(account.firstName ?? '');
              setLast(account.lastName ?? '');
              setEditing(false);
            }}
            pending={pending}
          />
        </div>
      ) : (
        <ReadOnlyValue
          value={buildFullName(account.firstName, account.lastName) || 'Not set'}
          onEdit={() => setEditing(true)}
        />
      )}
    </Row>
  );
}

// ───────────────────────────────────────────── Email

function EmailRow({ account, api }: { account: OwnerAccount; api: AccountSectionApi }) {
  const [stage, setStage] = useState<'closed' | 'request' | 'verify'>('closed');
  const [pending, setPending] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [code, setCode] = useState('');

  async function requestCode() {
    const desired = newEmail.trim().toLowerCase();
    if (!desired || !currentPassword) return;
    setPending(true);
    try {
      const res = await api.requestEmailChange(desired, currentPassword);
      setStage('verify');
      if (res.devCode) {
        toast.message(`Dev code: ${res.devCode}`, {
          description: 'NODE_ENV=development only.',
        });
      } else {
        toast.success(`Verification code sent to ${desired}.`);
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Could not request a code.');
    } finally {
      setPending(false);
    }
  }

  async function submitCode() {
    setPending(true);
    try {
      await api.verifyEmailChange(newEmail.trim().toLowerCase(), code.trim());
      api.onPatched?.({ email: newEmail.trim().toLowerCase() });
      toast.success('Email updated.');
      closeAll();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'That code did not match.');
    } finally {
      setPending(false);
    }
  }

  function closeAll() {
    setStage('closed');
    setNewEmail('');
    setCurrentPassword('');
    setCode('');
  }

  return (
    <Row icon={<Mail className="h-4 w-4" />} label="Email" hint="Verified · used to sign in" verified>
      {stage === 'closed' ? (
        <ReadOnlyValue value={account.email} onEdit={() => setStage('request')} />
      ) : (
        <div className="space-y-3">
          {stage === 'request' ? (
            <>
              <Input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="New email address"
                autoFocus
              />
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Current password"
                autoComplete="current-password"
              />
              <InlineActions
                onSave={requestCode}
                onCancel={closeAll}
                pending={pending}
                saveLabel="Send code"
                disabled={!newEmail.trim() || !currentPassword}
              />
            </>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">
                Enter the 6-digit code we sent to <span className="font-medium">{newEmail}</span>.
              </p>
              <Input
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
                autoFocus
              />
              <InlineActions
                onSave={submitCode}
                onCancel={closeAll}
                pending={pending}
                saveLabel="Verify & update"
                disabled={code.length < 6}
              />
            </>
          )}
        </div>
      )}
    </Row>
  );
}

// ───────────────────────────────────────────── Phone

function PhoneRow({ account, api }: { account: OwnerAccount; api: AccountSectionApi }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(account.phone ?? '');
  const [pending, setPending] = useState(false);

  async function save() {
    const next = value.trim();
    if (!next) {
      toast.error('Phone cannot be empty.');
      return;
    }
    setPending(true);
    try {
      await api.savePhone(next);
      api.onPatched?.({ phone: next });
      toast.success('Phone updated.');
      setEditing(false);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Could not save phone.');
    } finally {
      setPending(false);
    }
  }

  return (
    <Row icon={<Phone className="h-4 w-4" />} label="Phone" hint="No verification required">
      {editing ? (
        <InlineEdit
          value={value}
          onChange={setValue}
          onSave={save}
          onCancel={() => {
            setValue(account.phone ?? '');
            setEditing(false);
          }}
          pending={pending}
          placeholder="+1 555 …"
        />
      ) : (
        <ReadOnlyValue value={account.phone ?? 'Not set'} onEdit={() => setEditing(true)} />
      )}
    </Row>
  );
}

// ───────────────────────────────────────────── Address (User.location)

function AddressRow({
  address,
  api,
}: {
  address: string | null;
  api: AccountSectionApi;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(address ?? '');
  const [pending, setPending] = useState(false);

  async function save() {
    const next = value.trim() || null;
    setPending(true);
    try {
      await api.saveAddress(next);
      api.onPatched?.({ address: next });
      toast.success('Address updated.');
      setEditing(false);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Could not save address.');
    } finally {
      setPending(false);
    }
  }

  return (
    <Row icon={<MapPin className="h-4 w-4" />} label="Address">
      {editing ? (
        <InlineEdit
          value={value}
          onChange={setValue}
          onSave={save}
          onCancel={() => {
            setValue(address ?? '');
            setEditing(false);
          }}
          pending={pending}
          placeholder="City, Country"
        />
      ) : (
        <ReadOnlyValue value={address?.trim() || 'Not set'} onEdit={() => setEditing(true)} />
      )}
    </Row>
  );
}

// ───────────────────────────────────────────── Password

function PasswordRow({ api }: { api: AccountSectionApi }) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [pending, setPending] = useState(false);
  const valid = current.length > 0 && next.length >= 8 && next === confirm;

  async function submit() {
    if (!valid) return;
    setPending(true);
    try {
      await api.changePassword(current, next);
      toast.success('Password updated.');
      setOpen(false);
      setCurrent('');
      setNext('');
      setConfirm('');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Could not update password.');
    } finally {
      setPending(false);
    }
  }

  return (
    <Row icon={<KeyRound className="h-4 w-4" />} label="Password" hint="Set" verified>
      {!open ? (
        <ReadOnlyValue value="••••••••" onEdit={() => setOpen(true)} />
      ) : (
        <div className="space-y-3">
          <Input
            type="password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            placeholder="Current password"
            autoComplete="current-password"
            autoFocus
          />
          <Input
            type="password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            placeholder="New password (8+ characters)"
            autoComplete="new-password"
          />
          <Input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Confirm new password"
            autoComplete="new-password"
          />
          {confirm && next && confirm !== next && (
            <p className="text-xs text-destructive">Passwords do not match.</p>
          )}
          <InlineActions
            onSave={submit}
            onCancel={() => {
              setOpen(false);
              setCurrent('');
              setNext('');
              setConfirm('');
            }}
            pending={pending}
            saveLabel="Update password"
            disabled={!valid}
          />
        </div>
      )}
    </Row>
  );
}

// ───────────────────────────────────────────── Layout primitives

interface RowProps {
  icon: React.ReactNode;
  label: string;
  hint?: string;
  verified?: boolean;
  children: React.ReactNode;
}

function Row({ icon, label, hint, verified, children }: RowProps) {
  return (
    <section className="grid gap-3 p-4 sm:grid-cols-[200px_1fr] sm:items-start">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">{label}</h3>
            {verified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success">
                <Check className="h-3 w-3" />
                Verified
              </span>
            )}
          </div>
          {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
        </div>
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

function ReadOnlyValue({
  value,
  onEdit,
  disabled,
  editHint,
}: {
  value: string;
  onEdit: () => void;
  disabled?: boolean;
  editHint?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <p className="truncate text-sm text-foreground">{value}</p>
      <Button
        size="icon-sm"
        variant="ghost"
        onClick={onEdit}
        disabled={disabled}
        aria-label={editHint ?? 'Edit'}
        title={editHint ?? 'Edit'}
        className="ml-auto text-primary hover:bg-primary/5"
      >
        <Pencil className="h-3.5 w-3.5" />
        {editHint && <span className="sr-only">{editHint}</span>}
      </Button>
    </div>
  );
}

function InlineEdit({
  value,
  onChange,
  onSave,
  onCancel,
  pending,
  placeholder,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
  pending: boolean;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus
        disabled={disabled}
      />
      <InlineActions
        onSave={onSave}
        onCancel={onCancel}
        pending={pending}
        disabled={disabled || !value.trim()}
      />
    </div>
  );
}

function InlineActions({
  onSave,
  onCancel,
  pending,
  disabled,
  saveLabel = 'Save',
}: {
  onSave: () => void;
  onCancel: () => void;
  pending: boolean;
  disabled?: boolean;
  saveLabel?: string;
}) {
  return (
    <div className="flex gap-2">
      <Button variant="ghost" size="sm" onClick={onCancel} disabled={pending}>
        Cancel
      </Button>
      <Button size="sm" onClick={onSave} disabled={pending || disabled} className="gap-1.5">
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
        {saveLabel}
      </Button>
    </div>
  );
}