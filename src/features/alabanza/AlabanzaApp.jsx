import { Route, Routes } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import './App.css';
import EdicionCanciones from './EdicionCanciones';
import ListadoCanciones from './ListadoCanciones';
import PantallaAcordes from './PantallaAcordes';

export default function AlabanzaApp() {
  return (
    <div className="alabanza-app">
      <Routes>
        <Route index element={<ListadoCanciones />} />
        <Route path="acordes" element={<PantallaAcordes />} />
        <Route path="edicion" element={<EdicionCanciones />} />
      </Routes>
    </div>
  );
}
