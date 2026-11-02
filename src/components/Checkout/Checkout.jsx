import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs } from "firebase/firestore";
import { auth, db } from "../firebase.js";
import Layout from "../Layout.jsx";
import { SAMPLE_PRODUCTS } from "../Seed.jsx";
import { normalizeProduct } from "../../utils/productUtils.js";

const DEFAULT_FALLBACK_IMAGE = "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=700&q=80";

export default function Checkout() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  const [subtotal, setSubtotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderSummary, setOrderSummary] = useState(null);
  const [error, setError] = useState("");

  // Form State
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    streetAddress: "",
    city: "Johannesburg",
    province: "Gauteng",
    postalCode: "",
    deliveryNotes: "",
    paymentMethod: "card",
    cardNumber: "",
    cardExpiry: "",
    cardCvv: "",
  });

  const deliveryFee = subtotal >= 1000 || subtotal === 0 ? 0 : 100;
  const grandTotal = subtotal + deliveryFee;

  async function loadCart(userId) {
    const cartItems = [];
    let nextSubtotal = 0;

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
          // ignore
        }
        if (!product) {
          const sample = SAMPLE_PRODUCTS.find((p) => p.id === item.productId);
          if (sample) product = normalizeProduct(sample, sample.id);
        }
        if (!product) continue;

        const quantity = Number(item.quantity) || 1;
        const lineTotal = Number(product.price) * quantity;
        nextSubtotal += lineTotal;
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
            if (productDoc.exists()) product = normalizeProduct(productDoc);
          } catch {
            // ignore
          }
          if (!product) {
            const sample = SAMPLE_PRODUCTS.find((p) => p.id === prodId);
            if (sample) product = normalizeProduct(sample, sample.id);
          }
          if (product) {
            const lineTotal = Number(product.price) * Number(qty);
            nextSubtotal += lineTotal;
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
    setSubtotal(nextSubtotal);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        navigate("/login");
        return;
      }
      setUser(currentUser);
      setFormData((prev) => ({
        ...prev,
        fullName: prev.fullName || currentUser.displayName || "",
        email: prev.email || currentUser.email || "",
      }));
      await loadCart(currentUser.uid);
      setLoading(false);
    });
    return unsubscribe;
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!user) return;
    setError("");

    if (items.length === 0) {
      setError("Your cart is empty. Please add items before checking out.");
      return;
    }

    if (!formData.fullName || !formData.phone || !formData.streetAddress || !formData.city || !formData.postalCode) {
      setError("Please fill in all required shipping address fields.");
      return;
    }

    if (formData.paymentMethod === "card") {
      if (!formData.cardNumber || !formData.cardExpiry || !formData.cardCvv) {
        setError("Please enter complete card payment details.");
        return;
      }
    }

    setSubmitting(true);
    const orderNumber = `ST-${Date.now().toString().slice(-6)}`;
    const orderData = {
      orderNumber,
      userId: user.uid,
      userEmail: user.email || formData.email,
      customerName: formData.fullName,
      phone: formData.phone,
      shippingAddress: {
        street: formData.streetAddress,
        city: formData.city,
        province: formData.province,
        postalCode: formData.postalCode,
        notes: formData.deliveryNotes,
      },
      items: items.map((i) => ({
        id: i.id,
        productId: i.productId || i.id,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
        lineTotal: i.lineTotal,
        imageURL: i.imageURL || "",
      })),
      subtotal,
      deliveryFee,
      grandTotal,
      paymentMethod: formData.paymentMethod,
      paymentStatus: formData.paymentMethod === "cod" ? "Pending (Cash On Delivery)" : "Paid",
      orderStatus: "Processing",
      createdAt: new Date().toISOString(),
    };

    try {
      // Save order in Firestore
      try {
        await addDoc(collection(db, "orders"), orderData);
      } catch (err) {
        console.warn("Could not save to global orders collection:", err);
      }
      try {
        await addDoc(collection(db, "users", user.uid, "orders"), orderData);
      } catch (err) {
        console.warn("Could not save to user orders subcollection:", err);
      }

      // Also store order in localStorage
      try {
        const localOrdersKey = `orders_${user.uid}`;
        const existing = JSON.parse(localStorage.getItem(localOrdersKey) || "[]");
        existing.unshift(orderData);
        localStorage.setItem(localOrdersKey, JSON.stringify(existing));
      } catch {
        // ignore
      }

      // Clear the user's cart in Firestore
      try {
        const cartSnapshot = await getDocs(collection(db, "users", user.uid, "cart"));
        for (const docItem of cartSnapshot.docs) {
          await deleteDoc(doc(db, "users", user.uid, "cart", docItem.id));
        }
      } catch (err) {
        console.warn("Could not delete items from Firestore cart:", err);
      }

      // Clear local cart
      try {
        localStorage.removeItem(`cart_${user.uid}`);
      } catch {
        // ignore
      }

      setOrderSummary(orderData);
      setOrderComplete(true);
    } catch (err) {
      console.error("Order processing error:", err);
      setError("An error occurred while placing your order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <main className="page">
          <div className="empty-state">
            <p>Loading checkout details...</p>
          </div>
        </main>
      </Layout>
    );
  }

  if (orderComplete && orderSummary) {
    return (
      <Layout>
        <main className="page">
          <div className="order-success-card">
            <div className="order-success-icon">✓</div>
            <span className="order-badge">Order Confirmed</span>
            <h1 style={{ fontFamily: "var(--serif)", fontSize: "2.4rem", margin: "0 0 10px" }}>
              Thank You for Your Order!
            </h1>
            <p style={{ color: "var(--muted)", margin: "0 0 24px", fontSize: "1.05rem" }}>
              We've received your order <strong>#{orderSummary.orderNumber}</strong>. A confirmation has been recorded for your account.
            </p>

            <div
              style={{
                background: "var(--surface-alt)",
                border: "1px solid var(--line)",
                borderRadius: "16px",
                padding: "20px 24px",
                textAlign: "left",
                marginBottom: "28px",
              }}
            >
              <h3 style={{ margin: "0 0 12px", fontFamily: "var(--serif)", fontSize: "1.25rem" }}>
                Delivery Summary
              </h3>
              <p style={{ margin: "4px 0", fontSize: "0.95rem" }}>
                <strong>Recipient:</strong> {orderSummary.customerName} ({orderSummary.phone})
              </p>
              <p style={{ margin: "4px 0", fontSize: "0.95rem" }}>
                <strong>Address:</strong> {orderSummary.shippingAddress.street}, {orderSummary.shippingAddress.city},{" "}
                {orderSummary.shippingAddress.province} {orderSummary.shippingAddress.postalCode}
              </p>
              <p style={{ margin: "4px 0", fontSize: "0.95rem" }}>
                <strong>Payment:</strong> {orderSummary.paymentStatus} via{" "}
                {orderSummary.paymentMethod === "card"
                  ? "Card"
                  : orderSummary.paymentMethod === "eft"
                  ? "Instant EFT"
                  : "Cash on Delivery"}
              </p>
              <p style={{ margin: "4px 0", fontSize: "0.95rem" }}>
                <strong>Estimated Arrival:</strong> 2 - 4 business days
              </p>

              <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px solid var(--line)" }}>
                <p style={{ margin: 0, fontWeight: 600, fontSize: "1.1rem" }}>
                  Total Paid: R{orderSummary.grandTotal.toFixed(2)}
                </p>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "center", gap: "16px", flexWrap: "wrap" }}>
              <Link to="/shop" className="btn btn-primary">
                Continue Shopping
              </Link>
              <Link to="/" className="btn btn-secondary">
                Return to Home
              </Link>
            </div>
          </div>
        </main>
      </Layout>
    );
  }

  return (
    <Layout>
      <main className="page">
        <div className="page-header">
          <div>
            <h1 className="page-heading">Checkout</h1>
            <p className="notice" style={{ margin: "6px 0 0", color: "var(--muted)", fontSize: "0.95rem" }}>
              Provide your delivery and payment details to complete your order.
            </p>
          </div>
          <Link to="/cart" className="btn btn-secondary">
            ← Back to Cart
          </Link>
        </div>

        {error && <p className="notice" style={{ color: "var(--accent)", fontWeight: 500 }}>{error}</p>}

        {items.length === 0 ? (
          <div className="empty-state">
            <p>Your cart is empty. There are no items to checkout.</p>
            <Link to="/shop" className="btn btn-primary" style={{ marginTop: "16px" }}>
              Return to Shop
            </Link>
          </div>
        ) : (
          <form onSubmit={handlePlaceOrder} className="checkout-grid">
            {/* Left Column: Delivery & Payment Details */}
            <div className="checkout-left">
              {/* Shipping Address */}
              <section className="checkout-section">
                <h2>1. Delivery Address</h2>
                <div className="checkout-form">
                  <div className="form-row">
                    <div>
                      <label htmlFor="fullName">Full Name *</label>
                      <input
                        id="fullName"
                        name="fullName"
                        type="text"
                        required
                        value={formData.fullName}
                        onChange={handleInputChange}
                        placeholder="e.g. Sipho Nkosi"
                      />
                    </div>
                    <div>
                      <label htmlFor="phone">Phone Number *</label>
                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="e.g. 082 123 4567"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="email">Email Address *</label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="e.g. sipho@example.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="streetAddress">Street Address *</label>
                    <input
                      id="streetAddress"
                      name="streetAddress"
                      type="text"
                      required
                      value={formData.streetAddress}
                      onChange={handleInputChange}
                      placeholder="Street address, building, apartment or unit"
                    />
                  </div>

                  <div className="form-row">
                    <div>
                      <label htmlFor="city">City / Town *</label>
                      <input
                        id="city"
                        name="city"
                        type="text"
                        required
                        value={formData.city}
                        onChange={handleInputChange}
                        placeholder="e.g. Johannesburg"
                      />
                    </div>
                    <div>
                      <label htmlFor="province">Province *</label>
                      <select
                        id="province"
                        name="province"
                        value={formData.province}
                        onChange={handleInputChange}
                      >
                        <option value="Gauteng">Gauteng</option>
                        <option value="Western Cape">Western Cape</option>
                        <option value="KwaZulu-Natal">KwaZulu-Natal</option>
                        <option value="Eastern Cape">Eastern Cape</option>
                        <option value="Free State">Free State</option>
                        <option value="Mpumalanga">Mpumalanga</option>
                        <option value="Limpopo">Limpopo</option>
                        <option value="North West">North West</option>
                        <option value="Northern Cape">Northern Cape</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="postalCode">Postal Code *</label>
                    <input
                      id="postalCode"
                      name="postalCode"
                      type="text"
                      required
                      value={formData.postalCode}
                      onChange={handleInputChange}
                      placeholder="e.g. 2000"
                    />
                  </div>

                  <div>
                    <label htmlFor="deliveryNotes">Delivery Instructions (Optional)</label>
                    <textarea
                      id="deliveryNotes"
                      name="deliveryNotes"
                      rows={2}
                      value={formData.deliveryNotes}
                      onChange={handleInputChange}
                      placeholder="Gate code, landmark, or delivery preferences"
                    />
                  </div>
                </div>
              </section>

              {/* Payment Method */}
              <section className="checkout-section">
                <h2>2. Payment Method</h2>
                <div className="payment-options">
                  <label className={`payment-radio ${formData.paymentMethod === "card" ? "selected" : ""}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      checked={formData.paymentMethod === "card"}
                      onChange={handleInputChange}
                    />
                    <div>
                      <strong>Credit / Debit Card</strong>
                      <p style={{ margin: "2px 0 0", fontSize: "0.82rem", color: "var(--muted)" }}>
                        Visa, Mastercard, American Express (Encrypted & Secure)
                      </p>
                    </div>
                  </label>

                  {formData.paymentMethod === "card" && (
                    <div
                      style={{
                        padding: "16px",
                        background: "var(--surface-alt)",
                        border: "1px solid var(--line)",
                        borderRadius: "12px",
                        margin: "4px 0 12px",
                      }}
                      className="checkout-form"
                    >
                      <div>
                        <label htmlFor="cardNumber">Card Number</label>
                        <input
                          id="cardNumber"
                          name="cardNumber"
                          type="text"
                          maxLength={19}
                          placeholder="4111 2222 3333 4444"
                          value={formData.cardNumber}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="form-row">
                        <div>
                          <label htmlFor="cardExpiry">Expiry Date</label>
                          <input
                            id="cardExpiry"
                            name="cardExpiry"
                            type="text"
                            maxLength={5}
                            placeholder="MM/YY"
                            value={formData.cardExpiry}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div>
                          <label htmlFor="cardCvv">CVV</label>
                          <input
                            id="cardCvv"
                            name="cardCvv"
                            type="password"
                            maxLength={4}
                            placeholder="123"
                            value={formData.cardCvv}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <label className={`payment-radio ${formData.paymentMethod === "eft" ? "selected" : ""}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="eft"
                      checked={formData.paymentMethod === "eft"}
                      onChange={handleInputChange}
                    />
                    <div>
                      <strong>Instant EFT / Capitec Pay / Ozow</strong>
                      <p style={{ margin: "2px 0 0", fontSize: "0.82rem", color: "var(--muted)" }}>
                        Immediate bank transfer via South African banks
                      </p>
                    </div>
                  </label>

                  <label className={`payment-radio ${formData.paymentMethod === "cod" ? "selected" : ""}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cod"
                      checked={formData.paymentMethod === "cod"}
                      onChange={handleInputChange}
                    />
                    <div>
                      <strong>Cash on Delivery (COD)</strong>
                      <p style={{ margin: "2px 0 0", fontSize: "0.82rem", color: "var(--muted)" }}>
                        Pay cash or card tap upon courier delivery to your doorstep
                      </p>
                    </div>
                  </label>
                </div>
              </section>
            </div>

            {/* Right Column: Order Summary */}
            <aside className="order-summary-card">
              <h2>Order Summary</h2>
              <div className="summary-items">
                {items.map((item) => (
                  <div className="summary-item" key={item.id}>
                    <img
                      src={item.imageURL || DEFAULT_FALLBACK_IMAGE}
                      alt={item.name}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        if (e.currentTarget.src !== DEFAULT_FALLBACK_IMAGE) {
                          e.currentTarget.src = DEFAULT_FALLBACK_IMAGE;
                        }
                      }}
                    />
                    <div className="summary-item-info">
                      <h4>{item.name}</h4>
                      <p>Qty: {item.quantity} · R{Number(item.price || 0).toFixed(2)}</p>
                    </div>
                    <span style={{ fontWeight: 600, fontSize: "0.95rem" }}>
                      R{item.lineTotal.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="summary-totals">
                <div className="summary-row">
                  <span>Subtotal</span>
                  <span>R{subtotal.toFixed(2)}</span>
                </div>
                <div className="summary-row">
                  <span>Standard Delivery</span>
                  <span>
                    {deliveryFee === 0 ? (
                      <span style={{ color: "var(--gold)", fontWeight: 600 }}>FREE</span>
                    ) : (
                      `R${deliveryFee.toFixed(2)}`
                    )}
                  </span>
                </div>
                {deliveryFee > 0 && (
                  <p style={{ margin: "0", fontSize: "0.8rem", color: "var(--muted)" }}>
                    Add R{(1000 - subtotal).toFixed(2)} more for free courier delivery!
                  </p>
                )}
                <div className="summary-row total-row">
                  <span>Total</span>
                  <span>R{grandTotal.toFixed(2)}</span>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
                style={{ width: "100%", fontSize: "0.95rem", minHeight: "50px" }}
              >
                {submitting ? "Processing Order..." : `Place Order (R${grandTotal.toFixed(2)})`}
              </button>

              <div style={{ marginTop: "18px", textAlign: "center", fontSize: "0.78rem", color: "var(--muted)" }}>
                🔒 256-Bit SSL Encrypted Checkout · 30-Day Easy Returns
              </div>
            </aside>
          </form>
        )}
      </main>
    </Layout>
  );
}
