import React, { useState, useEffect, useRef } from 'react';
import Soundfont from 'soundfont-player';
import axios from 'axios';

function ReproducirMelodia({ texto, tempo, transportarProxima }) {
  const [seccion, setSeccion] = useState([]);
  const [cambioTonalidad, setCambioTonalidad] = useState(0);
  const [instrumento, setInstrumento] = useState(null);
  const audioContext = useRef(null);
  const notas = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'];

  useEffect(() => {
    audioContext.current = new AudioContext();
    Soundfont.instrument(audioContext.current, 'acoustic_grand_piano').then((instrument) => {
      setInstrumento(instrument);
    });
  }, []);

   useEffect(() => {
    setCambioTonalidad(transportarProxima);
  }, [transportarProxima]);

  function handleReproducir(index) {
    if (!instrumento) return;

    const textoMidi=seccion[index].contenido;
    const notas = textoMidi.split(']').filter(Boolean).map((nota) => nota.replace('[', '').trim());
    //const tempo = 120; // Tempo en BPM
    const duracionNegra = (60 / tempo) * 1000; // Duración de una negra en milisegundos
    let tiempoActual = 0;

    notas.forEach((nota) => {
      const [notaTexto, octavaTexto, duracionTexto] = nota.split('-');
      if (notaTexto === 'S') {
        tiempoActual += duracionNegra; // Silencio: avanza el tiempo
        return;
      }

      const notaMidi = obtenerNotaMidi(notaTexto, parseInt(octavaTexto));
      const duracion = obtenerDuracion(duracionTexto, duracionNegra);

      instrumento.play(notaMidi, audioContext.current.currentTime + tiempoActual / 1000, {
        duration: duracion / 1000,
      });

      tiempoActual += duracion;
    });
  };
 const obtenerNotaMidi = (notaTexto, octava) => {
  const notasMidi = {
    C: 0,
    'C#': 1,
    D: 2,
    'D#': 3,
    E: 4,
    F: 5,
    'F#': 6,
    G: 7,
    'G#': 8,
    A: 9,
    'A#': 10,
    B: 11,
  };
  return notasMidi[notaTexto] + (octava) * 12; // Modificación aquí
};
  const obtenerDuracion = (duracionTexto, duracionNegra) => {
    const duraciones = {
      n: duracionNegra,
      b: duracionNegra * 2,
      c: duracionNegra / 2,
      sc: duracionNegra / 4,
    };
    return duraciones[duracionTexto] || duracionNegra;
  };

  function transponerNotas(texto, transporte) {
  const notas = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  const transponerNota = (nota, octava, semitonos) => {

    console.log(nota)
    console.log(octava)
    console.log(semitonos)

    let index = notas.indexOf(nota);
    if (index === -1) return { nota, octava }; // Si no es una nota válida, devuelve la misma nota

    let nuevoIndex = (index + semitonos) % 12;
    if (nuevoIndex < 0) nuevoIndex += 12; // Asegura que el índice sea positivo

    let nuevaOctava = octava + Math.floor((index + semitonos) / 12);


    console.log(nuevoIndex)
    console.log(nuevaOctava)

    return { nota: notas[nuevoIndex], octava: nuevaOctava };
  };

  const regex = /\[([A-G]#?)-(\d+)-([a-z]+)\]/g;
  return texto.replace(regex, (match, nota, octava, figura) => {
    const { nota: nuevaNota, octava: nuevaOctava } = transponerNota(nota, parseInt(octava), transporte);
    return `[${nuevaNota}-${nuevaOctava}-${figura}]`;
  });
}

  useEffect(() => {
    if (!texto) { // Verifica si texto es null o undefined
      setSeccion([]); // Establece seccion como un array vacío si texto es nulo
      return; // Detiene la ejecución si texto es nulo
    }

    const secciones = [];
    const regex = /%([^%]*)%/g;
    let match;
    let lastIndex = 0;

    while ((match = regex.exec(texto)) !== null) {
      if (lastIndex < match.index) {
        const contenido = transponerNotas(texto.substring(lastIndex, match.index).trim(), cambioTonalidad);
        if (secciones.length > 0) {
          secciones[secciones.length - 1].contenido = contenido;
        }
      }
      secciones.push({ titulo: match[1], contenido: '' });
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < texto.length) {
      secciones[secciones.length - 1].contenido = transponerNotas(texto.substring(lastIndex).trim(), cambioTonalidad);
    }
    setSeccion(secciones);
  }, [texto, cambioTonalidad]);

  return (
    <div>
      {seccion.map((item, index) => (
        <div key={index}>
           <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ whiteSpace: 'nowrap' }}>{item.titulo}</div>
            <button onClick={handleReproducir.bind(null, index)} style={{ marginLeft: '10px' }}>Reproducir</button>
          </div>
          <br/>
          <div style={{ marginTop: '10px' }}>{item.contenido}</div>
          <br/><br/>
        </div>
      ))}


    </div>
  );
}

export default ReproducirMelodia;