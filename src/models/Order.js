const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String },
    qty: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

// The full lifecycle an order can move through. The admin panel moves an
// order through these manually (there's no payment gateway wired up yet to
// drive this automatically) - every new order starts at "placed".
const ORDER_STATUSES = ["placed", "processing", "shipped", "delivered", "cancelled"];

const orderSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true, unique: true },
    customer: {
      name: { type: String, required: true, trim: true },
      email: { type: String, required: true, trim: true, lowercase: true },
      phone: { type: String, required: true, trim: true },
      address: { type: String, required: true, trim: true },
    },
    items: { type: [orderItemSchema], required: true, validate: (v) => Array.isArray(v) && v.length > 0 },
    subtotal: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ORDER_STATUSES, default: "placed" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);