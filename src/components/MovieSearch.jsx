import axios from "axios";
import "./MovieSearch.css";
import { useState } from "react";

const MovieSearch = () => {
  const [data, setData] = useState([]);

  async function search(formData) {
    const movieTitle = formData.get("query")?.trim();
    const tmdbApiKey = import.meta.env.VITE_TMDB_API_KEY;

    if (!movieTitle || !tmdbApiKey) {
      setData([]);
      return;
    }

    const options = {
      method: "GET",
      url: "https://api.themoviedb.org/3/search/multi",
      params: {
        query: movieTitle,
        include_adult: false,
        language: "en-US",
        page: 1,
      },
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${tmdbApiKey}`,
      },
    };

    try {
      const response = await axios.request(options);
      const mediaResults = response.data.results ?? [];
      setData(mediaResults.filter((media) => media.media_type !== "person"));
    } catch (error) {
      console.error(
        "TMDB search failed:",
        error.response?.data ?? error.message,
      );

      setData([]);
    }
  }

  const listMovies = data.map((media) => {
    const title =
      media.title ||
      media.name ||
      media.original_title ||
      media.original_name ||
      "Untitled";
    if (title === "Untitled") {
      console.error("title not found");
    } else {
      const date = media.release_date || media.first_air_date || "Unknown";
      const type = media.media_type === "movie" ? "Movie" : "Series";

      return (
        <div
          className="col-sm-6 col-lg-3 py-2"
          key={`${media.media_type}-${media.id}`}
        >
          <div className="card h-100">
            {media.poster_path && (
              <img
                src={`https://image.tmdb.org/t/p/w342${media.poster_path}`}
                className="card-img-top img-fluid"
                alt={title}
              />
            )}
            <div className="card-body">
              <b>{title}</b>
              <br></br>
              <br></br>
              <p className="card-text">
                <strong>Released:</strong> {date}
                <br></br>
                <strong>Type:</strong> {type}
                <br></br>
                <strong>Score:</strong> {media.vote_average || "N/A"}
              </p>
              <button type="button" onClick={() => addMovie(media)}>
                Add to list
              </button>
            </div>
          </div>
        </div>
      );
    }
  });

  async function addMovie(media) {
    const token = localStorage.getItem("token");
    const title =
      media.title || media.name || media.original_title || media.original_name;
    const media_type = media.media_type;
    const external_source = "tmdb";
    const external_id = String(media.id);
    const image_url = media.poster_path
      ? `https://image.tmdb.org/t/p/w342${media.poster_path}`
      : null;
    const release_date =
      media.release_date || media.first_air_date || "Unknown";
    const rating = media.vote_average || null;

    const payload = {
      media_type: media_type,
      external_source: external_source,
      external_id: external_id,
      title: title,
      image_url: image_url,
      release_date: release_date,
      rating: rating,
    };
    const apiUrl = import.meta.env.VITE_API_URL;
    await axios
      .post(`${apiUrl}/api/media-list`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {
        console.log(response.data);
      })
      .catch((error) => {
        console.error(error);
      });
  }

  return (
    <>
      <h1>Movie Search</h1>

      <form className="searchBar" action={search}>
        <input type="text" placeholder="Search" name="query"></input>
        <button type="submit">Search</button>
      </form>

      <div className="container">
        <div className="row">{listMovies}</div>
      </div>
    </>
  );
};

export default MovieSearch;
