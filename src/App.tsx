import './App.css';
import { Routes, Route, HashRouter } from "react-router-dom";
import Footer from './pages/Footer';
import Header from './pages/Header';
import CriticalPathAnalysis from './pages/CriticalPathAnalysis';
import EarnedValue from './pages/EarnedValue';
import SensitivityAnalysis from './pages/SensitivityAnalysis';


export default function App() {
  return (
    <HashRouter>
    <Header />
      <Routes>
        <Route path='/' element={<SensitivityAnalysis />} />
        <Route path='/SensitivityAnalysis' element={<SensitivityAnalysis />} />
        <Route path='/EarnedValue' element={<EarnedValue />} />
        <Route path='/CriticalPathAnalysis' element={<CriticalPathAnalysis />} />
        <Route path="/About" element={<h1>Created by Papa Onwona-Agyeman</h1>} />
      </Routes>
    {<div className='element-above-footer'></div>}  
    <Footer/>
    </HashRouter>
  )
}