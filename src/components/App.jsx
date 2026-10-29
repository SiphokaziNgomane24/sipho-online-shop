import "./style.css";
import { Link } from "react-router-dom";
import Nav from "./Nav.jsx";

function App() {
  return (
    <>
      <Nav />
      <div className="hero">
        <h1>Sipho THREADS SHOP</h1>
        <p className="tagline">YOUR STYLE, YOUR PERSONALITY</p>
        <p>WELCOME TO OUR SHOP FOR NOTHING BUT FASHION!</p>
        <Link to="/shop">
          <button type="button">Shop Now</button>
        </Link>
        <Link to="/signup">
          <button type="button">Sign Up Now</button>
        </Link>
      </div>
    </>
  );
}

export default App;
