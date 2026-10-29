import { NavLink, useNavigate } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { signOut } from "firebase/auth";
import { auth } from "./firebase.js";

export default function Nav() {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  return (
    <header className="site-header">
      <NavLink to="/" className="brand">
        Sipho THREADS
      </NavLink>
      <nav className="nav-links">
        <NavLink to="/shop" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
          Shop
        </NavLink>
        <NavLink to="/cart" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
          Cart
        </NavLink>
        {user ? (
          <>
            <span className="nav-user">{user.displayName || user.email}</span>
            <button type="button" className="btn btn-secondary" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <NavLink to="/login" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
            Login
          </NavLink>
        )}
      </nav>
    </header>
  );
}
