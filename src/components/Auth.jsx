import { Link } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "./firebase.js";
import Layout from "./Layout.jsx";

export default function Auth() {
  const [user] = useAuthState(auth);

  return (
    <Layout>
      <main className="auth-wrap">
        <section className="auth-card">
          <h1>Account</h1>
          {user ? (
            <p>Signed in as {user.displayName || user.email}</p>
          ) : (
            <p className="switch">
              You are not signed in. <Link to="/login">Login</Link> or{" "}
              <Link to="/signup">Sign up</Link>.
            </p>
          )}
        </section>
      </main>
    </Layout>
  );
}
