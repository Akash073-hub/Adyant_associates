import './App.css';
import './site-nav.css';
import Home from './home';
import SignIn from './signin';
import ResetCredentials from './reset-credentials';
import Membership from './membership';
import Checkout from './checkout';
import Syllabus from './syllabus';
import Support from './support';
import AccessPortal from './access-portal';
import AdminLogin from './admin-login';

function App() {
  const isHomePage = window.location.pathname === '/home';
  const isStudentAccessPage = window.location.pathname === '/student-login';
  const isAdminLoginPage = window.location.pathname === '/admin-login';
  const isLoginPage = window.location.pathname === '/login';
  const isResetCredentialsPage = window.location.pathname === '/reset-credentials';
  const isMembershipPage = window.location.pathname === '/membership';
  const isCheckoutPage = window.location.pathname === '/checkout';
  const isAiQaSyllabusPage = window.location.pathname === '/syllabus/ai-for-qa-managers';
  const isSupportPage = ['/support', '/privacy'].includes(window.location.pathname);
  if (isStudentAccessPage) return <AccessPortal view="student" />;
  if (isAdminLoginPage) return <AdminLogin />;
  if (isLoginPage) return <SignIn />;
  if (isResetCredentialsPage) return <ResetCredentials />;
  if (isMembershipPage) return <Membership />;
  if (isCheckoutPage) return <Checkout />;
  if (isAiQaSyllabusPage) return <Syllabus />;
  if (isSupportPage) return <Support />;
  if (isHomePage) return <Home />;
  return <AccessPortal />;
}

export default App;
