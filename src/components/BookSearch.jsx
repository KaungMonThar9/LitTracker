import axios from "axios";
import "./BookSearch.css";
import { useState } from "react";

const BookSearch = () => {
  const [data, setData] = useState([]);

  async function search(formData) {
    const query = formData.get("query");
    const baseUrl = "https://www.googleapis.com/books/v1/volumes?";
    const BOOKS_API = import.meta.env.VITE_BOOKS_API_KEY;
    const params = {
      q: `"${query}"`,
      key: BOOKS_API,
      maxResults: 20,
    };
    try {
      const response = await axios.get(baseUrl, { params });
      const bookData = response.data.items || [];
      //const trimmedData = bookData.map((book) => book.volumeInfo);

      setData(bookData);
      console.log(bookData);
    } catch (err) {
      console.error(err);
    }
  }

  const listBooks = data.map((bookData) => (
    <div
      className="col-sm-6 col-lg-3 py-2"
      key={bookData?.volumeInfo.canonicalVolumeLink}
    >
      <div className="card h-100">
        <img
          src={bookData?.volumeInfo.imageLinks?.thumbnail}
          className="card-img-top img-fluid"
          alt={bookData?.volumeInfo.title}
        />
        <div className="card-body">
          <b>{bookData?.volumeInfo.title}</b>
          <p className="card-text">
            Author: {bookData?.volumeInfo.authors?.[0]}
          </p>
          <button type="button" onClick={() => addBook(bookData)}>
            Add to list
          </button>
        </div>
      </div>
    </div>
  ));

  return (
    <>
      <h1>Book Search</h1>
      <form className="searchBar" action={search}>
        <input name="query" />
        <button type="submit">Search</button>
      </form>
      <div className="container">
        <div className="row">{listBooks}</div>
      </div>
    </>
  );

  async function addBook(bookData) {
    const token = localStorage.getItem("token");

    const media_type = "book";
    const external_source = "Google Books";
    const external_id = bookData.id;
    const title = bookData?.volumeInfo.title;
    const image_url = bookData?.volumeInfo.imageLinks?.thumbnail;
    const release_date = bookData?.volumeInfo.publishedDate;
    const rating = null; //google books api doesnt have rating will pivot later

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
};

export default BookSearch;
