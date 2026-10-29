import { Link, useNavigate } from "react-router-dom";
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
    <nav>
      <Link to="/">Sipho THREADS</Link>
      <Link to="/shop">Shop</Link>
      <Link to="/cart">Cart</Link>
      {user ? (
        <>
          <span>{user.displayName || user.email}</span>
          <button type="button" onClick={handleLogout}>
            Logout
          </button>
        </>
      ) : (
        <Link to="/login">Login</Link>
      )}
    </nav>
  );
}
