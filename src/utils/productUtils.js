/**
 * Normalizes a Firestore document from the "hoodies" / "products" collection.
 * Accommodates variations in field casing (e.g. Price vs price, Name vs name,
 * ImageURL vs imageURL vs imageUrl, Category vs category) and trailing spaces in keys.
 */
export function normalizeProduct(docOrData, docId = null) {
  let id = docId;
  let data = {};

  if (docOrData && typeof docOrData.data === "function") {
    id = docOrData.id;
    data = docOrData.data() || {};
  } else if (docOrData && typeof docOrData === "object") {
    id = docOrData.id || docId;
    data = docOrData;
  }

  const findValue = (...targetKeys) => {
    // 1. Direct match
    for (const k of targetKeys) {
      if (data[k] !== undefined && data[k] !== null && String(data[k]).trim() !== "") {
        return data[k];
      }
    }
    // 2. Case-insensitive & trimmed key match
    for (const [actualKey, val] of Object.entries(data)) {
      const cleanKey = actualKey.trim().toLowerCase();
      for (const k of targetKeys) {
        if (cleanKey === k.trim().toLowerCase() && val !== undefined && val !== null && String(val).trim() !== "") {
          return val;
        }
      }
    }
    return "";
  };

  const rawName = findValue("Name", "name", "title", "Title", "productName");
  const rawPrice = findValue("Price", "price", "amount", "cost");
  const rawDesc = findValue("Description", "description", "Discription", "desc", "details");
  const rawImage = findValue("ImageURL", "imageURL", "imageUrl", "ImageUrl", "image", "Image", "img", "photo");
  const rawCategory = String(findValue("Category", "category", "type") || "").trim();

  // Normalize category to standard groupings: Hoodies, T-shirts, Sneakers, Accessories
  let category = "Hoodies";
  const catLower = rawCategory.toLowerCase();
  if (catLower.includes("hoodie")) {
    category = "Hoodies";
  } else if (catLower.includes("t-shirt") || catLower.includes("t shirt") || catLower.includes("tee")) {
    category = "T-shirts";
  } else if (catLower.includes("sneaker") || catLower.includes("shoe") || catLower.includes("kicks")) {
    category = "Sneakers";
  } else if (
    catLower.includes("access") ||
    catLower.includes("cap") ||
    catLower.includes("bag") ||
    catLower.includes("sock")
  ) {
    category = "Accessories";
  } else if (rawCategory) {
    category = rawCategory;
  }

  // Parse numeric price cleanly
  let price = 0;
  if (typeof rawPrice === "number") {
    price = rawPrice;
  } else if (typeof rawPrice === "string") {
    const parsed = parseFloat(rawPrice.replace(/[^0-9.]/g, ""));
    price = isNaN(parsed) ? 0 : parsed;
  }

  return {
    id: id || Math.random().toString(36).slice(2),
    name: String(rawName).trim() || "Streetwear Piece",
    price,
    description: String(rawDesc).trim(),
    category,
    imageURL: String(rawImage).trim(),
    rawCategory,
  };
}
