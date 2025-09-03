import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import dayjs from "dayjs";
import Modal from "./components/Modal";
import RecordForm from "./components/RecordForm";
import { api } from "./api";
import "./components/modal.css";

/**
 * Simple in-memory id for optimistic UI placeholders
 */
let tempId = -1;

// PUBLIC_INTERFACE
function App() {
  // Theme toggle (light only by default, but maintain infra)
  const [theme] = useState("light");
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Data state
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyIds, setBusyIds] = useState(new Set()); // track operations per row
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  // Modals and forms
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  // Polling for real-time updates
  const abortRef = useRef(null);
  const pollInterval = 4000;

  const fetchRecords = useCallback(async () => {
    try {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      const data = await api.listRecords(controller.signal);
      setRecords(data || []);
      setError("");
    } catch (e) {
      if (e.name === "CanceledError") return;
      setError("Failed to load records.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecords();
    const id = setInterval(fetchRecords, pollInterval);
    return () => clearInterval(id);
  }, [fetchRecords]);

  // Derived filtered records
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return records;
    return records.filter(
      (r) =>
        r.title?.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q) ||
        String(r.id).includes(q)
    );
  }, [records, search]);

  // Create
  const handleCreate = async (payload) => {
    setCreateOpen(false);
    // optimistic insert
    const optimistic = { id: tempId--, ...payload, created_at: new Date().toISOString() };
    setRecords((s) => [optimistic, ...s]);
    try {
      const created = await api.createRecord(payload);
      setRecords((s) =>
        s.map((r) => (r.id === optimistic.id ? created : r))
      );
    } catch (e) {
      // revert
      setRecords((s) => s.filter((r) => r.id !== optimistic.id));
      setError("Failed to create record.");
    }
  };

  // Edit
  const openEdit = (rec) => {
    setEditing(rec);
    setEditOpen(true);
  };
  const handleEdit = async (payload) => {
    const id = editing.id;
    setEditOpen(false);
    setBusyIds((s) => new Set(s).add(id));
    // optimistic update
    const prev = records.find((r) => r.id === id);
    setRecords((s) => s.map((r) => (r.id === id ? { ...r, ...payload } : r)));
    try {
      const updated = await api.updateRecord(id, payload);
      setRecords((s) => s.map((r) => (r.id === id ? updated : r)));
    } catch (e) {
      // revert
      setRecords((s) => s.map((r) => (r.id === id ? prev : r)));
      setError("Failed to update record.");
    } finally {
      setBusyIds((s) => {
        const n = new Set(s);
        n.delete(id);
        return n;
      });
    }
  };

  // Delete
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this record?")) return;
    setBusyIds((s) => new Set(s).add(id));
    const prev = records;
    // optimistic remove
    setRecords((s) => s.filter((r) => r.id !== id));
    try {
      await api.deleteRecord(id);
    } catch (e) {
      // revert
      setRecords(prev);
      setError("Failed to delete record.");
    } finally {
      setBusyIds((s) => {
        const n = new Set(s);
        n.delete(id);
        return n;
      });
    }
  };

  return (
    <div className="app">
      {/* Top Navbar */}
      <nav className="navbar">
        <div className="brand">
          <div className="brand-badge" />
          <div className="brand-title">Record Management</div>
        </div>
        <div className="nav-actions">
          <input
            type="search"
            placeholder="Search records..."
            className="input search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search records"
          />
          <button className="btn" onClick={() => setCreateOpen(true)}>
            + New Record
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container">
        <section className="card">
          <div className="card-header">
            <h2 className="card-title">
              Records {loading ? <span className="badge">Loading</span> : null}
            </h2>
            <div className="spacer" />
            <button className="btn btn-secondary" onClick={fetchRecords}>
              Refresh
            </button>
          </div>
          <div className="card-body">
            {error ? (
              <div className="error" role="alert" style={{ marginBottom: 12 }}>
                {error}
              </div>
            ) : null}
            <div className="table-wrap">
              <table className="table" role="table">
                <thead>
                  <tr>
                    <th style={{ width: 80 }}>ID</th>
                    <th>Title</th>
                    <th>Description</th>
                    <th style={{ width: 190 }}>Created</th>
                    <th style={{ width: 160 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {!loading && filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: "center", padding: 24 }}>
                        No records found.
                      </td>
                    </tr>
                  ) : null}
                  {filtered.map((r) => {
                    const busy = busyIds.has(r.id);
                    return (
                      <tr key={r.id}>
                        <td>{r.id}</td>
                        <td>{r.title}</td>
                        <td>{r.description}</td>
                        <td>{r.created_at ? dayjs(r.created_at).format("YYYY-MM-DD HH:mm") : "—"}</td>
                        <td>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button
                              className="btn btn-secondary"
                              onClick={() => openEdit(r)}
                              disabled={busy}
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn-danger"
                              onClick={() => handleDelete(r.id)}
                              disabled={busy}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>

      {/* Create Modal */}
      <Modal
        open={createOpen}
        title="Create Record"
        onClose={() => setCreateOpen(false)}
        footer={null}
      >
        <RecordForm
          initial={{ title: "", description: "" }}
          onSubmit={handleCreate}
          onCancel={() => setCreateOpen(false)}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        open={editOpen}
        title={`Edit Record${editing?.id ? ` #${editing.id}` : ""}`}
        onClose={() => setEditOpen(false)}
        footer={null}
      >
        <RecordForm
          initial={{
            title: editing?.title ?? "",
            description: editing?.description ?? "",
          }}
          onSubmit={handleEdit}
          onCancel={() => setEditOpen(false)}
        />
      </Modal>
    </div>
  );
}

export default App;
