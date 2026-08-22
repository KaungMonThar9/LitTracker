import "./UserList.css";
import { useLoaderData } from "react-router-dom";

const UserList = () => {
  const data = useLoaderData();

  const listItems = data.map((media, index) => {
    const genres = Array.isArray(media.genres)
      ? media.genres.join(", ")
      : media.genres || "Not set";

    return (
      <tr key={media.id}>
        <td className="listNumber">{index + 1}</td>
        <td className="listTitleCell">
          {media.image_url && (
            <img src={media.image_url} alt="" className="listThumbnail" />
          )}
          <span>{media.title}</span>
        </td>
        <td>{media.score ?? "—"}</td>
        <td>{media.media_type || "Not set"}</td>
        <td>
          {media.progress_current ?? 0} / {media.progress_total ?? "—"}
        </td>
        <td>{genres}</td>
      </tr>
    );
  });

  return (
    <main className="userListPage">
      <div className="userListHeader">
        <div>
          <p className="userListKicker">Your library</p>
          <h1>Your List</h1>
        </div>
        <span className="listCount">{data.length} items</span>
      </div>

      {data.length === 0 ? (
        <p className="emptyListMessage">No items saved yet.</p>
      ) : (
        <div className="userListTableWrapper">
          <table className="userListTable">
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">Title</th>
                <th scope="col">Score</th>
                <th scope="col">Type</th>
                <th scope="col">Progress</th>
                <th scope="col">Genre</th>
              </tr>
            </thead>
            <tbody>{listItems}</tbody>
          </table>
        </div>
      )}
    </main>
  );
};

export default UserList;

