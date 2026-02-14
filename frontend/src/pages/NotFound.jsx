import React from 'react'
import { Link } from 'react-router-dom'

const NotFound = () => {
  return (
    <div className='min-h-screen bg-white items-center justify-center flex'>
        <div className='text-center p-8'>
            <h1 className='text-4xl font-bold mb-2'>404</h1>
            <p className='text-gray-800 mb-6'>Page Not Found</p>

            <Link className='px-4 py-2 rounded-md bg-indigo-700 text-white' to='/'>
            Go Home
            </Link>
        </div>
    </div>
  )
}

export default NotFound