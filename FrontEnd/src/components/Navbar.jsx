import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FiUser, FiLogOut, FiPlus, FiHome, FiUsers } from 'react-icons/fi';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <FiUsers className="brand-icon" />
          AskMate
        </Link>

        <div className="navbar-menu">
          {user && (
            <>
              <Link to="/" className="navbar-link">
                <FiHome className="icon" />
                Home
              </Link>
              
              <Link to="/create-class" className="navbar-link">
                <FiPlus className="icon" />
                Create Class
              </Link>
              
              <Link to="/join-class" className="navbar-link">
                <FiUsers className="icon" />
                Join Class
              </Link>
            </>
          )}
        </div>

        <div className="navbar-user">
          {user ? (
            <div className="user-menu">
              <Link to="/profile" className="user-link">
                <FiUser className="icon" />
                {user.name}
              </Link>
              <button onClick={handleLogout} className="logout-btn">
                <FiLogOut className="icon" />
                Logout
              </button>
            </div>
          ) : (
            <div className="auth-links">
              <Link to="/login" className="auth-link">Login</Link>
              <Link to="/signup" className="auth-link signup">Sign Up</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
