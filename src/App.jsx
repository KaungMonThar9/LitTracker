import {
  createBrowserRouter,
  Link,
  Outlet,
  redirect,
  RouterProvider,
  useNavigate,
} from "react-router-dom";
import BookSearch from "./components/BookSearch";
import MovieSearch from "./components/MovieSearch";
import Login from "./components/Login";
import Register from "./components/Register";
import UserList, { userListLoader } from "./components/UserList";
import "./App.css";

function requireAuth(request) {
  const token = localStorage.getItem("token");

  if (!token) {
    const url = new URL(request.url);
    throw redirect(`/Login?redirectTo=${url.pathname}`);
  }

  return token;
}

function Home() {
  return <h1>Rec Page!</h1>;
}

function Layout() {
  const navigate = useNavigate();

  function handleLogout() {
    localStorage.removeItem("token");
    navigate("/Login");
  }
  return (
    <>
      <nav>
        <Link to="/">Home</Link> | <Link to="/BookSearch">Book Search</Link> |{" "}
        <Link to="/MovieSearch">Movie Search</Link> |{" "}
        <Link to="/UserList">Your List</Link> |{" "}
        <button type="button" onClick={handleLogout}>
          Logout
        </button>
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
      {
        path: "BookSearch",
        element: <BookSearch />,
      },
      {
        path: "MovieSearch",
        element: <MovieSearch />,
      },
      {
        path: "UserList",
        element: <UserList />,
        loader: async ({ request }) => {
          requireAuth(request);
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
