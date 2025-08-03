import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="App">
      <h1>Synta</h1>
      <p>Visual Website Builder</p>
      
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          Count: {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test hot module replacement
        </p>
      </div>
    </div>
  )
}

export default App 