import React from 'react'
import axios from 'axios'
import './MovieSearch.css'
import { useState } from 'react';

const MovieSearch = () => {
    const [data, setData] = useState([]);

    const search = async (formData) => {

    }
    return (
        <>
            <h1>Movie Search</h1>

            <form className='searchBar' action={search}>
                <input type='text' placeholder='Search' name='query'></input>
                <button type='submit'>Search</button>
            </form>
        </>
    )
}

export default MovieSearch