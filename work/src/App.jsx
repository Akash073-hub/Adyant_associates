import './App.css';
import './site-nav.css';
import { useEffect } from 'react';
import { recordVisit } from './api';
import Home from './home';
import SignIn from './signin';
import ResetCredentials from './reset-credentials';
import Membership from './membership';
import Checkout from './checkout';
import Syllabus from './syllabus';
import Support from './support';

function App() {
  useEffect(() => {
    recordVisit(window.location.pathname).catch((error) => {
      console.error('Unable to record page visit.', error);
    });
  }, []);

  const isLoginPage = window.location.pathname === '/login';
  const isResetCredentialsPage = window.location.pathname === '/reset-credentials';
  const isMembershipPage = window.location.pathname === '/membership';
  const isCheckoutPage = window.location.pathname === '/checkout';
  const isAiQaSyllabusPage = window.location.pathname === '/syllabus/ai-for-qa-managers';
  const isSupportPage = ['/support', '/privacy'].includes(window.location.pathname);
  if (isLoginPage) return <SignIn />;
  if (isResetCredentialsPage) return <ResetCredentials />;
  if (isMembershipPage) return <Membership />;
  if (isCheckoutPage) return <Checkout />;
  if (isAiQaSyllabusPage) return <Syllabus />;
  if (isSupportPage) return <Support />;
  return <Home />;
}

export default App;
