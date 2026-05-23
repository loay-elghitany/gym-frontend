import { useEffect } from "react";

export default function useBodyScrollLock(isOpen) {
  useEffect(() => {
    if (!document || !document.body) return undefined;

    if (isOpen) {
      document.body.classList.add("modal-open");
    } else {
      document.body.classList.remove("modal-open");
    }

    return () => {
      document.body.classList.remove("modal-open");
    };
  }, [isOpen]);
}
