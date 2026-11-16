import { lazy } from "react";
import { createBrowserRouter, createHashRouter, type RouteObject } from "react-router-dom";
import { AppFrame } from "./components/AppFrame";
import { staticOnly } from "./lib/deployment";

const AboutPage = lazy(() => import("./pages/AboutPage").then((module) => ({ default: module.AboutPage })));
const ComparePage = lazy(() => import("./pages/ComparePage").then((module) => ({ default: module.ComparePage })));
const ExplorePage = lazy(() => import("./pages/ExplorePage").then((module) => ({ default: module.ExplorePage })));
const HomePage = lazy(() => import("./pages/HomePage").then((module) => ({ default: module.HomePage })));
const ObjectsPage = lazy(() => import("./pages/ObjectsPage").then((module) => ({ default: module.ObjectsPage })));
const TimelinePage = lazy(() => import("./pages/TimelinePage").then((module) => ({ default: module.TimelinePage })));

const routes: RouteObject[] = [
  {
    path: "/",
    element: <AppFrame />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "explore", element: <ExplorePage /> },
      { path: "compare", element: <ComparePage /> },
      { path: "objects", element: <ObjectsPage /> },
      { path: "timeline", element: <TimelinePage /> },
      { path: "about", element: <AboutPage /> },
    ],
  },
];

export const router = staticOnly ? createHashRouter(routes) : createBrowserRouter(routes);
