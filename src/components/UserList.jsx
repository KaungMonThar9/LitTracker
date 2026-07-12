import axios from "axios";
import "./UserList.css";
import { useLoaderData } from "react-router-dom";

export async function userListLoader() {
  const apiUrl = import.meta.env.VITE_API_URL;
  const response = await axios.get(`${apiUrl}/api/media-list`);

  return response.data ?? [];
}

const UserList = () => {
  const data = useLoaderData();

  const listItems = data.map((media) => (
    <div className="col-sm-6 col-lg-3 py-2" key={media.id}>
      <div className="card h-100">
        {media.image_url && (
          <img
            src={media.image_url}
            className="card-img-top img-fluid"
            alt={media.title}
          />
        )}
        <div className="card-body">
          <b>{media.title}</b>
          <p className="card-text">
            <strong>Released:</strong> {media.release_date || "Unknown"}
            <br />
            <strong>Type:</strong> {media.media_type}
            <br />
            <strong>Score:</strong> {media.rating ?? "N/A"}
          </p>
        </div>
      </div>
    </div>
  ));

  return (
    <>
      <h1>Your List</h1>

      {data.length === 0 && <p>No items saved yet.</p>}

      <div className="container">
        <div className="row">{listItems}</div>
      </div>
    </>
  );
};

export default UserList;
