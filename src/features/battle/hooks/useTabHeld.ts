import { useEffect, useState } from "react";

export function useTabHeld() {
  const [tabHeld, setTabHeld] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;

      event.preventDefault();
      setTabHeld(true);
    };
    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === "Tab") setTabHeld(false);
    };
    const handleWindowBlur = () => setTabHeld(false);

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleWindowBlur);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, []);

  return tabHeld;
}
