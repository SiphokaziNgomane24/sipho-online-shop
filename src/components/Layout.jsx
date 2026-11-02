import Nav from "./Nav.jsx";

export default function Layout({ children }) {
  return (
    <div className="site">
      <Nav />
      {children}
      <footer className="site-footer">Sipho THREADS · Streetwear for everyday style</footer>
    </div>
  );
}
