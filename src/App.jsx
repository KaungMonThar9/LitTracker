import {
  createBrowserRouter,
  Link,
  Outlet,
  RouterProvider,
} from "react-router-dom";
import BookSearch from "./components/BookSearch";
import MovieSearch from "./components/MovieSearch";
import UserList, { userListLoader } from "./components/UserList";
import "./App.css";

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
      { path: "BookSearch", element: <BookSearch /> },
      { path: "MovieSearch", element: <MovieSearch /> },
      {
        path: "UserList",
        element: <UserList />,
        loader: userListLoader,
      },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
