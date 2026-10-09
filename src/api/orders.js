import apiClient from "./client.js";

// The backend computes the subtotal (and any bulk-poster discount) itself
// from `items` rather than trusting a number from here - see
// orderController.js's createOrder - so there's nothing to send but the
// order's own contents.
export async function placeOrder({ customer, items }) {
  const { data } = await apiClient.post("/orders", { customer, items });
  return data;
}

// Customizable-poster submissions always send FormData (an uploaded file, or
// just a pasted image link as a text field) - handled with a bare axios call
// instead of the shared apiClient, because apiClient's default
// "Content-Type: application/json" header would stop the browser from
// adding the multipart boundary the backend needs to parse an uploaded file.
export async function submitCustomPosterOrder(formData) {
  const { data } = await apiClient.post("/orders/custom", formData);
  return data;
}

// Enhances a customer's uploaded file / pasted link to print quality for the
// chosen size and returns the hosted result for a live preview. Same bare
// axios + FormData reasoning as above.
export async function enhanceCustomImage(formData) {
  const { data } = await apiClient.post("/orders/custom/enhance", formData, { timeout: 120000 });
  return data;
}
