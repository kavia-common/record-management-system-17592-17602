import React, { useEffect, useState } from "react";

// Simple validators
const required = (v) => (v?.toString().trim() ? "" : "This field is required");
const maxLen = (n) => (v) =>
  v && v.toString().length > n ? `Must be at most ${n} characters` : "";

// PUBLIC_INTERFACE
export default function RecordForm({
  initial = { title: "", description: "" },
  onSubmit,
  onCancel,
  submitting = false,
}) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setValues(initial);
    setErrors({});
  }, [initial]);

  const validators = {
    title: [(v) => required(v), maxLen(100)],
    description: [maxLen(500)],
  };

  const validateField = (name, value) => {
    const fns = validators[name] || [];
    for (let fn of fns) {
      const msg = fn(value);
      if (msg) return msg;
    }
    return "";
  };

  const validateAll = () => {
    const next = {};
    for (let key of Object.keys(values)) {
      const msg = validateField(key, values[key]);
      if (msg) next[key] = msg;
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((s) => ({ ...s, [name]: value }));
    // live validate
    const msg = validateField(name, value);
    setErrors((s) => {
      const n = { ...s };
      if (msg) n[name] = msg;
      else delete n[name];
      return n;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateAll()) return;
    onSubmit?.(values);
  };

  return (
    <form onSubmit={handleSubmit} className="form">
      <div className="form-row">
        <label htmlFor="title" className="form-label">
          Title <span className="req">*</span>
        </label>
        <input
          id="title"
          name="title"
          type="text"
          className={`input ${errors.title ? "input-error" : ""}`}
          placeholder="Enter title"
          value={values.title}
          onChange={handleChange}
          required
          maxLength={100}
        />
        {errors.title ? <div className="error">{errors.title}</div> : null}
      </div>

      <div className="form-row">
        <label htmlFor="description" className="form-label">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          className={`textarea ${errors.description ? "input-error" : ""}`}
          placeholder="Enter a short description (optional)"
          value={values.description}
          onChange={handleChange}
          maxLength={500}
          rows={4}
        />
        {errors.description ? (
          <div className="error">{errors.description}</div>
        ) : null}
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn" disabled={submitting}>
          {submitting ? "Saving..." : "Save"}
        </button>
      </div>
    </form>
  );
}
