import apiClient from "./client.js";

export async function placeOrder({ customer, items, subtotal }) {
  const { data } = await apiClient.post("/orders", { customer, items, subtotal });
  return data;
}