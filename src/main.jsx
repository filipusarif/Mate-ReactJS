import React from 'react'
import ReactDOM from 'react-dom/client'
import {createBrowserRouter,RouterProvider} from "react-router-dom";
import './index.css'
import Detect from './pages/detectPageAPI.jsx'

const router = createBrowserRouter([
  {
    path: "/",
    element: <Detect/>,
    errorElement: 
    <div className='flex justify-center items-center w-screen h-screen'>
      <p>file notfound</p>
    </div>  
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
