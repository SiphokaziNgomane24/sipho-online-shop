import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase.js";
import Layout from "../Layout.jsx";
import { SAMPLE_PRODUCTS } from "../Seed.jsx";
import { normalizeProduct } from "../../utils/productUtils.js";

const DEFAULT_FALLBACK_IMAGE = "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=700&q=80";

export default function Shop() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("All");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadProducts() {
      setLoading(true);
      try {
        const snapshot = await getDocs(collection(db, "hoodies"));
        const items = snapshot.docs.map((d) => normalizeProduct(d));

        if (items.length > 0) {
          setProducts(items);
        } else {
          setProducts(SAMPLE_PRODUCTS.map((p) => normalizeProduct(p, p.id)));
        }
      } catch (err) {
        console.warn("Could not load products from Firebase hoodies collection, falling back:", err);
        setProducts(SAMPLE_PRODUCTS.map((p) => normalizeProduct(p, p.id)));
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, []);

  const counts = {
    All: products.length,
    Hoodies: products.filter((p) => p.category === "Hoodies").length,
    "T-shirts": products.filter((p) => p.category === "T-shirts").length,
    Sneakers: products.filter((p) => p.category === "Sneakers").length,
    Accessories: products.filter((p) => p.category === "Accessories").length,
  };

  const visibleProducts =
    category === "All"
      ? products
      : products.filter((product) => product.category === category);

  const addToCart = async (product) => {
    const user = auth.currentUser;
    if (!user) {
      setMessage("Please log in first to add items to your cart.");
      navigate("/login");
      return;
    }

    try {
      const cartRef = doc(db, "users", user.uid, "cart", product.id);
      const existing = await getDoc(cartRef);
      if (existing.exists()) {
        const currentQty = existing.data().quantity || 1;
        await setDoc(
          cartRef,
          { productId: product.id, quantity: currentQty + 1 },
          { merge: true }
        );
      } else {
        await setDoc(cartRef, { productId: product.id, quantity: 1 });
      }
      setMessage(`Added "${product.name}" to cart!`);
    } catch (err) {
      console.warn("Firestore cart write failed, saving locally:", err);
      try {
        const localKey = `cart_${user.uid}`;
        const stored = JSON.parse(localStorage.getItem(localKey) || "{}");
        stored[product.id] = (stored[product.id] || 0) + 1;
        localStorage.setItem(localKey, JSON.stringify(stored));
        setMessage(`Added "${product.name}" to cart!`);
      } catch {
        setMessage("Unable to add to cart.");
      }
    }
  };

  return (
    <Layout>
      <main className="page">
        <div className="page-header">
          <div>
            <h1 className="page-heading">Shop</h1>
            <p className="notice" style={{ margin: "6px 0 0", color: "var(--muted)", fontSize: "0.95rem" }}>
              Explore the latest street pieces and authentic hoodies from the collection.
            </p>
          </div>
          <div className="shop-toolbar">
            <select
              id="category-filter"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              aria-label="Filter products by category"
            >
              <option value="All">All ({counts.All})</option>
              <option value="Hoodies">Hoodies ({counts.Hoodies})</option>
              <option value="T-shirts">T-shirts ({counts["T-shirts"]})</option>
              <option value="Sneakers">Sneakers ({counts.Sneakers})</option>
              <option value="Accessories">Accessories ({counts.Accessories})</option>
            </select>
          </div>
        </div>

        {message && <p className="notice" role="status">{message}</p>}

        {loading ? (
          <div className="empty-state">
            <p>Loading database products...</p>
          </div>
        ) : (
          <section className="product-grid">
            {visibleProducts.length === 0 && (
              <div className="empty-state">
                <p>No pieces found in the {category} category.</p>
              </div>
            )}
            {visibleProducts.map((product) => (
              <article className="product-card" key={product.id}>
                <div style={{ position: "relative", width: "100%", aspectRatio: "1", overflow: "hidden", background: "var(--surface-hover)" }}>
                  <img
                    src={product.imageURL || DEFAULT_FALLBACK_IMAGE}
                    alt={product.name}
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    onError={(e) => {
                      if (e.currentTarget.src !== DEFAULT_FALLBACK_IMAGE) {
                        e.currentTarget.src = DEFAULT_FALLBACK_IMAGE;
                      }
                    }}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                  {product.category && (
                    <span
                      style={{
                        position: "absolute",
                        top: "10px",
                        left: "10px",
                        background: "rgba(12, 10, 8, 0.85)",
                        color: "var(--gold)",
                        border: "1px solid var(--line)",
                        padding: "3px 9px",
                        borderRadius: "6px",
                        fontSize: "0.72rem",
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        fontWeight: 500,
                      }}
                    >
                      {product.category}
                    </span>
                  )}
                </div>
                <div className="product-card-body">
                  <h2>{product.name}</h2>
                  <p>{product.description || "Everyday streetwear staple."}</p>
                  <p className="price">R{product.price.toFixed(2)}</p>
                </div>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => addToCart(product)}
                >
                  Add to cart
                </button>
              </article>
            ))}
          </section>
        )}
      </main>
    </Layout>
  );
}
