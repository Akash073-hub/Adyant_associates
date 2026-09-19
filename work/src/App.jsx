import './App.css';
import Home from './home';
import SignIn from './signin';
import Membership from './membership';
import Checkout from './checkout';

function App() {
  const isLoginPage = window.location.pathname === '/login';
  const isMembershipPage = window.location.pathname === '/membership';
  const isCheckoutPage = window.location.pathname === '/checkout';
  const navigate = (path) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  if (isLoginPage) return <SignIn onNavigate={navigate} />;
  if (isMembershipPage) return <Membership />;
  if (isCheckoutPage) return <Checkout />;
  return <Home />;
}

export default App;
