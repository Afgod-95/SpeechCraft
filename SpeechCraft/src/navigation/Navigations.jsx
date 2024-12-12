import React from 'react'
import { Routes, Route } from 'react-router-dom'
import TranscribeAudio from '../app/TranscribeAudio'
import Home from '../app/Home'
import NotFound from '../app/NotFound'

const Navigations = () => {

  return (
    <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/transcribe-audio" element={<TranscribeAudio />} />
        <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default Navigations
