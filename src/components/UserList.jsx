import axios from "axios";
import { useState } from "react";
import { useLoaderData } from "react-router-dom";
import "./UserList.css";

const categories = [
  { key: "all", label: "All" },
  { key: "planned", label: "Planned" },
  { key: "watching", label: "Watching" },
  { key: "completed", label: "Completed" },
  { key: "on_hold", label: "On Hold" },
  { key: "dropped", label: "Dropped" },
];
const scoreOptions = Array.from({ length: 19 }, (_, index) => (index + 2) / 2);

const UserList = () => {
  const initialData = useLoaderData();
  const [data, setData] = useState(initialData);
  const [activeCategory, setActiveCategory] = useState("all");
  const [savingId, setSavingId] = useState(null);
  const [saveError, setSaveError] = useState("");
  const [editingProgressId, setEditingProgressId] = useState(null);

  const filteredData = data.filter((media) => {
    const status = media.status || "planned";
    return activeCategory === "all" || status === activeCategory;
  });

  async function updateListItem(mediaItemId, changes) {
    const token = localStorage.getItem("token");
    const apiUrl = import.meta.env.VITE_API_URL;
    setSavingId(mediaItemId);
    setSaveError("");
    try {
      const response = await axios.patch(apiUrl + "/api/media-list/" + mediaItemId, changes, {
        headers: { Authorization: "Bearer " + token },
      });
      const updatedItem = {
        ...response.data,
        score:
          response.data.score == null ? null : Number(response.data.score),
      };

      setData((current) => current.map((item) =>
        (item.id ?? item.media_item_id) === mediaItemId
          ? { ...item, ...updatedItem }
          : item,
      ));
    } catch (error) {
      console.error("Failed to update list item:", error.response?.data ?? error);
      setSaveError(error.response?.data?.error || "Could not save that change. Please try again.");
    } finally {
      setSavingId(null);
    }
  }

  const listItems = filteredData.map((media, index) => {
    const genres = Array.isArray(media.genres) ? media.genres.join(", ") : media.genres || "Not set";
    const status = media.status || "planned";
    const currentProgress = media.progress_current ?? 1;
    const totalProgress = media.progress_total ?? "-";
    const progressUnit = media.progress_unit ? " " + media.progress_unit : "";
    const mediaItemId = media.id ?? media.media_item_id;

    return (
      <tr key={media.id}>
        <td className="listNumber">{index + 1}</td>
        <td className="listTitleCell">
          {media.image_url && <img src={media.image_url} alt="" className="listThumbnail" />}
          <span>{media.title}</span>
        </td>
        <td>{media.rating ?? "-"}</td>
        <td>
          <select className="listSelect scoreSelect" aria-label={"Score for " + media.title} value={media.score ?? ""} disabled={savingId === mediaItemId} onChange={(event) => updateListItem(mediaItemId, { score: event.target.value === "" ? null : Number(event.target.value) })}>
            <option value="">-</option>
            {scoreOptions.map((score) => <option key={score} value={score}>{score.toFixed(1)}</option>)}
          </select>
        </td>
        <td>{media.media_type || "Not set"}</td>
                <td>
          <div className="progressEditor">
            {editingProgressId === mediaItemId ? (
              <input
                className="progressInput"
                type="number"
                min="1"
                step="1"
                defaultValue={currentProgress}
                autoFocus
                aria-label={"Progress for " + media.title}
                disabled={savingId === mediaItemId}
                onKeyDown={(event) => {
                  if (event.key === "Enter") event.currentTarget.blur();
                }}
                onBlur={(event) => {
                  const progress = Number(event.currentTarget.value);
                  setEditingProgressId(null);

                  if (Number.isInteger(progress) && progress >= 1) {
                    updateListItem(mediaItemId, {
                      progress_current: progress,
                    });
                  } else {
                    event.currentTarget.value = currentProgress;
                  }
                }}
              />
            ) : (
              <button
                type="button"
                className="progressTrigger"
                onClick={() => setEditingProgressId(mediaItemId)}
                aria-label={"Edit progress for " + media.title}
              >
                {currentProgress}
              </button>
            )}
            <span>{" / " + totalProgress + progressUnit}</span>
          </div>
        </td>
        <td>
          <select className={"listSelect statusSelect status-" + status} aria-label={"Status for " + media.title} value={status} disabled={savingId === mediaItemId} onChange={(event) => updateListItem(mediaItemId, { status: event.target.value })}>
            {categories.filter((category) => category.key !== "all").map((category) => <option key={category.key} value={category.key}>{category.label}</option>)}
          </select>
        </td>
        <td>{genres}</td>
      </tr>
    );
  });

  return (
    <main className="userListPage">
      <div className="userListHeader"><div><p className="userListKicker">Your library</p><h1>Your List</h1></div><span className="listCount">{data.length} items</span></div>
      <nav className="listCategories" aria-label="List categories">
        {categories.map((category) => <button key={category.key} type="button" className={activeCategory === category.key ? "active" : ""} onClick={() => setActiveCategory(category.key)}>{category.label}</button>)}
      </nav>
      {saveError && <p className="listSaveError">{saveError}</p>}
      {filteredData.length === 0 ? <p className="emptyListMessage">{data.length === 0 ? "No items saved yet." : "No items in " + categories.find((category) => category.key === activeCategory)?.label + "."}</p> : (
        <div className="userListTableWrapper"><table className="userListTable"><thead><tr><th scope="col">#</th><th scope="col">Title</th><th scope="col">Rating</th><th scope="col">Your Score</th><th scope="col">Type</th><th scope="col">Progress</th><th scope="col">Status</th><th scope="col">Genre</th></tr></thead><tbody>{listItems}</tbody></table></div>
      )}
    </main>
  );
};

export default UserList;




