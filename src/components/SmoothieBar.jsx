import { useEffect, useState } from "react";
import api from "../api/axios";

const sampleMenu = [
  { id: "s1", name: "Green Recovery", price: 5 },
  { id: "s2", name: "Protein Boost", price: 7 },
  { id: "s3", name: "Energy Shot", price: 3 },
];

export default function SmoothieBar() {
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);

  useEffect(() => {
    const fetchBal = async () => {
      setLoading(true);
      try {
        const res = await api.get("/wallet/balance");
        setBalance(res?.data?.data?.balance || 0);
      } catch (err) {
        setBalance(0);
      } finally {
        setLoading(false);
      }
    };
    fetchBal();
  }, []);

  const placeOrder = async (product) => {
    setOrdering(true);
    try {
      const res = await api.post("/wallet/order", {
        productId: product.id,
        price: product.price,
      });
      setBalance(res?.data?.data?.balance ?? balance - product.price);
      alert("Order placed — pick it up at the bar!");
    } catch (err) {
      alert(err?.response?.data?.message || "Unable to place order");
    } finally {
      setOrdering(false);
    }
  };

  return (
    <div className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-950">
          Smoothie Bar Express
        </h3>
        <div className="text-sm text-slate-600">
          Balance: ${loading ? "–" : balance}
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        {sampleMenu.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3"
          >
            <div>
              <div className="font-medium text-slate-900">{item.name}</div>
              <div className="text-xs text-slate-500">${item.price}</div>
            </div>
            <button
              disabled={ordering}
              onClick={() => placeOrder(item)}
              className="rounded-3xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
            >
              Order
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
