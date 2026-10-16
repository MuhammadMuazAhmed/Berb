import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bath,
  CalendarDays,
  Check,
  CircleHelp,
  Clock3,
  Flame,
  LoaderCircle,
  Sun,
  Wrench,
  X,
  type LucideIcon,
} from "lucide-react";
import { submitServiceRequest, type ApiService } from "../lib/api";
import { useServices } from "../hooks/useServices";

type Urgency = "emergency" | "urgent" | "standard";
type Step = 0 | 1 | 2 | 3 | 4;
type FieldName = "name" | "email" | "phone" | "line1" | "postalCode" | "city" | "description";
type RequestFields = Record<FieldName, string>;
type FieldErrors = Partial<Record<FieldName | "service" | "urgency" | "schedule", string>>;

const stepNames = ["Service", "Urgency", "Schedule", "Your details", "Review"] as const;
const urgencyOptions: { value: Urgency; title: string; detail: string; icon: LucideIcon }[] = [
  { value: "emergency", title: "Emergency", detail: "An active leak or immediate risk", icon: Flame },
  { value: "urgent", title: "Urgent", detail: "Needs attention soon", icon: Clock3 },
  { value: "standard", title: "Standard", detail: "Plan non-urgent work", icon: CalendarDays },
];

const serviceIcon = (service: ApiService): LucideIcon => {
  const label = `${service.category} ${service.name}`.toLowerCase();
  if (label.includes("heating") || label.includes("boiler")) return Flame;
  if (label.includes("solar")) return Sun;
  if (label.includes("bath") || label.includes("sanitary")) return Bath;
  if (label.includes("drain") || label.includes("leak") || label.includes("pipe")) return Wrench;
  return CircleHelp;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const emptyFields: RequestFields = {
  name: "",
  email: "",
  phone: "",
  line1: "",
  postalCode: "",
  city: "",
  description: "",
};

export default function ServiceRequestFlow({
  open,
  initialService,
  onClose,
}: {
  open: boolean;
  initialService?: string;
  onClose: () => void;
}) {
  const { options, loading: servicesLoading, error: servicesError, retry: retryServices } = useServices();
  const [step, setStep] = useState<Step>(0);
  const [selectedService, setSelectedService] = useState("");
  const [urgency, setUrgency] = useState<Urgency | "">("");
  const [scheduleMode, setScheduleMode] = useState<"flexible" | "preferred">("flexible");
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [fields, setFields] = useState<RequestFields>(emptyFields);
  const [website, setWebsite] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [reference, setReference] = useState("");
  const [submittedName, setSubmittedName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const dialogRef = useRef<HTMLElement>(null);
  const submittingRef = useRef(false);

  useEffect(() => {
    if (!open) return;
    setStep(0);
    setSelectedService("");
    setUrgency("");
    setScheduleMode("flexible");
    setPreferredDate("");
    setPreferredTime("");
    setFields(emptyFields);
    setWebsite("");
    setErrors({});
    setSubmitError("");
    setReference("");
    setSubmittedName("");
    setSubmitting(false);
    submittingRef.current = false;
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab" || !dialogRef.current) return;
      const items = dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
      );
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    dialogRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      previousFocus?.focus();
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !initialService || options.length === 0) return;
    const query = initialService.trim().toLowerCase();
    const match = options.find((service) =>
      [service.id, service.slug, service.name, service.category].some((value) => value?.toLowerCase() === query),
    );
    if (match) setSelectedService(match.id);
  }, [initialService, open, options]);

  if (!open) return null;

  const service = options.find((item) => item.id === selectedService);
  const clearError = (key: FieldName) => setErrors((current) => ({ ...current, [key]: undefined }));
  const setField = (key: FieldName, value: string) => {
    setFields((current) => ({ ...current, [key]: value }));
    clearError(key);
  };

  const validateStep = (currentStep: Step): FieldErrors => {
    const nextErrors: FieldErrors = {};
    if (currentStep === 0 && !options.some((item) => item.id === selectedService))
      nextErrors.service = "Choose a service to continue.";
    if (currentStep === 1 && !urgency) nextErrors.urgency = "Choose the urgency that best describes your situation.";
    if (currentStep === 2 && scheduleMode === "preferred") {
      if (!preferredDate || !preferredTime) nextErrors.schedule = "Choose both a preferred date and time, or select that you are flexible.";
    }
    if (currentStep === 3) {
      if (fields.name.trim().length < 2) nextErrors.name = "Enter your full name.";
      if (!emailPattern.test(fields.email.trim())) nextErrors.email = "Enter a valid email address.";
      if (fields.phone.trim() && (fields.phone.trim().length < 5 || fields.phone.trim().length > 30))
        nextErrors.phone = "Enter a valid phone number, or leave this field blank.";
      if (fields.line1.trim().length < 3) nextErrors.line1 = "Enter the service street address.";
      if (fields.postalCode.trim().length > 20) nextErrors.postalCode = "Postcode must be 20 characters or fewer.";
      if (fields.city.trim().length > 100) nextErrors.city = "City must be 100 characters or fewer.";
      if (fields.description.trim().length < 5) nextErrors.description = "Describe the work needed (at least 5 characters).";
      if (fields.description.trim().length > 3000) nextErrors.description = "Keep the description under 3,000 characters.";
    }
    return nextErrors;
  };

  const continueStep = () => {
    const found = validateStep(step);
    setErrors(found);
    const firstError = Object.keys(found)[0];
    if (firstError) {
      const target = document.querySelector<HTMLElement>(`[data-error-field="${firstError}"]`);
      target?.focus();
      return;
    }
    setSubmitError("");
    setStep((current) => Math.min(4, current + 1) as Step);
  };

  const submit = async () => {
    if (submittingRef.current) return;
    const found = validateStep(3);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setStep(3);
      return;
    }
    if (!service) {
      setStep(0);
      setErrors({ service: "Choose an available service before submitting." });
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    setSubmitError("");
    try {
      const response = await submitServiceRequest({
        customerName: fields.name.trim(),
        email: fields.email.trim(),
        phone: fields.phone.trim() || undefined,
        service: service.id,
        urgency: urgency as Urgency,
        address: {
          line1: fields.line1.trim(),
          ...(fields.postalCode.trim() && { postalCode: fields.postalCode.trim() }),
          ...(fields.city.trim() && { city: fields.city.trim() }),
        },
        preferredDate: scheduleMode === "preferred" ? `${preferredDate}T${preferredTime}` : undefined,
        jobDescription: fields.description.trim(),
        requestType: "service_request",
        source: "service_page",
        website,
      });
      if (!response.reference || response.reference === "BERB-IGNORED")
        throw new Error("We couldn't confirm that your request was saved. Please contact BERB directly before trying again.");
      setSubmittedName(fields.name.trim().split(/\s+/)[0]);
      setStep(0);
      setSelectedService("");
      setUrgency("");
      setScheduleMode("flexible");
      setPreferredDate("");
      setPreferredTime("");
      setFields(emptyFields);
      setWebsite("");
      setErrors({});
      setSubmitError("");
      setReference(response.reference);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Your request could not be sent. Please try again.");
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  const editStep = (target: Step) => {
    setErrors({});
    setSubmitError("");
    setStep(target);
  };

  const field = (key: FieldName, label: string, options?: { type?: string; autoComplete?: string; optional?: boolean; placeholder?: string }) => (
    <div className="field" key={key}>
      <label htmlFor={`request-${key}`}>{label}{options?.optional && <span className="field-optional"> (optional)</span>}</label>
      <input
        id={`request-${key}`}
        data-error-field={key}
        type={options?.type ?? "text"}
        autoComplete={options?.autoComplete}
        placeholder={options?.placeholder}
        value={fields[key]}
        onChange={(event) => setField(key, event.target.value)}
        aria-invalid={Boolean(errors[key])}
        aria-describedby={errors[key] ? `request-${key}-error` : undefined}
      />
      {errors[key] && <p className="field-error" id={`request-${key}-error`} role="alert">{errors[key]}</p>}
    </div>
  );

  return (
    <div className="request-overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="request-dialog" role="dialog" aria-modal="true" aria-labelledby="request-title" tabIndex={-1} ref={dialogRef}>
        <header className="request-header">
          <div className="request-heading">
            <span className="request-brand-mark" aria-hidden="true"><Wrench size={17} /></span>
            <div><p className="request-eyebrow">BERB Plumbing</p><h2 id="request-title">Request a Service</h2></div>
          </div>
          <button type="button" className="request-close" onClick={onClose} aria-label="Close service request"><X size={21} /></button>
        </header>

        {reference ? (
          <div className="request-success" role="status" aria-live="polite">
            <span className="request-success-icon"><Check size={27} /></span>
            <p className="request-eyebrow">Request received</p>
            <h3>Thank you, {submittedName}.</h3>
            <p>Your service request has been saved. Our team will review your preferred timing and get in touch to confirm next steps.</p>
            <div className="request-reference"><span>Reference</span><strong>{reference}</strong></div>
            <button type="button" className="btn btn-dark request-submit" onClick={onClose}>Close</button>
          </div>
        ) : (
          <>
            <div className="request-intro"><p>Tell us what you need and we’ll follow up with you.</p><span><span className="required-dot">*</span> Required fields</span></div>
            <nav className="request-steps" aria-label="Request progress">
              {stepNames.map((name, index) => index < step ? (
                <button key={name} type="button" className="request-step request-step-button is-complete" onClick={() => { setErrors({}); setSubmitError(""); setStep(index as Step); }} aria-label={`Return to ${name}`}>
                  <span className="request-step-number"><Check size={14} /></span><span>{name}</span>
                </button>
              ) : (
                <div className={`request-step${index === step ? " is-current" : ""}`} key={name} aria-current={index === step ? "step" : undefined}>
                  <span className="request-step-number">{index + 1}</span><span>{name}</span>
                </div>
              ))}
            </nav>
            <div className="request-progress" role="progressbar" aria-label="Form progress" aria-valuemin={1} aria-valuemax={5} aria-valuenow={step + 1}>
              <span style={{ width: `${((step + 1) / 5) * 100}%` }} />
            </div>

            <form onSubmit={(event) => event.preventDefault()} noValidate>
              <div className="request-body" key={step}>
                {step === 0 && <div className="request-step-content">
                  <div className="request-section-heading"><span>01</span><div><h3>What can we help with?</h3><p>Select a service from our current offering.</p></div></div>
                  {servicesLoading ? <div className="request-service-grid" aria-label="Loading services">{[0, 1, 2].map((item) => <div className="request-service-skeleton" key={item} />)}</div>
                    : servicesError ? <div className="request-feedback request-error" role="alert"><p>{servicesError}</p><button type="button" className="btn btn-outline-dark" onClick={retryServices}>Try again</button></div>
                    : options.length === 0 ? <div className="request-feedback" role="status">There are no services available to request at the moment. Please contact BERB directly.</div>
                    : <fieldset className="request-service-grid" data-error-field="service" tabIndex={-1}><legend className="sr-only">Choose an available service</legend>
                      {options.map((option) => {
                        const Icon = serviceIcon(option);
                        const chosen = selectedService === option.id;
                        return <label className={`request-service-option${chosen ? " is-selected" : ""}`} key={option.id}>
                          <input type="radio" name="service" value={option.id} checked={chosen} onChange={() => { setSelectedService(option.id); setErrors((current) => ({ ...current, service: undefined })); }} />
                          <span className="request-option-icon"><Icon size={21} strokeWidth={1.8} /></span><span className="request-option-copy"><strong>{option.name}</strong>{option.description && <small>{option.description}</small>}</span>
                          <span className="request-option-check"><Check size={15} /></span>
                        </label>;
                      })}
                    </fieldset>}
                  {errors.service && <p className="field-error" data-error-field="service" role="alert">{errors.service}</p>}
                </div>}

                {step === 1 && <div className="request-step-content">
                  <div className="request-section-heading"><span>02</span><div><h3>How urgent is it?</h3><p>This helps us understand your situation; it does not promise a response time.</p></div></div>
                  <fieldset className="request-choice-grid" data-error-field="urgency" tabIndex={-1}><legend className="sr-only">Select urgency</legend>{urgencyOptions.map(({ value, title, detail, icon: Icon }) => <label className={`request-choice${urgency === value ? " is-selected" : ""}`} key={value}>
                    <input type="radio" name="urgency" value={value} checked={urgency === value} onChange={() => { setUrgency(value); setErrors((current) => ({ ...current, urgency: undefined })); }} />
                    <Icon size={21} aria-hidden="true" /><span><strong>{title}</strong><small>{detail}</small></span><span className="request-choice-mark"><Check size={14} /></span>
                  </label>)}</fieldset>
                  {errors.urgency && <p className="field-error" role="alert">{errors.urgency}</p>}
                </div>}

                {step === 2 && <div className="request-step-content">
                  <div className="request-section-heading"><span>03</span><div><h3>When works for you?</h3><p>Any date or time you share is a preference, not a confirmed appointment.</p></div></div>
                  <fieldset className="request-schedule-options" data-error-field="schedule" tabIndex={-1}><legend className="sr-only">Choose schedule preference</legend>
                    <label className={`request-schedule-choice${scheduleMode === "flexible" ? " is-selected" : ""}`}><input type="radio" name="scheduleMode" checked={scheduleMode === "flexible"} onChange={() => { setScheduleMode("flexible"); setErrors((current) => ({ ...current, schedule: undefined })); }} /><span><strong>I'm flexible</strong><small>Contact me to discuss a suitable time.</small></span><span className="request-choice-mark"><Check size={14} /></span></label>
                    <label className={`request-schedule-choice${scheduleMode === "preferred" ? " is-selected" : ""}`}><input type="radio" name="scheduleMode" checked={scheduleMode === "preferred"} onChange={() => { setScheduleMode("preferred"); setErrors((current) => ({ ...current, schedule: undefined })); }} /><span><strong>I have a preferred time</strong><small>We’ll confirm availability with you.</small></span><span className="request-choice-mark"><Check size={14} /></span></label>
                  </fieldset>
                  {scheduleMode === "preferred" && <div className="request-date-grid">
                    <div className="field"><label htmlFor="request-date">Preferred date</label><input id="request-date" type="date" value={preferredDate} onChange={(event) => { setPreferredDate(event.target.value); setErrors((current) => ({ ...current, schedule: undefined })); }} /></div>
                    <div className="field"><label htmlFor="request-time">Preferred time</label><input id="request-time" type="time" value={preferredTime} onChange={(event) => { setPreferredTime(event.target.value); setErrors((current) => ({ ...current, schedule: undefined })); }} /></div>
                    <p className="request-time-note"><Clock3 size={15} /> Time is interpreted in BERB's configured business timezone.</p>
                  </div>}
                  {errors.schedule && <p className="field-error" role="alert">{errors.schedule}</p>}
                </div>}

                {step === 3 && <div className="request-step-content">
                  <div className="request-section-heading"><span>04</span><div><h3>Your details</h3><p>How can our team reach you about this request?</p></div></div>
                  <div className="request-fields-grid">
                    {field("name", "Full name *", { autoComplete: "name" })}
                    {field("email", "Email address *", { type: "email", autoComplete: "email" })}
                    {field("phone", "Phone number", { type: "tel", autoComplete: "tel", optional: true })}
                    {field("line1", "Street address *", { autoComplete: "address-line1", placeholder: "Street and house number" })}
                    {field("postalCode", "Postcode", { autoComplete: "postal-code", optional: true })}
                    {field("city", "City", { autoComplete: "address-level2", optional: true })}
                    <div className="field request-field-wide">
                      <label htmlFor="request-description">Describe the problem *</label>
                      <textarea id="request-description" data-error-field="description" rows={4} maxLength={3000} value={fields.description} onChange={(event) => setField("description", event.target.value)} aria-invalid={Boolean(errors.description)} aria-describedby={errors.description ? "request-description-error" : undefined} placeholder="Tell us what’s happening and any useful details." />
                      <div className="request-description-meta">{errors.description ? <p className="field-error" id="request-description-error" role="alert">{errors.description}</p> : <span>At least 5 characters</span>}<span>{fields.description.length}/3000</span></div>
                    </div>
                    <div className="request-honeypot" aria-hidden="true"><label htmlFor="request-website">Website</label><input id="request-website" tabIndex={-1} autoComplete="off" value={website} onChange={(event) => setWebsite(event.target.value)} /></div>
                  </div>
                </div>}

                {step === 4 && <div className="request-step-content">
                  <div className="request-section-heading"><span>05</span><div><h3>Review your request</h3><p>Check your details before sending.</p></div></div>
                  <div className="request-review">
                    <section className="request-review-block"><div><h4>Service</h4><button type="button" onClick={() => editStep(0)}>Edit</button></div><p>{service?.name ?? "Not selected"}</p></section>
                    <section className="request-review-block"><div><h4>Urgency</h4><button type="button" onClick={() => editStep(1)}>Edit</button></div><p>{urgency ? urgency[0].toUpperCase() + urgency.slice(1) : "Not selected"}</p></section>
                    <section className="request-review-block"><div><h4>Preferred schedule</h4><button type="button" onClick={() => editStep(2)}>Edit</button></div><p>{scheduleMode === "flexible" ? "I'm flexible" : `${preferredDate} at ${preferredTime} (preference only)`}</p></section>
                    <section className="request-review-block"><div><h4>Customer and address</h4><button type="button" onClick={() => editStep(3)}>Edit</button></div>
                      <p>{fields.name}<br />{fields.email}{fields.phone && <><br />{fields.phone}</>}<br />{fields.line1}{fields.postalCode && `, ${fields.postalCode}`}{fields.city && ` ${fields.city}`}</p></section>
                    <section className="request-review-block"><h4>Problem description</h4><p className="request-review-description">{fields.description}</p></section>
                  </div>
                  {submitError && <div className="request-feedback request-error" role="alert">{submitError}</div>}
                </div>}
              </div>

              <footer className="request-footer">
                {step > 0 ? <button type="button" className="btn btn-outline-dark request-back" onClick={() => { setSubmitError(""); setErrors({}); setStep((current) => (current - 1) as Step); }}><ArrowLeft size={17} />Back</button> : <span />}
                {step < 4 ? <button type="button" className="btn btn-dark request-continue" onClick={continueStep} disabled={step === 0 && (servicesLoading || Boolean(servicesError) || options.length === 0)}>Continue<ArrowRight size={17} /></button>
                  : <button type="button" className="btn btn-dark request-continue request-submit" onClick={submit} disabled={submitting} aria-busy={submitting}>{submitting ? <><LoaderCircle className="request-spinner" size={17} />Sending request</> : <>Submit request<ArrowRight size={17} /></>}</button>}
              </footer>
            </form>
          </>
        )}
      </section>
    </div>
  );
}