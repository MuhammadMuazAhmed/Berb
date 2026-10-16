"use client";

import { useState, type FormEvent } from "react";

export function SetupAdminForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [setupSecret, setSetupSecret] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [complete, setComplete] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/auth/setup-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, setupSecret }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(typeof result.message === "string" ? result.message : "Setup is unavailable or the submitted details are invalid.");
      setName(""); setEmail(""); setPassword(""); setSetupSecret("");
      setComplete(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Setup is unavailable or the submitted details are invalid.");
    } finally {
      setSubmitting(false);
    }
  };

  return <main className="login"><div className="login-brand"><span className="brand-mark" aria-hidden="true"><i /><i /></span>BERB</div>
    <section className="card"><h1>Initial administrator setup</h1>
      {complete ? <><p className="login-subtitle" role="status">The owner account has been created. Initial setup is now permanently closed.</p><a className="btn" href="/admin/login">Sign in</a></> : <>
        <p className="login-subtitle">Create the first owner account for this installation.</p>
        {error && <div className="alert err" role="alert">{error}</div>}
        <form onSubmit={submit}>
          <div className="field"><label htmlFor="setup-name">Owner name</label><input id="setup-name" name="name" autoComplete="name" required minLength={2} maxLength={100} value={name} onChange={(event) => setName(event.target.value)} /></div>
          <div className="field"><label htmlFor="setup-email">Email</label><input id="setup-email" name="email" type="email" autoComplete="email" required maxLength={200} value={email} onChange={(event) => setEmail(event.target.value)} /></div>
          <div className="field"><label htmlFor="setup-password">Password</label><input id="setup-password" name="password" type="password" autoComplete="new-password" required minLength={12} maxLength={200} value={password} onChange={(event) => setPassword(event.target.value)} /></div>
          <div className="field"><label htmlFor="setup-secret">Setup secret</label><input id="setup-secret" name="setupSecret" type="password" autoComplete="off" required minLength={43} maxLength={512} value={setupSecret} onChange={(event) => setSetupSecret(event.target.value)} /></div>
          <button className="btn" type="submit" disabled={submitting}>{submitting ? "Creating owner..." : "Create owner account"}</button>
        </form>
      </>}</section></main>;
}