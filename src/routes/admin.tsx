import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, Trash2, Upload, LogOut } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useSiteData, eventStatuses } from "@/lib/site-data";
import type { TourStop } from "@/lib/tour";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Admin Dashboard | Financial Freedom Blueprint Tour" },
      {
        name: "description",
        content: "Manage tour events, the site logo and the footer video.",
      },
      { property: "og:title", content: "Admin Dashboard | Blueprint Tour" },
      {
        property: "og:description",
        content: "Manage events, logo and footer video.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

const input = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm";

const MAX_VIDEO_SIZE = 50 * 1024 * 1024;
const MAX_LOGO_SIZE = 5 * 1024 * 1024;

const LOGO_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];

const VIDEO_TYPES = ["video/mp4", "video/webm"];

function AdminPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [passwordRecovery, setPasswordRecovery] = useState(false);

  useEffect(() => {
    let alive = true;

    const { data } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!alive) return;

      setSession(newSession);

      if (event === "PASSWORD_RECOVERY") {
        setPasswordRecovery(true);
      }

      setReady(true);
    });

    void supabase.auth.getSession().then(({ data: sessionData, error }) => {
      if (!alive) return;

      if (error) {
        setSession(null);
      } else {
        setSession(sessionData.session);
      }

      setReady(true);
    });

    return () => {
      alive = false;
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session || passwordRecovery) {
      setIsAdmin(false);
      return;
    }

    let cancelled = false;

    void supabase
      .rpc("has_role", {
        _role: "admin",
        _user_id: session.user.id,
      })
      .then(({ data, error }) => {
        if (!cancelled) {
          setIsAdmin(!error && data === true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [session, passwordRecovery]);

  if (!ready) {
    return (
      <div className="min-h-screen grid place-items-center">
        <p className="text-sm text-muted-foreground">Loading admin dashboard…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b border-border bg-background">
        <div className="page-width flex items-center justify-between gap-4 py-4">
          <Link to="/" className="flex items-center gap-2 text-sm">
            <ArrowLeft size={16} />
            Back to site
          </Link>

          <h1 className="font-display text-xl">Admin dashboard</h1>

          {session ? (
            <Button variant="ghost" size="sm" onClick={() => void supabase.auth.signOut()}>
              <LogOut />
              Sign out
            </Button>
          ) : (
            <span />
          )}
        </div>
      </header>

      <main className="page-width py-10">
        {passwordRecovery ? (
          <ResetPassword
            onDone={() => {
              setPasswordRecovery(false);
              setSession(null);
              setIsAdmin(false);
            }}
          />
        ) : !session ? (
          <SignIn />
        ) : !isAdmin ? (
          <p className="text-muted-foreground">
            Signed in as {session.user.email}. Your admin request is waiting for approval by an
            existing admin.
          </p>
        ) : (
          <>
            <Dashboard />
            <Admins me={session.user.id} />
          </>
        )}
      </main>
    </div>
  );
}

function SignIn() {
  const [mode, setMode] = useState<"in" | "up" | "forgot">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setMsg("");
    setBusy(true);

    try {
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/admin`,
        });

        setMsg(
          error
            ? error.message
            : "If an account exists for that email, a password reset link has been requested. Check your inbox.",
        );
      } else if (mode === "in") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setMsg(
            error.message === "Email not confirmed"
              ? "Please confirm your email first — open the link we sent to your inbox."
              : error.message,
          );
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/admin`,
          },
        });

        if (error) {
          setMsg(error.message);
        } else if (!data.session) {
          setMsg("Check your email to confirm your account, then sign in.");
        }
      }
    } catch {
      setMsg("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="mx-auto max-w-sm space-y-4 rounded-lg border border-border bg-background p-6"
    >
      <h2 className="font-display text-2xl">
        {mode === "in"
          ? "Admin sign in"
          : mode === "up"
            ? "Create admin account"
            : "Reset your password"}
      </h2>

      {mode !== "forgot" && (
        <p className="text-xs text-muted-foreground">
          New accounts require admin approval unless your account has already been granted admin
          access.
        </p>
      )}

      <input
        className={input}
        type="email"
        required
        autoComplete="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      {mode !== "forgot" && (
        <input
          className={input}
          type="password"
          required
          minLength={6}
          autoComplete={mode === "in" ? "current-password" : "new-password"}
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      )}

      {msg && (
        <p role="status" className="text-sm text-destructive">
          {msg}
        </p>
      )}

      <Button variant="tour" className="w-full" type="submit" disabled={busy}>
        {busy
          ? "Please wait..."
          : mode === "in"
            ? "Sign in"
            : mode === "up"
              ? "Create account"
              : "Send reset link"}
      </Button>

      <div className="flex flex-wrap gap-4 text-sm">
        {mode === "in" && (
          <button
            type="button"
            className="text-primary"
            onClick={() => {
              setMode("forgot");
              setMsg("");
            }}
          >
            Forgot password?
          </button>
        )}

        <button
          type="button"
          className="text-primary"
          onClick={() => {
            setMode(mode === "up" ? "in" : "up");
            setMsg("");
            setPassword("");
          }}
        >
          {mode === "up" ? "Back to sign in" : "Need an account? Sign up"}
        </button>

        {mode === "forgot" && (
          <button
            type="button"
            className="text-primary"
            onClick={() => {
              setMode("in");
              setMsg("");
            }}
          >
            Back to sign in
          </button>
        )}
      </div>
    </form>
  );
}

function ResetPassword({ onDone }: { onDone: () => void }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setMsg("");

    if (password.length < 6) {
      setMsg("Your password must contain at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setMsg("The passwords do not match.");
      return;
    }

    setBusy(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setMsg(error.message);
      } else {
        setSaved(true);
        setMsg("Your password has been updated successfully.");
      }
    } catch {
      setMsg("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function backToSignIn() {
    await supabase.auth.signOut();
    onDone();
  }

  return (
    <form
      onSubmit={submit}
      className="mx-auto max-w-sm space-y-4 rounded-lg border border-border bg-background p-6"
    >
      <h2 className="font-display text-2xl">Choose a new password</h2>

      {!saved && (
        <>
          <input
            className={input}
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <input
            className={input}
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          <Button variant="tour" className="w-full" type="submit" disabled={busy}>
            {busy ? "Updating..." : "Update password"}
          </Button>
        </>
      )}

      {msg && (
        <p role="status" className={saved ? "text-sm text-green-600" : "text-sm text-destructive"}>
          {msg}
        </p>
      )}

      {saved && (
        <Button variant="tour" className="w-full" type="button" onClick={() => void backToSignIn()}>
          Return to sign in
        </Button>
      )}
    </form>
  );
}

function Dashboard() {
  const { stops, settings, reload } = useSiteData();
  const [msg, setMsg] = useState("");
  const [uploading, setUploading] = useState<"logo" | "video" | null>(null);
  const [savingEvent, setSavingEvent] = useState(false);

  const [form, setForm] = useState({
    city: "",
    title: "Financial Freedom Blueprint Tour",
    event_date: "",
    status: "Proposed",
    venue: "Venue to be announced",
    description: "",
  });

  async function upload(kind: "logo" | "video", file?: File) {
    if (!file || uploading) return;

    setMsg("");

    const allowedTypes = kind === "logo" ? LOGO_TYPES : VIDEO_TYPES;
    const maxSize = kind === "logo" ? MAX_LOGO_SIZE : MAX_VIDEO_SIZE;

    if (!allowedTypes.includes(file.type)) {
      setMsg(
        kind === "logo"
          ? "Unsupported logo format. Use PNG, JPEG, WebP or SVG."
          : "Unsupported video format. Use MP4 or WebM.",
      );
      return;
    }

    if (file.size > maxSize) {
      setMsg(
        kind === "logo"
          ? "The logo must be no larger than 5 MB."
          : "The video must be no larger than 50 MB.",
      );
      return;
    }

    if (file.size === 0) {
      setMsg("The selected file is empty.");
      return;
    }

    setUploading(kind);

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${kind}/${Date.now()}-${safeName}`;

    try {
      const { error: uploadError } = await supabase.storage.from("media").upload(path, file, {
        contentType: file.type,
        upsert: false,
      });

      if (uploadError) {
        setMsg(`Upload failed: ${uploadError.message}`);
        return;
      }

      const { data: updatedRows, error: updateError } = await supabase
        .from("site_settings")
        .update(kind === "logo" ? { logo_url: path } : { footer_video_url: path })
        .eq("id", 1)
        .select("id");

      if (updateError || !updatedRows?.length) {
        // Avoid leaving an unreferenced file behind when saving fails.
        const { error: cleanupError } = await supabase.storage.from("media").remove([path]);

        const reason =
          updateError?.message ??
          "No site settings row was updated. Check the row and database permissions.";

        setMsg(
          cleanupError
            ? `Settings update failed: ${reason}. The uploaded file could not be cleaned up: ${cleanupError.message}`
            : `Settings update failed: ${reason}`,
        );
        return;
      }

      setMsg(`${kind === "logo" ? "Logo" : "Footer video"} updated.`);
      await reload();
    } catch {
      setMsg("Something went wrong while uploading. Please try again.");
    } finally {
      setUploading(null);
    }
  }

  async function clear(kind: "logo" | "video") {
    if (uploading) return;

    const currentPath = kind === "logo" ? settings.logoPath : settings.videoPath;

    if (!currentPath) return;

    if (!confirm(`Remove the current ${kind === "logo" ? "logo" : "video"}?`)) {
      return;
    }

    setMsg("");

    try {
      const { data: updatedRows, error } = await supabase
        .from("site_settings")
        .update(kind === "logo" ? { logo_url: null } : { footer_video_url: null })
        .eq("id", 1)
        .select("id");

      if (error || !updatedRows?.length) {
        setMsg(
          error?.message ??
            "No site settings row was updated. Check the row and database permissions.",
        );
        return;
      }

      // Clear the database reference first; then attempt to remove the file.
      const { error: removeError } = await supabase.storage.from("media").remove([currentPath]);

      setMsg(
        removeError
          ? `The setting was cleared, but the old file could not be deleted: ${removeError.message}`
          : `${kind === "logo" ? "Logo" : "Video"} removed.`,
      );

      await reload();
    } catch {
      setMsg("Something went wrong while removing the file.");
    }
  }

  async function addEvent(e: FormEvent) {
    e.preventDefault();
    if (savingEvent) return;

    setSavingEvent(true);
    setMsg("");

    try {
      const { error } = await supabase.from("events").insert(form);

      if (error) {
        setMsg(error.message);
        return;
      }

      setMsg("Event posted.");
      setForm({
        ...form,
        city: "",
        event_date: "",
        description: "",
      });

      await reload();
    } catch {
      setMsg("Something went wrong while saving the event.");
    } finally {
      setSavingEvent(false);
    }
  }

  async function setStatus(stop: TourStop, status: string) {
    if (!stop.id) {
      setMsg("This event has no database ID and cannot be updated.");
      return;
    }

    setMsg("");

    try {
      if (status === "Next event") {
        const { error: previousError } = await supabase
          .from("events")
          .update({ status: "Confirmed" })
          .eq("status", "Next event")
          .neq("id", stop.id);

        if (previousError) {
          setMsg(previousError.message);
          return;
        }
      }

      const { error } = await supabase.from("events").update({ status }).eq("id", stop.id);

      if (error) {
        setMsg(error.message);
        return;
      }

      setMsg("Event status updated.");
      await reload();
    } catch {
      setMsg("Something went wrong while updating the event.");
    }
  }

  async function remove(stop: TourStop) {
    if (!stop.id) {
      setMsg("This event has no database ID and cannot be deleted.");
      return;
    }

    if (!confirm(`Delete the event for ${stop.city}?`)) return;

    setMsg("");

    try {
      const { error } = await supabase.from("events").delete().eq("id", stop.id);

      if (error) {
        setMsg(error.message);
        return;
      }

      setMsg("Event deleted.");
      await reload();
    } catch {
      setMsg("Something went wrong while deleting the event.");
    }
  }

  return (
    <div className="space-y-8">
      {msg && (
        <p
          role="status"
          aria-live="polite"
          className="rounded-md border border-border bg-background p-3 text-sm"
        >
          {msg}
        </p>
      )}

      <section className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3 rounded-lg border border-border bg-background p-6">
          <h2 className="font-display text-xl">Logo</h2>

          <div className="flex h-24 items-center justify-center rounded-md bg-muted">
            {settings.logoUrl ? (
              <img src={settings.logoUrl} alt="Current logo" className="h-20 object-contain" />
            ) : (
              <span className="text-sm text-muted-foreground">No logo yet</span>
            )}
          </div>

          <label className="inline-flex">
            <input
              type="file"
              accept=".png,.jpg,.jpeg,.webp,.svg,image/png,image/jpeg,image/webp,image/svg+xml"
              className="hidden"
              disabled={uploading !== null}
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.currentTarget.value = "";
                void upload("logo", file);
              }}
            />
            <span
              className={`inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground ${
                uploading ? "cursor-not-allowed opacity-60" : "cursor-pointer"
              }`}
            >
              <Upload size={16} />
              {uploading === "logo" ? "Uploading logo…" : "Upload logo"}
            </span>
          </label>

          {settings.logoPath && (
            <Button
              variant="ghost"
              size="sm"
              disabled={uploading !== null}
              onClick={() => void clear("logo")}
            >
              Remove
            </Button>
          )}

          <p className="text-xs text-muted-foreground">PNG, JPEG, WebP or SVG. Maximum 5 MB.</p>
        </div>

        <div className="space-y-3 rounded-lg border border-border bg-background p-6">
          <h2 className="font-display text-xl">Footer background video</h2>

          <div className="flex h-24 items-center justify-center overflow-hidden rounded-md bg-muted">
            {settings.videoUrl ? (
              <video
                src={settings.videoUrl}
                muted
                autoPlay
                loop
                playsInline
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-sm text-muted-foreground">No video yet</span>
            )}
          </div>

          <label className="inline-flex">
            <input
              type="file"
              accept=".mp4,.webm,video/mp4,video/webm"
              className="hidden"
              disabled={uploading !== null}
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.currentTarget.value = "";
                void upload("video", file);
              }}
            />
            <span
              className={`inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground ${
                uploading ? "cursor-not-allowed opacity-60" : "cursor-pointer"
              }`}
            >
              <Upload size={16} />
              {uploading === "video" ? "Uploading video…" : "Upload video"}
            </span>
          </label>

          {settings.videoPath && (
            <Button
              variant="ghost"
              size="sm"
              disabled={uploading !== null}
              onClick={() => void clear("video")}
            >
              Remove
            </Button>
          )}

          <p className="text-xs text-muted-foreground">MP4 or WebM. Maximum 50 MB.</p>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-background p-6">
        <h2 className="mb-4 font-display text-xl">Post a new event</h2>

        <form onSubmit={addEvent} className="grid gap-3 md:grid-cols-2">
          <input
            className={input}
            required
            placeholder="City"
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
          />

          <input
            className={input}
            required
            type="date"
            value={form.event_date}
            onChange={(e) => setForm({ ...form, event_date: e.target.value })}
          />

          <input
            className={input}
            required
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />

          <select
            className={input}
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            {eventStatuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <input
            className={`${input} md:col-span-2`}
            placeholder="Venue"
            value={form.venue}
            onChange={(e) => setForm({ ...form, venue: e.target.value })}
          />

          <textarea
            className={`${input} md:col-span-2`}
            placeholder="Description (optional)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />

          <Button variant="tour" type="submit" className="md:col-span-2" disabled={savingEvent}>
            {savingEvent ? "Posting event…" : "Post event"}
          </Button>
        </form>
      </section>

      <section className="rounded-lg border border-border bg-background p-6">
        <h2 className="mb-4 font-display text-xl">Events</h2>

        <div className="divide-y divide-border">
          {stops.map((stop) => (
            <div key={stop.id ?? stop.city} className="flex flex-wrap items-center gap-3 py-3">
              <div className="min-w-40 flex-1">
                <div className="font-medium">{stop.city}</div>
                <div className="text-xs text-muted-foreground">
                  {stop.date} · {stop.venue}
                </div>
              </div>

              <select
                className={`${input} w-40`}
                value={stop.status}
                onChange={(e) => void setStatus(stop, e.target.value)}
              >
                {eventStatuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>

              <Button
                variant="ghost"
                size="icon"
                aria-label={`Delete ${stop.city}`}
                onClick={() => void remove(stop)}
              >
                <Trash2 />
              </Button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

type AdminUser = {
  id: string;
  email: string;
  created_at: string;
  confirmed: boolean;
  is_admin: boolean;
};

function Admins({ me }: { me: string }) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyUser, setBusyUser] = useState<string | null>(null);

  async function load() {
    setLoading(true);

    try {
      const { data, error } = await supabase.rpc("admin_list_users");

      if (error) {
        setMsg(error.message);
      } else {
        setUsers((data ?? []) as AdminUser[]);
        setMsg("");
      }
    } catch {
      setMsg("Unable to load users. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function setAdmin(u: AdminUser, make: boolean) {
    if (busyUser) return;
    if (!make && !confirm(`Remove admin access for ${u.email}?`)) return;

    setBusyUser(u.id);
    setMsg("");

    try {
      const { error } = await supabase.rpc("admin_set_admin", {
        _target: u.id,
        _make_admin: make,
      });

      if (error) {
        setMsg(error.message);
      } else {
        setMsg(make ? `${u.email} is now an admin.` : `${u.email} is no longer an admin.`);
        await load();
      }
    } catch {
      setMsg("Unable to change this user's role. Please try again.");
    } finally {
      setBusyUser(null);
    }
  }

  return (
    <section className="mt-8 rounded-lg border border-border bg-background p-6">
      <h2 className="mb-1 font-display text-xl">Admins & requests</h2>

      <p className="mb-4 text-sm text-muted-foreground">
        People who sign up appear here. Only approve people you know.
      </p>

      {msg && (
        <p role="status" className="mb-3 text-sm">
          {msg}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading users…</p>
      ) : users.length === 0 ? (
        <p className="text-sm text-muted-foreground">No users found.</p>
      ) : (
        <div className="divide-y divide-border">
          {users.map((u) => (
            <div key={u.id} className="flex flex-wrap items-center gap-3 py-3">
              <div className="min-w-40 flex-1">
                <div className="font-medium">
                  {u.email}
                  {u.id === me && " (you)"}
                </div>

                <div className="text-xs text-muted-foreground">
                  {u.is_admin ? "Admin" : "Waiting for approval"}
                  {!u.confirmed && " · email not confirmed"}
                </div>
              </div>

              {u.is_admin ? (
                u.id !== me && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busyUser !== null}
                    onClick={() => void setAdmin(u, false)}
                  >
                    {busyUser === u.id ? "Updating…" : "Remove admin"}
                  </Button>
                )
              ) : (
                <Button
                  variant="tour"
                  size="sm"
                  disabled={!u.confirmed || busyUser !== null}
                  onClick={() => void setAdmin(u, true)}
                >
                  {busyUser === u.id ? "Updating…" : "Accept as admin"}
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
