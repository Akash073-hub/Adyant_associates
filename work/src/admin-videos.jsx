import { useCallback, useEffect, useMemo, useState } from 'react';
import './admin-management.css';
import { apiRequest } from './api';

const emptyVideo = { title: '', url: '', description: '' };
const emptyProgram = {
  id: '', title: '', type: '', format: '', description: '', price_label: '', action_label: '',
  rating: '', alumni: '', old_price: '', highlights: '', syllabus_url: '', action_url: '',
  program_url: '', status: 'available', featured: false,
};
const emptyCohort = {
  id: '', program_id: '', title: '', start_date: '', schedule: '', time_ist: '', time_est: '',
  instructor: '', instructor_role: '', seats_total: 0, seats_taken: 0, booking_url: '', status: 'open',
};
const bookingStatuses = ['pending_payment', 'paid', 'confirmed', 'active', 'cancelled', 'completed', 'rejected'];

function AdminVideos() {
  const [tab, setTab] = useState('videos');
  const [videos, setVideos] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [cohorts, setCohorts] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [videoDraft, setVideoDraft] = useState(emptyVideo);
  const [programDraft, setProgramDraft] = useState(emptyProgram);
  const [cohortDraft, setCohortDraft] = useState(emptyCohort);
  const [editingVideoId, setEditingVideoId] = useState('');
  const [editingProgramId, setEditingProgramId] = useState('');
  const [editingCohortId, setEditingCohortId] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const token = sessionStorage.getItem('adminToken');

  const adminOptions = useMemo(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);
  const loadAdminData = useCallback(async () => {
    if (!token) {
      window.location.replace('/admin-login');
      return;
    }
    try {
      const [videoResult, programResult, cohortResult, bookingResult] = await Promise.all([
        apiRequest('/admin/videos', adminOptions),
        apiRequest('/admin/programs', adminOptions),
        apiRequest('/admin/cohorts', adminOptions),
        apiRequest('/admin/bookings', adminOptions),
      ]);
      setVideos(videoResult.videos || []);
      setPrograms(programResult.programs || []);
      setCohorts(cohortResult.cohorts || []);
      setBookings(bookingResult.bookings || []);
      setCohortDraft((current) => current.program_id ? current : { ...emptyCohort, program_id: programResult.programs?.[0]?.id || '' });
    } catch (requestError) {
      if (requestError.message.includes('Admin session')) {
        sessionStorage.removeItem('adminToken');
        window.location.replace('/admin-login');
        return;
      }
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, [token, adminOptions]);

  useEffect(() => { loadAdminData(); }, [loadAdminData]);

  function clearMessages() {
    setError('');
    setNotice('');
  }

  async function saveResource(path, method, body, successMessage) {
    clearMessages();
    setSaving(true);
    try {
      await apiRequest(path, { method, ...adminOptions, body: JSON.stringify(body) });
      await loadAdminData();
      setNotice(successMessage);
      return true;
    } catch (requestError) {
      setError(requestError.message);
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function deleteResource(path, successMessage) {
    if (!window.confirm('Delete this item? This cannot be undone.')) return;
    clearMessages();
    try {
      await apiRequest(path, { method: 'DELETE', ...adminOptions });
      await loadAdminData();
      setNotice(successMessage);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function submitVideo(event) {
    event.preventDefault();
    const ok = await saveResource(
      editingVideoId ? `/admin/videos/${encodeURIComponent(editingVideoId)}` : '/admin/videos',
      editingVideoId ? 'PUT' : 'POST',
      videoDraft,
      editingVideoId ? 'Video updated.' : 'Video added to the learning library.',
    );
    if (ok) { setVideoDraft(emptyVideo); setEditingVideoId(''); }
  }

  async function submitProgram(event) {
    event.preventDefault();
    const payload = {
      ...programDraft,
      highlights: programDraft.highlights.split(',').map((item) => item.trim()).filter(Boolean),
    };
    const ok = await saveResource(
      editingProgramId ? `/admin/programs/${encodeURIComponent(editingProgramId)}` : '/admin/programs',
      editingProgramId ? 'PUT' : 'POST',
      payload,
      editingProgramId ? 'Program updated.' : 'Program added to the catalog.',
    );
    if (ok) { setProgramDraft(emptyProgram); setEditingProgramId(''); }
  }

  async function submitCohort(event) {
    event.preventDefault();
    const payload = { ...cohortDraft, seats_total: Number(cohortDraft.seats_total), seats_taken: Number(cohortDraft.seats_taken) };
    const ok = await saveResource(
      editingCohortId ? `/admin/cohorts/${encodeURIComponent(editingCohortId)}` : '/admin/cohorts',
      editingCohortId ? 'PUT' : 'POST',
      payload,
      editingCohortId ? 'Cohort schedule updated.' : 'Cohort schedule added.',
    );
    if (ok) { setCohortDraft({ ...emptyCohort, program_id: programs[0]?.id || '' }); setEditingCohortId(''); }
  }

  async function updateBooking(booking, changes) {
    await saveResource(`/admin/bookings/${encodeURIComponent(booking.id)}`, 'PUT', changes, `Booking ${booking.id} updated.`);
  }

  function editVideo(video) {
    setTab('videos'); setEditingVideoId(video.id);
    setVideoDraft({ title: video.title || '', url: video.url || '', description: video.description || '' });
    clearMessages();
  }

  function editProgram(program) {
    setTab('programs'); setEditingProgramId(program.id);
    setProgramDraft({ ...emptyProgram, ...program, highlights: (program.highlights || []).join(', ') });
    clearMessages();
  }

  function editCohort(cohort) {
    setTab('cohorts'); setEditingCohortId(cohort.id);
    setCohortDraft({ ...emptyCohort, ...cohort });
    clearMessages();
  }

  function signOut() {
    sessionStorage.removeItem('adminToken');
    window.location.href = '/';
  }

  const tabs = [
    ['videos', `Videos (${videos.length})`],
    ['programs', `Programs (${programs.length})`],
    ['cohorts', `Cohorts (${cohorts.length})`],
    ['bookings', `Bookings (${bookings.length})`],
  ];

  return <main className="admin-management-page">
    <header className="admin-management-header"><a href="/admin" className="admin-management-brand"><span>A</span> Adyant Associates <small>ADMIN</small></a><button type="button" onClick={signOut}>Sign out</button></header>
    <div className="admin-management-main">
      <div className="admin-management-title"><div><span>CONTENT &amp; OPERATIONS</span><h1>Admin management</h1><p>Manage the live catalog, schedules, classroom videos, and booking statuses.</p></div></div>
      <nav className="admin-management-tabs" aria-label="Admin sections">{tabs.map(([key, label]) => <button className={tab === key ? 'active' : ''} onClick={() => { setTab(key); clearMessages(); }} type="button" key={key}>{label}</button>)}</nav>
      {error && <div className="admin-management-message error" role="alert">{error}</div>}
      {notice && <div className="admin-management-message success" role="status">{notice}</div>}
      {loading ? <p className="admin-management-loading">Loading admin data…</p> : <>
        {tab === 'videos' && <section className="admin-management-grid">
          <form className="admin-management-form" onSubmit={submitVideo}>
            <h2>{editingVideoId ? 'Edit video' : 'Add a video'}</h2>
            <Field label="Video title" value={videoDraft.title} onChange={(value) => setVideoDraft({ ...videoDraft, title: value })} required />
            <Field label="Video URL" type="url" value={videoDraft.url} onChange={(value) => setVideoDraft({ ...videoDraft, url: value })} required />
            <Field label="Class notes" as="textarea" value={videoDraft.description} onChange={(value) => setVideoDraft({ ...videoDraft, description: value })} />
            <div className="admin-management-actions"><button className="primary" disabled={saving}>{saving ? 'Saving…' : editingVideoId ? 'Save video' : 'Add video'}</button>{editingVideoId && <button type="button" onClick={() => { setEditingVideoId(''); setVideoDraft(emptyVideo); }}>Cancel</button>}</div>
          </form>
          <section className="admin-management-list"><h2>Learning library <b>{videos.length}</b></h2>{videos.length ? videos.map((video) => <article className="admin-item" key={video.id}><div><strong>{video.title}</strong><a href={video.url} target="_blank" rel="noreferrer">Open video ↗</a>{video.description && <p>{video.description}</p>}</div><div className="admin-item-actions"><button type="button" onClick={() => editVideo(video)}>Edit</button><button className="danger" type="button" onClick={() => deleteResource(`/admin/videos/${encodeURIComponent(video.id)}`, 'Video deleted.')}>Delete</button></div></article>) : <p className="admin-management-empty">No videos have been added yet.</p>}</section>
        </section>}

        {tab === 'programs' && <section className="admin-management-grid">
          <form className="admin-management-form" onSubmit={submitProgram}>
            <h2>{editingProgramId ? 'Edit program' : 'Add a program'}</h2>
            <div className="admin-form-row"><Field label="Title" value={programDraft.title} onChange={(value) => setProgramDraft({ ...programDraft, title: value })} required /><Field label="ID slug" value={programDraft.id} onChange={(value) => setProgramDraft({ ...programDraft, id: value })} disabled={Boolean(editingProgramId)} hint={editingProgramId ? 'ID cannot be changed' : 'Leave blank to generate from title'} /></div>
            <div className="admin-form-row"><Field label="Program type" value={programDraft.type} onChange={(value) => setProgramDraft({ ...programDraft, type: value })} placeholder="Leadership" /><Field label="Format" value={programDraft.format} onChange={(value) => setProgramDraft({ ...programDraft, format: value })} placeholder="Self-paced" /></div>
            <Field label="Description" as="textarea" value={programDraft.description} onChange={(value) => setProgramDraft({ ...programDraft, description: value })} required />
            <Field label="Highlights (comma-separated)" value={programDraft.highlights} onChange={(value) => setProgramDraft({ ...programDraft, highlights: value })} />
            <div className="admin-form-row"><Field label="Price label" value={programDraft.price_label} onChange={(value) => setProgramDraft({ ...programDraft, price_label: value })} placeholder="Start / Book" /><Field label="Action button text" value={programDraft.action_label} onChange={(value) => setProgramDraft({ ...programDraft, action_label: value })} /></div>
            <div className="admin-form-row"><Field label="Rating label" value={programDraft.rating} onChange={(value) => setProgramDraft({ ...programDraft, rating: value })} placeholder="5.0" /><Field label="Alumni label" value={programDraft.alumni} onChange={(value) => setProgramDraft({ ...programDraft, alumni: value })} placeholder="New" /></div>
            <Field label="Previous price label (optional)" value={programDraft.old_price} onChange={(value) => setProgramDraft({ ...programDraft, old_price: value })} />
            <div className="admin-form-row"><Field label="Syllabus link" value={programDraft.syllabus_url} onChange={(value) => setProgramDraft({ ...programDraft, syllabus_url: value })} /><Field label="Action link" value={programDraft.action_url} onChange={(value) => setProgramDraft({ ...programDraft, action_url: value })} /></div>
            <Field label="Program details link" value={programDraft.program_url} onChange={(value) => setProgramDraft({ ...programDraft, program_url: value })} />
            <div className="admin-form-row"><SelectField label="Catalog status" value={programDraft.status} onChange={(value) => setProgramDraft({ ...programDraft, status: value })} options={['available', 'coming_soon', 'hidden']} /><label className="admin-check"><input type="checkbox" checked={Boolean(programDraft.featured)} onChange={(event) => setProgramDraft({ ...programDraft, featured: event.target.checked })} /> Feature this program</label></div>
            <div className="admin-management-actions"><button className="primary" disabled={saving}>{saving ? 'Saving…' : editingProgramId ? 'Save program' : 'Add program'}</button>{editingProgramId && <button type="button" onClick={() => { setEditingProgramId(''); setProgramDraft(emptyProgram); }}>Cancel</button>}</div>
          </form>
          <section className="admin-management-list"><h2>Catalog programs <b>{programs.length}</b></h2>{programs.map((program) => <article className="admin-item" key={program.id}><div><strong>{program.title}</strong><span className="admin-item-meta">{program.type} · {program.format} · {program.status}</span><p>{program.description}</p><small>{(program.highlights || []).join(' · ')}</small></div><div className="admin-item-actions"><button type="button" onClick={() => editProgram(program)}>Edit</button><button className="danger" type="button" onClick={() => deleteResource(`/admin/programs/${encodeURIComponent(program.id)}`, 'Program and its cohort schedules deleted.')}>Delete</button></div></article>)}</section>
        </section>}

        {tab === 'cohorts' && <section className="admin-management-grid">
          <form className="admin-management-form" onSubmit={submitCohort}>
            <h2>{editingCohortId ? 'Edit cohort schedule' : 'Add a cohort schedule'}</h2>
            <SelectField label="Program" value={cohortDraft.program_id || programs[0]?.id || ''} onChange={(value) => setCohortDraft({ ...cohortDraft, program_id: value })} options={programs.map((program) => ({ value: program.id, label: program.title }))} required />
            <Field label="Schedule title" value={cohortDraft.title} onChange={(value) => setCohortDraft({ ...cohortDraft, title: value })} required />
            <div className="admin-form-row"><Field label="Start date" type="date" value={cohortDraft.start_date} onChange={(value) => setCohortDraft({ ...cohortDraft, start_date: value })} required /><Field label="Days / cadence" value={cohortDraft.schedule} onChange={(value) => setCohortDraft({ ...cohortDraft, schedule: value })} placeholder="Sat & Sun" required /></div>
            <div className="admin-form-row"><Field label="Time (IST)" value={cohortDraft.time_ist} onChange={(value) => setCohortDraft({ ...cohortDraft, time_ist: value })} /><Field label="Time (EST)" value={cohortDraft.time_est} onChange={(value) => setCohortDraft({ ...cohortDraft, time_est: value })} /></div>
            <div className="admin-form-row"><Field label="Instructor(s)" value={cohortDraft.instructor} onChange={(value) => setCohortDraft({ ...cohortDraft, instructor: value })} /><Field label="Instructor role" value={cohortDraft.instructor_role} onChange={(value) => setCohortDraft({ ...cohortDraft, instructor_role: value })} /></div>
            <div className="admin-form-row"><Field label="Total seats" type="number" min="0" value={cohortDraft.seats_total} onChange={(value) => setCohortDraft({ ...cohortDraft, seats_total: value })} required /><Field label="Seats taken" type="number" min="0" value={cohortDraft.seats_taken} onChange={(value) => setCohortDraft({ ...cohortDraft, seats_taken: value })} required /></div>
            <div className="admin-form-row"><SelectField label="Availability" value={cohortDraft.status} onChange={(value) => setCohortDraft({ ...cohortDraft, status: value })} options={['open', 'soon', 'closed']} /><Field label="Booking link" value={cohortDraft.booking_url} onChange={(value) => setCohortDraft({ ...cohortDraft, booking_url: value })} /></div>
            <div className="admin-management-actions"><button className="primary" disabled={saving || !programs.length}>{saving ? 'Saving…' : editingCohortId ? 'Save schedule' : 'Add schedule'}</button>{editingCohortId && <button type="button" onClick={() => { setEditingCohortId(''); setCohortDraft(emptyCohort); }}>Cancel</button>}</div>
          </form>
          <section className="admin-management-list"><h2>Schedules and seats <b>{cohorts.length}</b></h2>{cohorts.map((cohort) => { const program = programs.find((item) => item.id === cohort.program_id); return <article className="admin-item" key={cohort.id}><div><strong>{program?.title || 'Program'} · {cohort.title}</strong><span className="admin-item-meta">{cohort.start_date} · {cohort.schedule} · {cohort.status}</span><p>{cohort.time_ist} {cohort.time_est && ` / ${cohort.time_est}`}</p><small>{cohort.seats_taken} / {cohort.seats_total} seats reserved · {cohort.instructor}</small></div><div className="admin-item-actions"><button type="button" onClick={() => editCohort(cohort)}>Edit</button><button className="danger" type="button" onClick={() => deleteResource(`/admin/cohorts/${encodeURIComponent(cohort.id)}`, 'Cohort schedule deleted.')}>Delete</button></div></article>; })}</section>
        </section>}

        {tab === 'bookings' && <section className="admin-bookings-list"><h2>Bookings <b>{bookings.length}</b></h2>{bookings.length ? <div className="admin-bookings-scroll"><table><thead><tr><th>Member name</th><th>Email</th><th>Preferred time</th><th>Payment</th><th>Status</th><th>Manage</th></tr></thead><tbody>{bookings.map((booking) => <BookingRow booking={booking} onSave={updateBooking} onDelete={() => deleteResource(`/admin/bookings/${encodeURIComponent(booking.id)}`, 'Booking deleted.')} key={booking.id} />)}</tbody></table></div> : <p className="admin-management-empty">No bookings have been submitted yet.</p>}</section>}
      </>}
    </div>
    <footer className="admin-management-footer">© 2026 Adyant Associates</footer>
  </main>;
}

function Field({ label, value, onChange, type = 'text', as = 'input', required = false, disabled = false, min, placeholder, hint }) {
  const Tag = as;
  return <label className="admin-field">{label}<Tag type={as === 'input' ? type : undefined} value={value ?? ''} onChange={(event) => onChange(event.target.value)} required={required} disabled={disabled} min={min} placeholder={placeholder} />{hint && <small>{hint}</small>}</label>;
}

function SelectField({ label, value, onChange, options, required = false }) {
  return <label className="admin-field">{label}<select value={value} onChange={(event) => onChange(event.target.value)} required={required}>{options.map((option) => { const item = typeof option === 'string' ? { value: option, label: option } : option; return <option value={item.value} key={item.value}>{item.label}</option>; })}</select></label>;
}

function BookingRow({ booking, onSave, onDelete }) {
  const [draft, setDraft] = useState({
    name: booking.name || '',
    email: booking.email || '',
    preferred_time: booking.preferred_time || '',
    status: booking.status || 'pending_payment',
  });
  return <tr>
    <td><input aria-label={`Name for ${booking.email}`} value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /><small>Ref: {booking.id}</small></td>
    <td><input aria-label={`Email for ${booking.email}`} type="email" value={draft.email} onChange={(event) => setDraft({ ...draft, email: event.target.value })} /></td>
    <td><input aria-label={`Preferred time for ${booking.email}`} type="datetime-local" value={draft.preferred_time} onChange={(event) => setDraft({ ...draft, preferred_time: event.target.value })} /></td>
    <td>{booking.payment_method || '—'}</td>
    <td><select aria-label={`Status for ${booking.email}`} value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value })}>{bookingStatuses.map((item) => <option key={item} value={item}>{item.replaceAll('_', ' ')}</option>)}</select></td>
    <td><button type="button" onClick={() => onSave(booking, draft)}>Save</button><button className="danger" type="button" onClick={onDelete}>Delete</button></td>
  </tr>;
}

export default AdminVideos;
