"use client";

import Link from "next/link";
import { useState } from "react";
import { createServiceAction, updateServiceAction } from "@/app/actions/admin";

type S = {
  _id?: unknown;
  name?: string;
  slug?: string;
  category?: string;
  description?: string;
  defaultDurationMinutes?: number;
  bufferMinutes?: number;
  startingPrice?: number | null;
  active?: boolean;
};

export function ServiceEditor({ service, mode }: { service?: S | null; mode: "add" | "edit" }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const action = service?._id ? updateServiceAction.bind(null, String(service._id)) : createServiceAction;

  const isEdit = mode === "edit" && Boolean(service);
  const title = isEdit ? "Edit service" : "Add service";

  return (
    <div className="service-modal-backdrop">
      <div className="service-modal">
        <div className="service-modal-header">
          <div>
            <p>Service</p>
            <h2>{title}</h2>
          </div>
          <Link href="/admin/services" className="btn sm out" aria-label="Close service form">Close</Link>
        </div>

        <form action={action} onSubmit={() => setIsSubmitting(true)} className="service-modal-form">
          <div className="service-form-grid">
            <div className="field">
              <label htmlFor={`name-${mode}`}>Name</label>
              <input id={`name-${mode}`} name="name" required defaultValue={service?.name ?? ""} />
            </div>

            <div className="field">
              <label htmlFor={`slug-${mode}`}>Slug</label>
              <input id={`slug-${mode}`} name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" defaultValue={service?.slug ?? ""} />
            </div>

            <div className="field">
              <label htmlFor={`category-${mode}`}>Category</label>
              <input id={`category-${mode}`} name="category" required defaultValue={service?.category ?? ""} />
            </div>

            <div className="field">
              <label htmlFor={`duration-${mode}`}>Duration (min)</label>
              <input id={`duration-${mode}`} name="defaultDurationMinutes" type="number" min={15} max={720} required defaultValue={service?.defaultDurationMinutes ?? 120} />
            </div>

            <div className="field">
              <label htmlFor={`buffer-${mode}`}>Buffer (min)</label>
              <input id={`buffer-${mode}`} name="bufferMinutes" type="number" min={0} max={240} defaultValue={service?.bufferMinutes ?? 30} />
            </div>

            <div className="field">
              <label htmlFor={`price-${mode}`}>Starting price</label>
              <input id={`price-${mode}`} name="startingPrice" type="number" min={0} step="0.01" defaultValue={service?.startingPrice ?? 0} />
            </div>

            <div className="field full">
              <label htmlFor={`description-${mode}`}>Description</label>
              <textarea id={`description-${mode}`} name="description" maxLength={1000} rows={5} defaultValue={service?.description ?? ""} />
            </div>

            <label className="checkbox-label">
              <input name="active" type="checkbox" defaultChecked={service?.active ?? true} />
              Active
            </label>
          </div>

          <div className="service-form-actions">
            <Link href="/admin/services" className="btn sm out">Cancel</Link>
            <button type="submit" className="btn" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : isEdit ? "Save changes" : "Create service"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
