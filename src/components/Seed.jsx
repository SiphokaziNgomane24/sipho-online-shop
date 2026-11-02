import { addDoc, collection } from "firebase/firestore";
import { db } from "./firebase.js";

export const SAMPLE_PRODUCTS = [
  {
    id: "hoodie-01",
    name: "Classic Oversized Hoodie",
    category: "Hoodies",
    price: 650,
    description: "Heavyweight 450gsm organic cotton fleece with drop shoulders and double-layered hood.",
    imageURL: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=700&q=80",
  },
  {
    id: "hoodie-02",
    name: "Acid Wash Boxy Hoodie",
    category: "Hoodies",
    price: 720,
    description: "Vintage mineral wash with raw edge hem detailing and embroidered tonal branding.",
    imageURL: "https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=700&q=80",
  },
  {
    id: "tee-01",
    name: "Sipho Signature Heavyweight Tee",
    category: "T-shirts",
    price: 380,
    description: "Relaxed silhouette in 240gsm jersey cotton with ribbed crew collar.",
    imageURL: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=700&q=80",
  },
  {
    id: "tee-02",
    name: "Urban Minimalist Graphic Tee",
    category: "T-shirts",
    price: 360,
    description: "Contemporary typographic back print celebrating Johannesburg street culture.",
    imageURL: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=700&q=80",
  },
  {
    id: "sneaker-01",
    name: "Low-Profile Monolith Sneakers",
    category: "Sneakers",
    price: 1250,
    description: "Supple full-grain leather upper with cushioned EVA sole and clean profile.",
    imageURL: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=700&q=80",
  },
  {
    id: "acc-01",
    name: "Tactical Utility Crossbody Bag",
    category: "Accessories",
    price: 320,
    description: "Water-resistant Cordura nylon with quick-release metal buckle and modular straps.",
    imageURL: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=700&q=80",
  },
  {
    id: "acc-02",
    name: "Embroidered 6-Panel Twill Cap",
    category: "Accessories",
    price: 260,
    description: "Unstructured crown in washed cotton twill with antique brass buckle adjuster.",
    imageURL: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=700&q=80",
  },
];

export async function seedProduct({ name, price, category, description, imageURL }) {
  return await addDoc(collection(db, "hoodies"), { name, price, category, description, imageURL });
}

export async function seedAllSampleProducts() {
  const results = [];
  for (const item of SAMPLE_PRODUCTS) {
    const data = {
      name: item.name,
      category: item.category,
      price: item.price,
      description: item.description,
      imageURL: item.imageURL,
    };
    const res = await addDoc(collection(db, "hoodies"), data);
    results.push(res);
  }
  return results;
}