"use client";

import { useFormStatus } from "react-dom";
import { LoaderCircle } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export function SubmitButton({ children, pendingLabel = "Saving...", className = "btn", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode; pendingLabel?: string }) {
  const { pending } = useFormStatus();
  return <button {...props} className={className} disabled={pending || props.disabled}>
    {pending && <LoaderCircle className="submit-spinner" size={15} aria-hidden="true" />}
    {pending ? pendingLabel : children}
  </button>;
}