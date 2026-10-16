import { loginAction } from "../actions/admin";
import { Flash } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";

export default async function Login({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  return <main className="login"><div className="login-brand"><span className="brand-mark" aria-hidden="true"><i /><i /></span>BERB</div>
    <div className="card"><h1>Admin sign in</h1><p className="login-subtitle">Access the BERB operations dashboard.</p><Flash sp={await searchParams} />
      <form action={loginAction}>
        <div className="field"><label htmlFor="email">Email</label><input id="email" name="email" type="email" required autoComplete="username" /></div>
        <div className="field"><label htmlFor="password">Password</label><input id="password" name="password" type="password" required autoComplete="current-password" /></div>
        <SubmitButton pendingLabel="Signing in..." type="submit">Sign in</SubmitButton></form></div></main>;
}
