import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { collection, deleteDoc, doc, getDoc, getDocs } from "firebase/firestore";
import { auth, db } from "../firebase.js";
import Nav from "../Nav.jsx";

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
    <>
      <Nav />
      <main>
        <h1>Your Cart</h1>
        <section id="cart-items">
          {items.length === 0 && <p>Your cart is empty.</p>}
          {items.map((item) => (
            <article key={item.id}>
              <h2>{item.name}</h2>
              <p>Quantity: {item.quantity}</p>
              <p>R{item.lineTotal.toFixed(2)}</p>
              <button type="button" onClick={() => removeItem(item.id)}>
                Remove
              </button>
            </article>
          ))}
        </section>
        <h2>
          Total: R<span id="cart-total">{total.toFixed(2)}</span>
        </h2>
        <button type="button" id="checkout-button">
          Checkout
        </button>
      </main>
    </>
  );
}
