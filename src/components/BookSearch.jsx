import React from 'react'
import axios from 'axios'
import './BookSearch.css'
import { useState } from 'react';

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
      const trimmedData = bookData.map((book) => book.volumeInfo);

      setData(trimmedData);
      console.log(trimmedData);
    } catch (err) {
      console.error(err);
    }
  }

  const listBooks = data.map((bookData) => (
    <div className="col-sm-6 col-lg-3 py-2" key={bookData?.canonicalVolumeLink}>
      <div className="card h-100">
        <img
          src={bookData?.imageLinks?.thumbnail}
          className="card-img-top img-fluid"
          alt={bookData?.title}
        />
        <div className="card-body">
          <b>{bookData?.title}</b>
          <p className="card-text">Author: {bookData?.authors?.[0]}</p>
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
};

export default BookSearch;
