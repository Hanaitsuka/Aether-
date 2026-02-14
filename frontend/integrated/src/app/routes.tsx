import { createBrowserRouter } from "react-router";
import { RootLayout } from "./layouts/RootLayout";
import { LoginScreen } from "./screens/LoginScreen";
import { CalibrationScreen } from "./screens/CalibrationScreen";
import { SanctuaryScreen } from "./screens/SanctuaryScreen";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <LoginScreen /> },
      { path: "calibration", element: <CalibrationScreen /> },
      { path: "sanctuary", element: <SanctuaryScreen /> },
    ],
  },
]);