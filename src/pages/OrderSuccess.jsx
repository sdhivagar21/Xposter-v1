import { Link, Navigate, useLocation } from "react-router-dom";

export default function OrderSuccess() {
  const location = useLocation();
  const orderId = location.state?.orderId;

  if (!orderId) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-5 py-20 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-full border border-white text-2xl">✓</div>
      <h1 className="mt-6 font-display text-4xl sm:text-5xl">Order placed</h1>
      <p className="mt-4 text-white/60">
        Thanks — your order has been received. This is a mock confirmation; no payment was charged.
      </p>
      <p className="mt-6 border border-white/20 px-5 py-3 font-display text-lg tracking-wide">
        {orderId}
      </p>
      <Link to="/" className="mt-10 border border-white px-8 py-3 text-sm transition-colors hover:bg-white hover:text-black">
        Continue shopping
      </Link>
    </div>
  );
}
