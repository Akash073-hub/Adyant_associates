import './App.css';
import './site-nav.css';
import Home from './home';
import SignIn from './signin';
import Membership from './membership';
import Checkout from './checkout';
import Syllabus from './syllabus';
import Support from './support';

function App() {
  const isLoginPage = window.location.pathname === '/login';
  const isMembershipPage = window.location.pathname === '/membership';
  const isCheckoutPage = window.location.pathname === '/checkout';
  const isAiQaSyllabusPage = window.location.pathname === '/syllabus/ai-for-qa-managers';
  const isSupportPage = ['/support', '/privacy'].includes(window.location.pathname);
  if (isLoginPage) return <SignIn />;
  if (isMembershipPage) return <Membership />;
  if (isCheckoutPage) return <Checkout />;
  if (isAiQaSyllabusPage) return <Syllabus />;
  if (isSupportPage) return <Support />;
  return <Home />;
}

export default App;
