import { useEffect, useState } from 'react';
import './student-portal.css';
import { apiRequest } from './api';
import { suppliedClassVideos } from './class-videos';

function StudentClassroom() {
  const [videos, setVideos] = useState(suppliedClassVideos);
  const [selectedVideo, setSelectedVideo] = useState(suppliedClassVideos[0]);

  useEffect(() => {
    apiRequest('/videos')
      .then(({ videos: libraryVideos = [] }) => setVideos([...suppliedClassVideos, ...libraryVideos]))
      .catch(() => setVideos(suppliedClassVideos));
  }, []);

  return <div className="student-shell">
    <aside className="student-sidebar">
      <a className="student-brand" href="/student-portal"><span className="student-brand-mark">A</span><span>Adyant Associates<small>STUDENT PORTAL</small></span></a>
      <div className="student-side-label">LEARNING SPACE</div>
      <nav className="student-side-nav" aria-label="Student portal sections">
        <a href="/student-portal">← Back to learning</a>
        <a className="active" href="/student-classroom">Previous classes</a>
      </nav>
    </aside>
    <main className="student-main">
      <header className="student-topbar"><div className="student-breadcrumb">Student Portal <span>/</span> <b>Previous classes</b></div></header>
      <div className="student-content student-classroom-content">
        <section className="student-welcome"><div><span className="student-kicker">WATCH &amp; LEARN</span><h1>Previous classes</h1></div></section>
        <div className="student-classroom-player"><video controls src={selectedVideo?.url} /></div>
        <div className="student-classroom-grid">
          {videos.map((video) => <button className={`student-classroom-card ${selectedVideo?.id === video.id ? 'selected' : ''}`} key={video.id} type="button" onClick={() => setSelectedVideo(video)}>
            <span className="student-classroom-card-play">▶</span>
            <strong>{video.title}</strong>
            <small>{video.date || 'Class recording'}</small>
          </button>)}
        </div>
      </div>
    </main>
  </div>;
}

export default StudentClassroom;
