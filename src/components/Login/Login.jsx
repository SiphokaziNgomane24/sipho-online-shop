import { Link, useNavigate } from "react-router-dom";
import { useSignInWithEmailAndPassword } from "react-firebase-hooks/auth";
import { auth } from "../firebase.js";
import Nav from "../Nav.jsx";

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
    <>
      <Nav />
      <main className="auth-container">
        <h1>Sipho THREADS</h1>
        <h2>Login</h2>
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
          <button type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Login"}
          </button>
          {error && <p>{error.message}</p>}
          {user && <p>Signed in as {user.user.email}</p>}
        </form>
        <p>
          Don&apos;t have an account? <Link to="/signup">Sign Up</Link>
        </p>
      </main>
    </>
  );
}
