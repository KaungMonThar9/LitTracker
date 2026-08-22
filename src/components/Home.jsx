import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "./Home.css";

const imageUrl = (path, size = "w780") =>
  path ? "https://image.tmdb.org/t/p/" + size + path : null;

const mediaImage = (media, size = "w780") => {
  const source = media.backdrop_path || media.poster_path || media.image_url;
  return source?.startsWith("http") ? source : imageUrl(source, size);
};

function titleOf(media) {
  return media.title || media.name || media.original_title || media.original_name || "Untitled";
}

function dateOf(media) {
  return media.release_date || media.first_air_date || "Release date unknown";
}

function typeOf(media) {
  if (media.media_type === "tv") return "Series";
  if (media.media_type === "movie") return "Movie";
  return media.media_type || "Media";
}

const Home = () => {
  const [featured, setFeatured] = useState(null);
  const [trending, setTrending] = useState(null);
  const [listRecommendation, setListRecommendation] = useState(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const carouselItems = useMemo(
    () =>
      [
        trending && {
          eyebrow: "Trending today",
          heading: "Something worth watching",
          media: trending,
        },
        listRecommendation && {
          eyebrow: "Based on your list",
          heading: "A recommendation for you",
          media: listRecommendation,
        },
      ].filter(Boolean),
    [listRecommendation, trending],
  );

  useEffect(() => {
    let current = true;
    const apiKey = import.meta.env.VITE_TMDB_API_KEY;

    async function loadHomepage() {
      if (!apiKey) {
        setError("Recommendations are unavailable until the media API is configured.");
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(
          "https://api.themoviedb.org/3/trending/all/day",
          {
            params: { language: "en-US" },
            headers: {
              accept: "application/json",
              Authorization: "Bearer " + apiKey,
            },
          },
        );

        const results = (response.data.results || []).filter(
          (media) => media.media_type === "movie" || media.media_type === "tv",
        );
        const withImages = results.filter((media) => media.backdrop_path);
        const randomTrending = results[Math.floor(Math.random() * results.length)];
        const randomWithImage =
          withImages[Math.floor(Math.random() * withImages.length)];

        if (!current) return;

        setFeatured(randomWithImage || randomTrending || null);
        setTrending(randomTrending || withImages[0] || null);

        const token = localStorage.getItem("token");
        if (!token) return;

        const listResponse = await axios.get(
          import.meta.env.VITE_API_URL + "/api/media-list",
          { headers: { Authorization: "Bearer " + token } },
        );
        const savedItems = listResponse.data || [];
        const savedTmdb = savedItems.filter(
          (item) =>
            item.external_source === "tmdb" &&
            (item.media_type === "movie" || item.media_type === "tv"),
        );
        const savedItem = savedTmdb[Math.floor(Math.random() * savedTmdb.length)];

        if (!savedItem) {
          if (current) setListRecommendation(savedItems[0] || null);
          return;
        }

        const recommendationResponse = await axios.get(
          "https://api.themoviedb.org/3/" +
            savedItem.media_type +
            "/" +
            savedItem.external_id +
            "/recommendations",
          {
            params: { language: "en-US", page: 1 },
            headers: {
              accept: "application/json",
              Authorization: "Bearer " + apiKey,
            },
          },
        );
        const recommendation = (recommendationResponse.data.results || []).find(
          (media) => media.poster_path || media.backdrop_path,
        );

        if (current) setListRecommendation(recommendation || savedItem);
      } catch (requestError) {
        console.error("Homepage recommendations failed:", requestError);
        if (current) setError("Some recommendations could not be loaded.");
      } finally {
        if (current) setLoading(false);
      }
    }

    loadHomepage();
    return () => {
      current = false;
    };
  }, []);

  const activeItem = carouselItems[carouselIndex] || carouselItems[0];
  const activeMedia = activeItem?.media;
  const activeImage = activeMedia && mediaImage(activeMedia, "w500");

  function previous() {
    setCarouselIndex((index) =>
      carouselItems.length
        ? (index - 1 + carouselItems.length) % carouselItems.length
        : 0,
    );
  }

  function next() {
    setCarouselIndex((index) =>
      carouselItems.length ? (index + 1) % carouselItems.length : 0,
    );
  }

  return (
    <main className="homePage">
      <section className="homeIntro">
        <p className="homeKicker">Rec Page!</p>
        <h1>Find your next world to get lost in.</h1>
        <p>
          A daily mix of what is moving now and what fits the things you already love.
        </p>
        <div className="homeActions">
          <Link to="/MovieSearch">Explore movies</Link>
          <Link to="/BookSearch">Find a book</Link>
        </div>
      </section>

      <section className="featuredSection" aria-labelledby="featured-heading">
        <div className="sectionHeading">
          <p className="eyebrow">Featured today</p>
          <h2 id="featured-heading">One pick for right now</h2>
        </div>

        {loading && <div className="homePlaceholder">Loading today&apos;s pick...</div>}
        {!loading && featured && (
          <article className="featuredMedia">
            <img
              src={mediaImage(featured)}
              alt={titleOf(featured)}
            />
            <div className="featuredOverlay">
              <p className="eyebrow">{typeOf(featured)}</p>
              <h3>{titleOf(featured)}</h3>
              <p>{featured.overview || "A popular pick from today's media conversation."}</p>
              <span>
                {dateOf(featured)} · Score {featured.vote_average?.toFixed(1) || "N/A"}
              </span>
            </div>
          </article>
        )}
        {!loading && !featured && (
          <div className="homePlaceholder">
            {error || "No featured media is available right now."}
          </div>
        )}
      </section>

      <section className="carouselSection" aria-labelledby="carousel-heading">
        <div className="sectionHeading">
          <div>
            <p className="eyebrow">What to watch</p>
            <h2 id="carousel-heading">A short list, tuned for today</h2>
          </div>
          {carouselItems.length > 1 && (
            <div className="carouselControls">
              <button type="button" aria-label="Previous recommendation" onClick={previous}>
                &larr;
              </button>
              <span>{carouselIndex + 1} / {carouselItems.length}</span>
              <button type="button" aria-label="Next recommendation" onClick={next}>
                &rarr;
              </button>
            </div>
          )}
        </div>

        {activeItem && activeMedia ? (
          <article className="recommendationCard">
            <div className="recommendationImage">
              {activeImage && (
                <img src={activeImage} alt={titleOf(activeMedia)} />
              )}
            </div>
            <div className="recommendationBody">
              <p className="eyebrow">{activeItem.eyebrow}</p>
              <h3>{activeItem.heading}</h3>
              <h4>{titleOf(activeMedia)}</h4>
              <p>
                {activeMedia.overview ||
                  "A title connected to the media you have been exploring."}
              </p>
              <span>{typeOf(activeMedia)} · {dateOf(activeMedia)}</span>
            </div>
          </article>
        ) : (
          <div className="homePlaceholder">
            {loading
              ? "Building your watch carousel..."
              : error || "Log in and save media to unlock list-based recommendations."}
          </div>
        )}
      </section>
    </main>
  );
};

export default Home;


