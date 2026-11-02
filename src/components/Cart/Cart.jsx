import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { collection, deleteDoc, doc, getDoc, getDocs } from "firebase/firestore";
import { auth, db } from "../firebase.js";
import Layout from "../Layout.jsx";

export default function Cart() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [uid, setUid] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate("/login");
        return;
      }
      setUid(user.uid);
      await loadCart(user.uid);
    });
    return unsubscribe;
  }, [navigate]);

  async function loadCart(userId) {
    const snapshot = await getDocs(collection(db, "users", userId, "cart"));
    const cartItems = [];
    let nextTotal = 0;

    for (const cartDoc of snapshot.docs) {
      const item = cartDoc.data();
      const productDoc = await getDoc(doc(db, "hoodies", item.productId));
      if (!productDoc.exists()) continue;

      const product = productDoc.data();
      const lineTotal = Number(product.price) * Number(item.quantity);
      nextTotal += lineTotal;
      cartItems.push({
        id: cartDoc.id,
        quantity: item.quantity,
        name: product.name,
        lineTotal,
      });
    }

    setItems(cartItems);
    setTotal(nextTotal);
  }

  const removeItem = async (itemId) => {
    if (!uid) return;
    await deleteDoc(doc(db, "users", uid, "cart", itemId));
    await loadCart(uid);
  };

  return (
    <Layout>
      <main className="page">
        <div className="page-header">
          <h1 className="page-heading">Your cart</h1>
        </div>
        <section className="cart-list">
          {items.length === 0 && (
            <div className="empty-state">
              <p>Your cart is empty.</p>
            </div>
          )}
          {items.map((item) => (
            <article className="cart-card" key={item.id}>
              <div>
                <h2>{item.name}</h2>
                <p>Quantity: {item.quantity}</p>
                <p className="price">R{item.lineTotal.toFixed(2)}</p>
              </div>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => removeItem(item.id)}
              >
                Remove
              </button>
            </article>
          ))}
        </section>
        <div className="cart-summary">
          <h2>
            Total: R<span id="cart-total">{total.toFixed(2)}</span>
          </h2>
          <button type="button" id="checkout-button" className="btn btn-primary">
            Checkout
          </button>
        </div>
      </main>
    </Layout>
  );
}
