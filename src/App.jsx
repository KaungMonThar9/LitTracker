import { BrowserRouter, Route, Routes, Link } from 'react-router-dom'
import BookSearch from './components/BookSearch'
import './App.css'

function Home(){
  return <h1>Rec Page!</h1>
}

function App() {

  return (
    <BrowserRouter>
      <nav>
        <Link to='/'>Home</Link> | {' '}
        <Link to='/BookSearch'>Book Search</Link> | {' '}
        <Link to='/MovieSearch'>Movie Search</Link> | {' '}
      </nav>

      <Routes>
        <Route path='' element={<Home/>}></Route>
        <Route path='/BookSearch' element={<BookSearch/>}></Route>
        <Route path='/MovieSearch' element={<MovieSearch/>}></Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
