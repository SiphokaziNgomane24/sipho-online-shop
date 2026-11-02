import { Link, useNavigate } from "react-router-dom";
import { useSignInWithEmailAndPassword } from "react-firebase-hooks/auth";
import { auth } from "../firebase.js";
import Layout from "../Layout.jsx";

export default function Login() {
  const [signInWithEmailAndPassword, user, loading, error] =
    useSignInWithEmailAndPassword(auth);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    const email = event.target.email.value;
    const password = event.target.password.value;
    const result = await signInWithEmailAndPassword(email, password);
    if (result?.user) {
      navigate("/shop");
    }
  };

  return (
    <Layout>
      <main className="auth-wrap">
        <section className="auth-card">
          <h1>Sipho THREADS</h1>
          <h2>Welcome back</h2>
          <form onSubmit={handleSubmit}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="Enter your email"
              required
            />
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Enter your password"
              required
            />
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Signing in..." : "Login"}
            </button>
            {error && <p className="error">{error.message}</p>}
            {user && <p>Signed in as {user.user.email}</p>}
          </form>
          <p className="switch">
            Don&apos;t have an account? <Link to="/signup">Sign up</Link>
          </p>
        </section>
      </main>
    </Layout>
  );
}
