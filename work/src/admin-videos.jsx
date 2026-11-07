import { useCallback, useEffect, useState } from 'react';
import './access-portal.css';
import './signin.css';
import { apiRequest } from './api';

function AdminVideos() {
  const [videos, setVideos] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const token = sessionStorage.getItem('adminToken');

  const loadVideos = useCallback(async () => {
    if (!token) {
      window.location.replace('/admin-login');
      return;
    }
    try {
      const result = await apiRequest('/admin/videos', { headers: { Authorization: `Bearer ${token}` } });
      setVideos(result.videos);
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
  }, [token]);

  useEffect(() => { loadVideos(); }, [loadVideos]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setNotice('');
    setSaving(true);
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      const result = await apiRequest('/admin/videos', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: form.get('title'),
          url: form.get('url'),
          description: form.get('description'),
        }),
      });
      setVideos((current) => [...current, result.video]);
      formElement.reset();
      setNotice('Video saved. It is now listed on the Memberships page.');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  function signOut() {
    sessionStorage.removeItem('adminToken');
    window.location.href = '/';
  }

  return (
    <main className="access-page">
      <section className="access-card admin-card admin-videos-card">
        <div className="admin-videos-top"><a className="access-brand" href="/admin"><span className="access-brand-mark">A</span> Adyant Associates</a><button className="admin-signout" onClick={signOut} type="button">Sign out</button></div>
        <span className="access-eyebrow">ADMINISTRATION / MEMBERSHIP CONTENT</span>
        <h1>Trial video library</h1>
        <p>Add a video to the list shown in the Memberships page preview.</p>
        <form className="signin-form" onSubmit={handleSubmit}>
          <label className="admin-label" htmlFor="video-title">Video title</label>
          <input className="admin-input" id="video-title" name="title" type="text" maxLength="120" required />
          <label className="admin-label" htmlFor="video-url">Video URL</label>
          <input className="admin-input" id="video-url" name="url" type="url" placeholder="https://…" required />
          <label className="admin-label" htmlFor="video-description">Class notes (optional)</label>
          <textarea className="admin-input admin-textarea" id="video-description" name="description" rows="3" maxLength="500" placeholder="Add notes to show with this class recording" />
          <button className="authenticate-button" type="submit" disabled={saving}>{saving ? 'Saving video…' : 'Add video to library →'}</button>
          {error && <p className="field-help" role="alert">{error}</p>}
          {notice && <p className="field-help" role="status">{notice}</p>}
        </form>
        <div className="admin-video-list">
          <h2>Saved videos <span>{videos.length}</span></h2>
          {loading ? <p>Loading saved videos…</p> : videos.length ? videos.map((video) => (
            <article key={video.id}><strong>{video.title}</strong><a href={video.url} target="_blank" rel="noreferrer">Open video ↗</a>{video.description && <p>{video.description}</p>}</article>
          )) : <p>No videos added yet. The built-in Trial Video preview remains available to visitors.</p>}
        </div>
      </section>
      <footer className="access-footer">© 2026 Adyant Associates</footer>
    </main>
  );
}

export default AdminVideos;
