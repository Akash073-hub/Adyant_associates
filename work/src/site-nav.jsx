function SiteNav({ active, searchValue, onSearchChange, coursesHref = '#courses', mockHref = '#batches', ctaHref = '/membership#curriculum', ctaLabel = 'Book Your Mock Interview', showCta = active === 'home' || ctaLabel === 'Email support', showLogin = active !== 'support' && active !== 'memberships' }) {
  return (
    <header className="site-header">
      <a className="brand" href="/" aria-label="Adyant Associates home">
        <span className="brand-mark">A</span>
        <span><strong>Adyant Associates</strong></span>
      </a>

      <nav aria-label="Primary navigation">
        <a className={active === 'home' ? 'active' : ''} href="/">Home</a>
        <a className={active === 'courses' ? 'active' : ''} href={coursesHref}>Courses</a>
        <a className={active === 'memberships' ? 'active' : ''} href="/membership">Memberships</a>
        <a className={active === 'mock' ? 'active' : ''} href={mockHref}>Mock Interviews</a>
        <a className={active === 'support' ? 'active' : ''} href="/support">Support</a>
      </nav>

      <div className="header-actions">
        <label className="search-button">
          <span aria-hidden="true">⌕</span>
          <input aria-label="Search programs" onChange={onSearchChange} placeholder="Search programs..." type="search" value={searchValue} />
        </label>
        {showLogin && <a href="/login">Member Login</a>}
        {showCta && <a className="dark-button compact" href={ctaHref}>{ctaLabel}</a>}
      </div>
    </header>
  );
}

export default SiteNav;
