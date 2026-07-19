import {
  createBrowserRouter,
  Link,
  Outlet,
  redirect,
  RouterProvider,
} from "react-router-dom";
import BookSearch from "./components/BookSearch";
import MovieSearch from "./components/MovieSearch";
import Login from "./components/Login";
import Register from "./components/Register";
import UserList, { userListLoader } from "./components/UserList";
import "./App.css";

function requireAuth() {
  const token = localStorage.getItem("token");

  if (!token) {
    throw redirect("/login");
  }

  return token;
}

function Home() {
  return <h1>Rec Page!</h1>;
}

function Layout() {
  return (
    <>
      <nav>
        <Link to="/">Home</Link> | <Link to="/BookSearch">Book Search</Link> |{" "}
        <Link to="/MovieSearch">Movie Search</Link> |{" "}
        <Link to="/UserList">Your List</Link> |{" "}
      </nav>
      <Outlet />
    </>
  );
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: "BookSearch", loader: requireAuth, element: <BookSearch /> },
      { path: "MovieSearch", loader: requireAuth, element: <MovieSearch /> },
      {
        path: "UserList",
        element: <UserList />,
        loader: async () => {
          requireAuth();
          return userListLoader();
        },
      },
      { path: "Login", element: <Login /> },
      { path: "Register", element: <Register /> },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
