import { createBrowserRouter } from "react-router";
import { Root } from "./pages/Root";
import { Home } from "./pages/Home";
import { SearchResults } from "./pages/SearchResults";
import { RideDetails } from "./pages/RideDetails";
import { PublishRide } from "./pages/PublishRide";
import { Profile } from "./pages/Profile";
import { Login } from "./pages/Login";
import { NotFound } from "./pages/NotFound";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Home },
      { path: "search", Component: SearchResults },
      { path: "ride/:id", Component: RideDetails },
      { path: "publish", Component: PublishRide },
      { path: "profile", Component: Profile },
      { path: "login", Component: Login },
      { path: "*", Component: NotFound },
    ],
  },
]);
