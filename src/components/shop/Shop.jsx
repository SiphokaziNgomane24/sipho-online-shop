import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase.js";
import Nav from "../Nav.jsx";

export default function Shop() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState("All");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadProducts() {
      const snapshot = await getDocs(collection(db, "hoodies"));
      setProducts(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    }
    loadProducts();
  }, []);

  const visibleProducts =
    category === "All"
      ? products
      : products.filter((product) => product.category === category);

  const addToCart = async (productId) => {
    const user = auth.currentUser;
    if (!user) {
      setMessage("Please log in first.");
      navigate("/login");
      return;
    }

    const cartRef = doc(db, "users", user.uid, "cart", productId);
    const existing = await getDoc(cartRef);
    if (existing.exists()) {
      await setDoc(
        cartRef,
        { quantity: existing.data().quantity + 1 },
        { merge: true }
      );
    } else {
      await setDoc(cartRef, { productId, quantity: 1 });
    }
    setMessage("Added to cart!");
  };

  return (
    <>
      <Nav />
      <main>
        <h1>Shop</h1>
        <select
          id="category-filter"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
        >
          <option value="All">All</option>
          <option value="Hoodies">Hoodies</option>
          <option value="T-shirts">T-shirts</option>
          <option value="Sneakers">Sneakers</option>
          <option value="Accessories">Accessories</option>
        </select>
        {message && <p>{message}</p>}
        <section id="product-grid">
          {visibleProducts.map((product) => (
            <article className="product-card" key={product.id}>
              {product.imageURL && (
                <img src={product.imageURL} alt={product.name} />
              )}
              <h2>{product.name}</h2>
              <p>{product.description}</p>
              <p>R{Number(product.price).toFixed(2)}</p>
              <button type="button" onClick={() => addToCart(product.id)}>
                Add to Cart
              </button>
            </article>
          ))}
        </section>
      </main>
    </>
  );
}
