import { Link } from "react-router-dom";
import Layout from "./Layout.jsx";

function App() {
  return (
    <Layout>
      <section className="hero">
        <div className="hero-panel">
          <p className="eyebrow">Your style, your personality</p>
          <h1>Sipho THREADS</h1>
          <p>Welcome to a shop for nothing but fashion. Streetwear made for everyday style.</p>
          <div className="hero-actions">
            <Link to="/shop" className="btn btn-primary">
              Shop now
            </Link>
            <Link to="/signup" className="btn btn-secondary">
              Sign up
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}

export default App;
