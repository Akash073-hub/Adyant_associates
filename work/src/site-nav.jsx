import { useState } from 'react';
import { navigateToSearch } from './search-navigation';

function SiteNav({ active, searchValue, onSearchChange, onSearchSubmit, coursesHref = '#courses', mockHref = '#batches', ctaHref = '/membership#curriculum', ctaLabel = 'Book Your Mock Interview', showCta = active === 'home' || ctaLabel === 'Email support', showLogin = active !== 'support' && active !== 'memberships' }) {
  const [internalSearch, setInternalSearch] = useState('');
  const currentSearch = searchValue ?? internalSearch;

  function handleSearchChange(event) {
    setInternalSearch(event.target.value);
    onSearchChange?.(event);
  }

  function handleSearchSubmit(event) {
    event.preventDefault();
    const submit = onSearchSubmit || navigateToSearch;
    submit(currentSearch);
  }

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
        <form className="search-button" onSubmit={handleSearchSubmit}>
          <button aria-label="Submit search" className="search-submit" type="submit">⌕</button>
          <input aria-label="Search programs" onChange={handleSearchChange} placeholder="Search programs..." type="search" value={currentSearch} />
        </form>
        {showLogin && <a href="/login">Member Login</a>}
        {showCta && <a className="dark-button compact" href={ctaHref}>{ctaLabel}</a>}
      </div>
    </header>
  );
}

export default SiteNav;
