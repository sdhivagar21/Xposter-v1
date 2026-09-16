function generateOrderId() {
  return `XP-${Date.now().toString(36).toUpperCase()}`;
}

export async function placeOrder({ customer, items, subtotal }) {
  const orderId = generateOrderId();
  console.log("XPOSTERS mock order placed:", { orderId, customer, items, subtotal, placedAt: new Date().toISOString() });
  return { orderId };
}