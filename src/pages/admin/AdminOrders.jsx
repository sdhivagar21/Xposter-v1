import { useEffect, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout.jsx";
import { fetchAdminOrders } from "../../api/admin.js";
import LoadingScreen from "../../components/LoadingScreen.jsx";

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAdminOrders()
      .then(setOrders)
      .catch(() => setError("Couldn't load orders."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminLayout>
      <h1 className="font-display text-3xl">Orders</h1>

      {error && <p className="mt-6 text-sm text-white/50">{error}</p>}
      {loading && <LoadingScreen />}

      {!loading && orders.length === 0 && (
        <p className="mt-10 text-sm text-white/40">No orders placed yet.</p>
      )}

      {!loading && orders.length > 0 && (
        <div className="mt-8 space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="border border-[var(--xp-border)] p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-display text-lg tracking-wide">{order.orderId}</p>
                <p className="text-xs text-white/40">{new Date(order.createdAt).toLocaleString()}</p>
              </div>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <div className="text-sm text-white/70">
                  <p>{order.customer.name}</p>
                  <p className="text-white/40">{order.customer.email}</p>
                  <p className="text-white/40">{order.customer.phone}</p>
                  <p className="text-white/40">{order.customer.address}</p>
                </div>
                <div>
                  <ul className="space-y-1 text-sm">
                    {order.items.map((item, i) => (
                      <li key={i} className="flex justify-between text-white/70">
                        <span>
                          {item.name} × {item.qty}
                        </span>
                        <span>₹{item.qty * item.price}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-2 flex justify-between border-t border-[var(--xp-border)] pt-2 text-sm font-medium">
                    <span>Subtotal</span>
                    <span>₹{order.subtotal}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
