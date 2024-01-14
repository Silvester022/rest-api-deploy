const express = require('express') 
const crypto = require('node:crypto')
const cors = require('cors')

const movies = require('./movies.json')
const { validateMovie, validatePartialMovie } = require('./schemas/movies')

const app = express()
app.use(express.json())

app.use(cors({
  origin: (origin, callback) => {
    const ACCEPTED_ORIGINS = [
      'http://localhost:8080',
      'http://localhost:3000',
      'http://movies.com',
      'http://midu.dev',
    ]

    if(ACCEPTED_ORIGINS.includes(origin)) return callback(null, true)

    if(!origin) return callback(null, true)

    return callback(new Error('Not allowed by CORS'))
  }
}))

app.disable('x-powered-by')

app.get('/movies', (req, res) => {
  const { genre } = req.query

  if (genre) {
    const filterMovies = movies.filter(movie => movie.genre.some(g => g.toLowerCase() === genre.toLowerCase()))
    return res.json(filterMovies)
  }

  res.json(movies)
})

app.get('/movies/:id', (req, res) => { // path-to-regex
  const { id } = req.params
  const movie = movies.find(movie => movie.id === id)
  if (movie) return res.json(movie)

  res.status(404).json({ message: 'Movie Not Found' })
})

app.post('/movies', (req, res) => {
  const result = validateMovie(req.body)

  // 422 Unprocessable Entity
  if (!result.success) {
    return res.status(400).json({ error: result.error.issues })
  }

  // en bbdd
  const newMovie = {
    id: crypto.randomUUID(), 
    ...result.data
  }

  // esto no seria REST, porque estamos guardando el estado de la app en memoria
  movies.push(newMovie)

  res.status(201).json(newMovie) // actualizar la cache del cliente
})

app.patch('/movies/:id', (req, res) => {
  const result = validatePartialMovie(req.body)

  if(!result.success) return res.status(400).json({error: JSON.parse(result.error.message)})
  
  const { id } = req.params

  const movieIndex = movies.findIndex(movie => movie.id === id)
  if(movieIndex === -1) return res.status(404).json({message: 'Movie Not Found'}) 

  const updateMovie = {
    ...movies[movieIndex],
    ...result.data,
  }

  movies[movieIndex] = updateMovie

  return res.json(updateMovie)
})

app.delete('/movies/:id', (req, res) => {
  const { id } = req.params
  const movieIndex = movies.findIndex(movie => movie.id === id)

  if(movieIndex === -1) return res.status(404).json({message: 'Movie Not Found'})

  movies.splice(movieIndex, 1)

  return res.json({message: 'Movie deleted'})
})

const PORT = process.env.PORT ?? 3000

app.listen(PORT, () => {
  console.log(`server listening on port http://localhost:${PORT}`)
})
