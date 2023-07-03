import Note from './components/Note'
import { useState, useEffect, useRef } from 'react'
import noteService from './services/notes'
import Notification from './components/Notification'
import Footer from './components/Footer'
import loginService from './services/login'
import LoginForm from './components/LoginForm'
import NoteForm from './components/NoteForm'
import Togglable from './components/Togglable'

const App = () => {

  const [notes, setNotes] = useState(null)
  // const [newNote, setNewNote] = useState(
  //   'a new note...'
  // )
  const [showAll, setShowAll] = useState(true)
  const [errorMessage, setErrorMessage] = useState(null)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [user, setUser] = useState(null)

  const noteFormRef = useRef()

  useEffect(() => {
    const loggedUserJSON = window.localStorage.getItem('loggedNoteappUser')
    if (loggedUserJSON) {
      const authenticatedUser = JSON.parse(loggedUserJSON)
      setUser(authenticatedUser)
      noteService.setToken(authenticatedUser.token)
    }
  }, [])

  useEffect(() => {
    noteService
      .getAll()
      .then(initialNotes => {
        setNotes(initialNotes)
      })
  }, [])

  if (!notes) {
    return <div>Loading...</div>
  }

  const notesToShow = showAll
    ? notes
    : notes.filter(note => note.important === true)

  const addNote = (noteObject) => {
    noteFormRef.current.toggleVisibility()
    noteService
      .create(noteObject)
      .then(returnedNote => {
        setNotes(notes.concat(returnedNote))
      })
  }


  const toggleImportance = (id) => {
    const toggleImportanceOf = () => {
      const note = notes.find(n => n.id === id)
      const changedNote = { ...note, important: !note.important }

      noteService
        .update(id, changedNote)
        .then(returnedNote => {
          setNotes(notes.map(note => note.id !== id ? note : returnedNote))
        })
        .catch(error => {
          setErrorMessage(
            `Note '${note.content}' was already removed from server`
          )
          setTimeout(() => {
            setErrorMessage(null)
          }, 5000)
          setNotes(notes.filter(n => n.id !== id))
        })
    }
    return toggleImportanceOf
  }

  // const handleNoteChange = (event) => {
  //   setNewNote(event.target.value)
  // }

  const handleLogin = async (event) => {
    event.preventDefault()

    try {
      const authenticatedUser = await loginService.login({
        username, password,
      })

      window.localStorage.setItem(
        'loggedNoteappUser', JSON.stringify(authenticatedUser)
      )

      noteService.setToken(authenticatedUser.token)
      setUser(authenticatedUser)
      setUsername('')
      setPassword('')
    } catch (exception) {
      setErrorMessage('Wrong credentials')
      setTimeout(() => {
        setErrorMessage(null)
      }, 5000)
    }
  }

  const noteForm = () => (
    <>
      <p>logged in as {user.name}</p>
      <Togglable buttonLabel='new note' ref={noteFormRef}>
        <NoteForm createNote={addNote} />
      </Togglable>
    </>
  )

  const loginForm = () => {
    <Togglable buttonLabel='login'>
      <LoginForm
        username={username}
        password={password}
        handleUsernameChange={({ target }) => setUsername(target.value)}
        handlePasswordChange={({ target }) => setPassword(target.value)}
        handleSubmit={handleLogin}
      />
    </Togglable>
  }

  return (
    <div>
      <h1>Notes</h1>
      <Notification message={errorMessage} />

      {/* {!user && loginForm()} */}
      {!user && loginForm()}


      {user && noteForm()}
      <div>
        <button onClick={() => setShowAll(!showAll)}>
          show {showAll ? 'important' : 'all'}
        </button>
      </div>
      <ul>
        {notesToShow.map(note =>
          <Note key={note.id} note={note} toggleImportance={toggleImportance} />
        )}
      </ul>

      <Footer />
    </div>
  )
}

export default App
