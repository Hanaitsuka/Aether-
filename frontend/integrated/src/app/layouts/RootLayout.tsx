import { Outlet } from "react-router";
import { AestheticProvider } from "../context/AestheticContext";

export function RootLayout() {
  return (
    <AestheticProvider>
      <Outlet />
    </AestheticProvider>
  );
}
