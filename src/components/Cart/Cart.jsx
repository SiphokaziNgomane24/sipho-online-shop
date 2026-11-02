import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { collection, deleteDoc, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase.js";
import Layout from "../Layout.jsx";
import { SAMPLE_PRODUCTS } from "../Seed.jsx";
import { normalizeProduct } from "../../utils/productUtils.js";

const DEFAULT_FALLBACK_IMAGE = "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=700&q=80";

export default function Cart() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [uid, setUid] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadCart(userId) {
    const cartItems = [];
    let nextTotal = 0;

    try {
      const snapshot = await getDocs(collection(db, "users", userId, "cart"));
      for (const cartDoc of snapshot.docs) {
        const item = cartDoc.data();
        let product = null;
        try {
          const productDoc = await getDoc(doc(db, "hoodies", item.productId));
          if (productDoc.exists()) {
            product = normalizeProduct(productDoc);
          }
        } catch {
          // ignore error
        }
        if (!product) {
          const sample = SAMPLE_PRODUCTS.find((p) => p.id === item.productId);
          if (sample) {
            product = normalizeProduct(sample, sample.id);
          }
        }
        if (!product) continue;

        const quantity = Number(item.quantity) || 1;
        const lineTotal = Number(product.price) * quantity;
        nextTotal += lineTotal;
        cartItems.push({
          id: cartDoc.id,
          productId: item.productId,
          quantity,
          name: product.name,
          price: product.price,
          imageURL: product.imageURL,
          lineTotal,
        });
      }
    } catch (err) {
      console.warn("Could not load cart from Firestore:", err);
    }

    // Merge any locally saved cart items
    try {
      const localKey = `cart_${userId}`;
      const stored = JSON.parse(localStorage.getItem(localKey) || "{}");
      for (const [prodId, qty] of Object.entries(stored)) {
        if (!cartItems.some((ci) => ci.productId === prodId || ci.id === prodId)) {
          let product = null;
          try {
            const productDoc = await getDoc(doc(db, "hoodies", prodId));
            if (productDoc.exists()) {
              product = normalizeProduct(productDoc);
            }
          } catch {
            // ignore
          }
          if (!product) {
            const sample = SAMPLE_PRODUCTS.find((p) => p.id === prodId);
            if (sample) product = normalizeProduct(sample, sample.id);
          }
          if (product) {
            const lineTotal = Number(product.price) * Number(qty);
            nextTotal += lineTotal;
            cartItems.push({
              id: prodId,
              productId: prodId,
              quantity: Number(qty),
              name: product.name,
              price: product.price,
              imageURL: product.imageURL,
              lineTotal,
            });
          }
        }
      }
    } catch {
      // ignore
    }

    setItems(cartItems);
    setTotal(nextTotal);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate("/login");
        return;
      }
      setUid(user.uid);
      await loadCart(user.uid);
      setLoading(false);
    });
    return unsubscribe;
  }, [navigate]);

  const updateQuantity = async (item, delta) => {
    if (!uid) return;
    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      await removeItem(item.id);
      return;
    }

    try {
      const cartRef = doc(db, "users", uid, "cart", item.id);
      await setDoc(cartRef, { quantity: newQty }, { merge: true });
    } catch (err) {
      console.warn("Could not update quantity in Firestore:", err);
    }

    try {
      const localKey = `cart_${uid}`;
      const stored = JSON.parse(localStorage.getItem(localKey) || "{}");
      stored[item.productId || item.id] = newQty;
      localStorage.setItem(localKey, JSON.stringify(stored));
    } catch {
      // ignore
    }

    await loadCart(uid);
  };

  const removeItem = async (itemId) => {
    if (!uid) return;
    try {
      await deleteDoc(doc(db, "users", uid, "cart", itemId));
    } catch (err) {
      console.warn("Could not remove item from Firestore:", err);
    }
    try {
      const localKey = `cart_${uid}`;
      const stored = JSON.parse(localStorage.getItem(localKey) || "{}");
      delete stored[itemId];
      localStorage.setItem(localKey, JSON.stringify(stored));
    } catch {
      // ignore
    }
    await loadCart(uid);
  };

  return (
    <Layout>
      <main className="page">
        <div className="page-header">
          <div>
            <h1 className="page-heading">Your Cart</h1>
            <p className="notice" style={{ margin: "6px 0 0", color: "var(--muted)", fontSize: "0.95rem" }}>
              Review your selected pieces and proceed to checkout.
            </p>
          </div>
          <Link to="/shop" className="btn btn-secondary">
            Continue shopping
          </Link>
        </div>

        {loading ? (
          <div className="empty-state">
            <p>Loading your cart...</p>
          </div>
        ) : (
          <>
            <section className="cart-list">
              {items.length === 0 && (
                <div className="empty-state">
                  <p>Your cart is empty.</p>
                  <Link to="/shop" className="btn btn-primary" style={{ marginTop: "16px" }}>
                    Browse Collection
                  </Link>
                </div>
              )}
              {items.map((item) => (
                <article className="cart-card" key={item.id}>
                  <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
                    <img
                      src={item.imageURL || DEFAULT_FALLBACK_IMAGE}
                      alt={item.name}
                      className="cart-item-thumb"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        if (e.currentTarget.src !== DEFAULT_FALLBACK_IMAGE) {
                          e.currentTarget.src = DEFAULT_FALLBACK_IMAGE;
                        }
                      }}
                    />
                    <div>
                      <h2>{item.name}</h2>
                      <p className="price" style={{ margin: "4px 0" }}>
                        R{Number(item.price || 0).toFixed(2)} each
                      </p>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "8px" }}>
                        <span style={{ fontSize: "0.85rem", color: "var(--muted)" }}>Qty:</span>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ minHeight: "28px", padding: "0 10px", fontSize: "0.8rem" }}
                          onClick={() => updateQuantity(item, -1)}
                          aria-label="Decrease quantity"
                        >
                          -
                        </button>
                        <span style={{ fontWeight: 600, minWidth: "20px", textAlign: "center" }}>
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ minHeight: "28px", padding: "0 10px", fontSize: "0.8rem" }}
                          onClick={() => updateQuantity(item, 1)}
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p className="price" style={{ fontSize: "1.25rem", margin: "0 0 10px" }}>
                      R{item.lineTotal.toFixed(2)}
                    </p>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => removeItem(item.id)}
                    >
                      Remove
                    </button>
                  </div>
                </article>
              ))}
            </section>

            {items.length > 0 && (
              <div className="cart-summary">
                <div>
                  <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.9rem" }}>
                    {items.reduce((acc, curr) => acc + curr.quantity, 0)} items in total
                  </p>
                  <h2>
                    Total: R<span id="cart-total">{total.toFixed(2)}</span>
                  </h2>
                </div>
                <button
                  type="button"
                  id="checkout-button"
                  className="btn btn-primary"
                  onClick={() => navigate("/checkout")}
                  style={{ minWidth: "200px" }}
                >
                  Proceed to Checkout →
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </Layout>
  );
}
