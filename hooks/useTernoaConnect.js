import { useContext } from "react";
import { TernoaConnectContext } from "../contexts/TernoaConnectContext";

export function useTernoaConnect() {
  const context = useContext(TernoaConnectContext);
  if (context === undefined) {
    throw new Error(
      "useTernoaConnect must be used within a TernoaConnectContextProvider"
    );
  }
  return context;
}
