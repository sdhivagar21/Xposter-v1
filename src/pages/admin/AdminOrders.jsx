import { useEffect, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout.jsx";
import { fetchAdminOrders } from "../../api/admin.js";
import LoadingScreen from "../../components/LoadingScreen.jsx";
import PosterImage from "../../components/PosterImage.jsx";

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
                  <ul className="space-y-3 text-sm">
                    {order.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        {/* Clicking the thumbnail opens the full-resolution
                            image in a new tab - important for customizable
                            posters, where you actually need to look closely
                            before printing. */}
                        <a
                          href={item.image}
                          target="_blank"
                          rel="noreferrer"
                          className="shrink-0"
                          aria-label={`Open full-size image for ${item.name}`}
                        >
                          <PosterImage src={item.image} alt={item.name} aspect="aspect-[3/4]" className="w-12" width={100} />
                        </a>
                        <div className="flex-1">
                          <div className="flex justify-between text-white/70">
                            <span>
                              {item.name} × {item.qty}
                            </span>
                            <span>₹{item.qty * item.price}</span>
                          </div>
                          {item.width && item.height && (
                            <p className="text-xs text-white/40">{item.width} × {item.height}px</p>
                          )}
                          {item.notes && <p className="text-xs text-white/40">Notes: {item.notes}</p>}
                        </div>
                      </li>
                    ))}
                  </ul>
                  {(order.discountAmount > 0 || order.a4DealAmount > 0) && (
                    <>
                      <div className="mt-2 flex justify-between border-t border-[var(--xp-border)] pt-2 text-sm text-white/60">
                        <span>Items total</span>
                        <span>₹{order.items.reduce((sum, item) => sum + item.qty * item.price, 0)}</span>
                      </div>
                      {order.discountAmount > 0 && (
                        <div className="mt-1 flex justify-between text-sm text-[var(--xp-accent-bright)]">
                          <span>Bundle discount ({order.discountPercent}%)</span>
                          <span>-₹{order.discountAmount}</span>
                        </div>
                      )}
                      {order.a4DealAmount > 0 && (
                        <div className="mt-1 flex justify-between text-sm text-[var(--xp-accent-bright)]">
                          <span>A4 deal (5 for ₹375)</span>
                          <span>-₹{order.a4DealAmount}</span>
                        </div>
                      )}
                    </>
                  )}
                  <div
                    className={`flex justify-between text-sm font-medium ${
                      order.discountAmount > 0 || order.a4DealAmount > 0 ? "mt-1" : "mt-2 border-t border-[var(--xp-border)] pt-2"
                    }`}
                  >
                    <span>Total</span>
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
