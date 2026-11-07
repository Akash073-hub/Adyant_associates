import { useEffect, useState } from 'react';
import './student-portal.css';
import './student-profile.css';
import { apiRequest } from './api';

function StudentProfile() {
  const [profile, setProfile] = useState({ email: '', name: '', has_password: false });
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changePassword, setChangePassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const token = window.localStorage.getItem('adyant_member_token');

  useEffect(() => {
    if (!token) {
      window.location.replace('/login');
      return;
    }
    apiRequest('/auth/profile', { headers: { Authorization: `Bearer ${token}` } })
      .then((result) => setProfile(result))
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, [token]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setNotice('');
    if (newPassword && newPassword !== confirmPassword) {
      setError('The new passwords do not match.');
      return;
    }
    setSaving(true);
    try {
      const result = await apiRequest('/auth/profile', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: profile.name,
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });
      setProfile(result);
      window.localStorage.setItem('adyant_member_name', result.name || '');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setChangePassword(false);
      setNotice('Your profile has been updated.');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  const initials = (profile.name || profile.email.split('@')[0] || 'Student').slice(0, 2).toUpperCase();

  return <div className="student-shell">
    <aside className="student-sidebar">
      <a className="student-brand" href="/student-portal"><span className="student-brand-mark">A</span><span>Adyant Associates<small>STUDENT PORTAL</small></span></a>
      <div className="student-side-label">ACCOUNT</div>
      <nav className="student-side-nav" aria-label="Account navigation">
        <a href="/student-portal">← Back to learning</a>
        <a className="active" href="/student-profile">Edit profile</a>
      </nav>
      <div className="student-sidebar-bottom"><span className="student-help-icon">?</span><div><strong>Need a hand?</strong><small>Our team is here to help.</small></div><a href="/support" aria-label="Contact support">→</a></div>
    </aside>

    <main className="student-main">
      <header className="student-topbar"><div className="student-breadcrumb">Student Portal <span>/</span> <b>Profile</b></div><div className="student-top-actions"><span className="student-avatar" aria-label="Profile">{initials}</span></div></header>
      <div className="student-content student-profile-content">
        <section className="student-welcome"><div><span className="student-kicker">ACCOUNT SETTINGS</span><h1>Edit profile</h1><p>Update the name and password for your member login.</p></div></section>

        {error && <div className="student-notice" role="alert">{error}</div>}
        {notice && <div className="student-profile-success" role="status">{notice}</div>}

        <div className="student-profile-grid">
          <section className="student-profile-card">
            <div className="student-section-heading compact"><div><span className="student-kicker">MEMBER DETAILS</span><h2>Login profile</h2></div></div>
            {loading ? <p className="student-loading">Loading profile…</p> : <form className="student-profile-form" onSubmit={handleSubmit}>
              <label htmlFor="profile-name">Name</label>
              <input id="profile-name" type="text" maxLength="120" value={profile.name} onChange={(event) => setProfile((current) => ({ ...current, name: event.target.value }))} placeholder="Your name" />
              <div className="student-profile-divider" />
              <div className="student-password-heading"><h3>{profile.has_password ? 'Password' : 'Set a password'}</h3><button type="button" className="student-password-toggle" onClick={() => setChangePassword((current) => !current)}>{changePassword ? 'Cancel' : profile.has_password ? 'Change password' : 'Set password'}</button></div>
              {changePassword && <><p className="student-profile-hint">Only enter these fields if you want to change your password.</p>{profile.has_password && <><label htmlFor="current-password">Current password</label><input id="current-password" type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} /></>}<label htmlFor="new-password">{profile.has_password ? 'New password' : 'Password'}</label><input id="new-password" type="password" autoComplete="new-password" minLength="8" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="At least 8 characters" /><label htmlFor="confirm-password">Confirm new password</label><input id="confirm-password" type="password" autoComplete="new-password" minLength="8" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Enter the password again" /></>}
              <button className="student-profile-save" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
            </form>}
          </section>

          <section className="student-profile-card student-wallet-card">
            <div className="student-section-heading compact"><div><span className="student-kicker">WALLET</span><h2>Your wallet</h2></div><span className="student-card-icon">₹</span></div>
            <div className="student-wallet-balance"><small>AVAILABLE BALANCE</small><strong>₹0.00</strong><span>INR</span></div>
            <div className="student-wallet-empty"><span>◷</span><strong>No wallet transactions yet</strong><p>Your wallet balance is empty. Wallet activity will appear here when transactions are available.</p></div>
          </section>
        </div>
        <footer className="student-footer"><span>© 2026 Adyant Associates</span><div><a href="/support">Help &amp; support</a><a href="/privacy">Privacy</a></div></footer>
      </div>
    </main>
  </div>;
}

export default StudentProfile;
