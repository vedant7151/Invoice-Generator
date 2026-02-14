import React from 'react'
import NavBar from '../components/NavBar'
import Hero from '../components/Hero'
import Features from '../components/Features'
import Pricing from '../components/Pricing'
import Footer from '../components/Footer'

const Home = () => {
  return (
    <div>
      <NavBar/>
      <main>
        <Hero/>
        <div>
          <Features/>
        </div>
        <Pricing/>
      </main>
      <Footer/> 
    </div>
  )
}

export default Home