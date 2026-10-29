import { Link } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "./firebase.js";
import Nav from "./Nav.jsx";

export default function Auth() {
  const [user] = useAuthState(auth);

  return (
    <>
      <Nav />
      <main className="auth-container">
        <h1>Account</h1>
        {user ? (
          <p>Signed in as {user.displayName || user.email}</p>
        ) : (
          <p>
            You are not signed in. <Link to="/login">Login</Link> or{" "}
            <Link to="/signup">Sign up</Link>.
          </p>
        )}
      </main>
    </>
  );
}
