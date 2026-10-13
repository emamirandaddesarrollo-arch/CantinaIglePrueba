import React, { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { Link } from 'react-router-dom';
import './App.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import { Form, Button } from 'react-bootstrap';
import MidiReproductor from './MidiReproductor';
import * as Tone from 'tone'; // Importa Tone.js

const notas = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const notasConBemoles = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

function PantallaAcordes() {
  const [contenido, setContenido] = useState('');
  const [titulo, setTitulo] = useState('');
  const [tonalidad, setTonalidad] = useState('');
  const [fontSize, setFontSize] = useState(1); // Tamaño inicial de la fuente en rem
  const [acordesTranspuestos, setAcordesTranspuestos] = useState([]);
  const [cookieValue, setCookieValue] = useState('');
  const [id, setId] = useState(0);
  const [comentario, setComentario] = useState('');
  const [melodias, setMelodias] = useState('');
  const [tempo, setTempo] = useState(0);
  const [selectedSongsUrl, setSelectedSongsUrl] = useState([]);
  const [idProxima, setIdProxima] = useState([]);
  const [transportarProxima, setTransportarProxima] = useState([]);
  const [inList, setInList] = useState('');
  const [transporte, setTransporte] = useState(0);
 // --- Nuevos estados para el metrónomo ---
  const [isMetronomePlaying, setIsMetronomePlaying] = useState(false);
  // Usa useRef para mantener la instancia del sintetizador del metrónomo
  // Dado que Tone.js no se renderiza en React, useRef es ideal para mantener la referencia a objetos mutables.
  const metronomeSynth = React.useRef(null);

  useEffect(() => {

    const searchParams = new URLSearchParams(window.location.search);
    const transportar = parseInt(searchParams.get('transportar'), 10) || 0;
    setTransporte(transportar);
    const letra = parseFloat(searchParams.get('letra')) || 1;
    setFontSize(letra);
    const id = parseInt(searchParams.get('id')) || 0;
    setId(id)
    setInList(searchParams.get('inList'))
    var selectedSongsUrl2=searchParams.get('selected')
    setSelectedSongsUrl(selectedSongsUrl2)
    const selectedPairs = selectedSongsUrl2.split('|').filter(pair => pair); // Filtra vacíos al final
    const currentIndex = selectedPairs.findIndex(pair => parseInt(pair.split('_')[0], 10) === id);
    if (currentIndex !== -1) {
      const nextPair = selectedPairs[(currentIndex + 1) % selectedPairs.length]; // Si es el último, volver al primero
      const [nextId, nextTone] = nextPair.split('_');
      setIdProxima(parseInt(nextId, 10));
      setTransportarProxima(parseInt(nextTone, 10));
    }


    const storedCanciones = JSON.parse(localStorage.getItem('canciones'));

    const cancionSelected = storedCanciones.find(cancion => cancion.id === id);

    if (cancionSelected != null) {
      try {
        const data=cancionSelected.acordes;
        setContenido(data);
        setTitulo(cancionSelected.nombre);
        setTonalidad(calcularTonalidadTranspuesta(cancionSelected.tonalidad, transportar))
        setComentario(cancionSelected.comentarios);
        setMelodias(cancionSelected.melodias);
        setTempo(cancionSelected.tempo);
        const acordesIniciales = procesarAcordes(data);
        const acordesConTransposicion = acordesIniciales.map(linea =>
          linea.map(acorde => transponerAcordeIndividual(acorde, transportar))
        );
        setAcordesTranspuestos(acordesConTransposicion);


      } catch (error) {
        console.error('Error al parsear la cookie:', error);
      }
    }
    else
    {
        fetch('https://x5tau7j9wk.execute-api.us-east-2.amazonaws.com/apiAlabanza/?id='+id)
          .then((response) => response.json())
          .then((data2) => {

            var data=JSON.parse(data2.body)
            Cookies.set(data.id, JSON.stringify(data), { expires: 365 });
            setTitulo(data.nombre);
            setTonalidad(calcularTonalidadTranspuesta(data.tonalidad, transportar))
            setContenido(data.acordes);
            setComentario(data.comentarios);
            setMelodias(data.melodias);
            setTempo(data.tempo);
            const acordesIniciales = procesarAcordes(data.acordes);
            const acordesConTransposicion = acordesIniciales.map(linea =>
              linea.map(acorde => transponerAcordeIndividual(acorde, transportar))
            );
            setAcordesTranspuestos(acordesConTransposicion);
          });
    }
  }, []);

useEffect(() => {
  // Crear el sintetizador tipo beep agudo
  metronomeSynth.current = new Tone.Synth({
    oscillator: {
      type: "square"  // suena más "clicky" que "sine"
    },
    envelope: {
      attack: 0.001,
      decay: 0.05,
      sustain: 0,
      release: 0.01
    },
    volume: -6  // volumen moderado
  }).toDestination();

  // Establecer tempo
  Tone.Transport.bpm.value = tempo;

  // Programar ticks del metrónomo
  Tone.Transport.scheduleRepeat((time) => {
    metronomeSynth.current.triggerAttackRelease("C6", "8n", time); // tono agudo tipo click
  }, "4n");

  // Cleanup al desmontar
  return () => {
    Tone.Transport.stop();
    Tone.Transport.cancel();
    if (metronomeSynth.current) {
      metronomeSynth.current.dispose();
    }
  };
}, [tempo]);


const subirSemitono = () => {
    setTransporte((prevTransporte) => prevTransporte + 1);
    transponerAcordes(1); // Mueve la llamada aquí
  };

  const bajarSemitono = () => {
    setTransporte((prevTransporte) => prevTransporte - 1);
    transponerAcordes(-1); // Mueve la llamada aquí
  };

  const procesarAcordes = (texto) => {
    const lineas = texto.split('\n');
    const resultado = [];

    lineas.forEach((linea) => {
      const acordes = [];
      linea.replace(/\[(.*?)\]/g, (match, acorde) => {
        acordes.push(acorde);
        return match;
      });
      resultado.push(acordes);
    });
    return resultado;
  };

  const transponerAcordeIndividual = (acorde, semitonos) => {
    const notaRegex = /([A-G][#b]?)(.*)/;
    const bajoRegex = /(.*)\/([A-G][#b]?)/;

    const matchBajo = acorde.match(bajoRegex);
    if (matchBajo) {
      const acordePrincipal = transponerAcordeIndividual(matchBajo[1], semitonos);
      const bajo = transponerNota(matchBajo[2], semitonos);
      return `${acordePrincipal}/${bajo}`;
    }

    const match = acorde.match(notaRegex);
    if (!match) return acorde;

    const rootNote = match[1];
    const alteration = match[2] || '';

    const nuevaNota = transponerNota(rootNote, semitonos);
    return `${nuevaNota}${alteration}`;
  };

  const transponerNota = (nota, semitonos) => {
    const notasBase = notas.includes(nota) ? notas : notasConBemoles;
    const index = notasBase.indexOf(nota);
    if (index === -1) return nota;

    const newIndex = (index + semitonos + 12) % 12;
    return notasBase[newIndex];
  };

  const transponerAcordes = (semitonos) => {
    setAcordesTranspuestos(acordesTranspuestos.map((linea) =>
      linea.map((acorde) => transponerAcordeIndividual(acorde, semitonos))
    ));
    const nuevaTonalidad = calcularTonalidadTranspuesta(tonalidad, semitonos);
    setTonalidad(nuevaTonalidad);
  };



  const procesarTexto = () => {
    const lineas = contenido.split('\n');
    const resultado = [];

    var elementosAcorde = [];
    var elementosLetra = [];

    lineas.forEach((linea, index) => {
      const acordes = acordesTranspuestos[index] || [];
      const textoConEspacios = linea.replace(/\[(.*?)\]/g, (match, acorde) => ' '.repeat(acorde.length));
      let keyCounter = 0;
      let posAcorde = 0;

      if(linea.length==0)
      {
       elementosAcorde.push(
            <span key={`espacio-${keyCounter++}`} className="prueba" style={{ minWidth: '1ch' }}>
              {' '}
            </span>
          );
          elementosLetra.push(
            <span key={`espacio-${keyCounter++}`}  className="prueba" style={{ minWidth: '1ch' }}>
              {' '}
            </span>
          );
      }

      if(acordes.length!=0)
      {
        for (let i = 0; i < linea.length; i++) {
              if (linea[i] === ' ') {
                elementosAcorde.push(
                    <span key={`acorde-${index}-${i}-${keyCounter++}`} className="acorde" style={{ minWidth: '1ch' }}>
                      {' '}
                    </span>
                  );
              }
              else
              {
                  const acorde = acordes[posAcorde++];
                  elementosAcorde.push(
                    <span key={`acorde-${index}-${i}-${keyCounter++}`} className="acorde" style={{ minWidth: `${acorde.length }ch` }}>
                      {acorde}
                    </span>
                  );
                 for (let j = i; j < linea.length; j++) {
                    if (linea[j] != ' ') {
                            elementosAcorde.push(
                            <span key={`acorde-${index}-${i}-${keyCounter++}`} className="acorde" style={{ minWidth: '1ch' }}>
                              {' '}
                            </span>
                          );
                          i++;
                    }
                    else
                    {
                    break;
                    }
                 }
              }
        }

      }
      else
      {
          for (let i = 0; i < linea.length; i++) {
              elementosLetra.push(
                <span key={`letra-${index}-${i}-${keyCounter++}`} className="letra" style={{ minWidth: '1ch' }}>
                  {linea[i]}
                </span>
              );
          }
      }

    if(elementosAcorde.length>0 && elementosLetra.length>0)
    {
        resultado.push(
            <div key={`linea-${index}`} className="cancion-linea">
              <div className="acordes">{elementosAcorde}</div>
              <div className="letras">{elementosLetra}</div>
            </div>
          );
         elementosAcorde=[];
         elementosLetra=[];
    }

    });

    return resultado;
  };

  const aumentarTamaño = () => {
    setFontSize((prevSize) => prevSize + 0.5);
  };

  const reducirTamaño = () => {
    setFontSize((prevSize) => Math.max(prevSize - 0.5, 0.5));
  };

  const calcularTonalidadTranspuesta = (nota, semitonos) => {
    const notasBase = notas.includes(nota) ? notas : notasConBemoles;
    const index = notasBase.indexOf(nota);
    if (index === -1) return nota;
    const newIndex = (index + semitonos + 12) % 12;
    return notasBase[newIndex];
  };
// --- Funciones para iniciar y detener el metrónomo ---
  const startMetronome = async () => {
    if (Tone.context.state !== 'running') {
      await Tone.start(); // Asegura que el contexto de audio esté activo
      console.log("Audio context started for metronome");
    }
    Tone.Transport.start();
    setIsMetronomePlaying(true);
  };

  const stopMetronome = () => {
    Tone.Transport.stop();
    setIsMetronomePlaying(false);
  };

const copiarLetraSinAcordes = () => {
  const lineas = contenido.split('\n');
  const lineasSinAcordes = lineas
    .map(linea => {
      const sinAcordes = linea.replace(/\[.*?\]/g, '*').trim();
      return sinAcordes;
    })
    .filter((linea, index, arr) => {
      if (linea.includes('*')) return false;
      return !(linea === '' && arr[index - 1] === '');
    });

  const textoFinal = lineasSinAcordes.join('\n');

  // Forzar foco por si ayuda en desktop
  window.focus();

  // Intentar usar Clipboard API
  if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    navigator.clipboard.writeText(textoFinal)
      .then(() => {
        alert('Letra copiada sin acordes 🎵');
      })
      .catch(err => {
        console.warn('Fallo Clipboard API, usando fallback', err);
        copiarFallback(textoFinal);
      });
  } else {
    copiarFallback(textoFinal);
  }
};

// Método alternativo para copiar con un textarea oculto (funciona en móvil)
const copiarFallback = (texto) => {
  const textarea = document.createElement('textarea');
  textarea.value = texto;
  textarea.style.position = 'fixed'; // Evita que se mueva con el scroll
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  try {
    const exito = document.execCommand('copy');
    alert('Letra copiada sin acordes 🎵 (modo alternativo)');
  } catch (err) {
    alert('No se pudo copiar la letra');
    console.error('Fallback de copia falló:', err);
  }
  document.body.removeChild(textarea);
};

  return (
    <div className="App" style={{ fontSize: `${fontSize}rem` }}>

        <ul className="nav nav-pills nav-justified">
          <li className="nav-item">
            <button
                className="btn btn-dark"
                onClick={() => {
                  window.location.href = `/alabanza/acordes?id=${idProxima}&transportar=${transportarProxima}&selected=${selectedSongsUrl}`;
                }}
              >
                Proxima
              </button>
          </li>
           <li className="nav-item">
            <button className="btn btn-success" onClick={copiarLetraSinAcordes}>
              Copiar Letra
            </button>
          </li>
          <li className="nav-item">
            <button className="btn btn-primary mb-2" onClick={subirSemitono}>Semitono(+)</button>
            <button className="btn btn-primary" onClick={bajarSemitono}>Semitono(-)</button>
          </li>

          <li className="nav-item dropdown">
            <button className="btn btn-info dropdown-toggle" data-bs-toggle="dropdown">
                Tamaño
            </button>
            <ul className="dropdown-menu">
                <li>
                    <button className="dropdown-item" onClick={aumentarTamaño}>
                        Aumentar Tamaño
                    </button>
                </li>
                <li>
                  <button className="dropdown-item" onClick={reducirTamaño}>
                    Reducir Tamaño
                  </button>
                </li>
            </ul>
          </li>
          <li>
            {!isMetronomePlaying ? (
                  <button onClick={startMetronome} className='btn btn-secondary'>
                    Metrónomo
                  </button>
                ) : (
                  <button onClick={stopMetronome} className='btn btn-danger'>
                    Metrónomo
                  </button>
                )}
          </li>
          <li className="nav-item">
            <Link to={`/alabanza/edicion?id=${id}`} className="btn btn-warning">Editar</Link>
          </li>
          <li className="nav-item">
            <button
                className="btn btn-dark"
                onClick={() => {
                    if(inList==null)
                    {
                       window.location.href = `/alabanza/?selected=${selectedSongsUrl}`;
                    }
                    else
                    {
                        window.location.href = `/alabanza/`;
                    }
                }}
              >
                Volver
              </button>
          </li>

       </ul>
       <br/><br/>
       {comentario && (
            <div className="alert alert-primary" role="alert">
              {comentario}
            </div>
       )}
        <br/><br/>
      <h1 className="alabanza-song-title">{titulo} ({tonalidad})</h1>
      <br/>

    <br/><br/>
      <div>{contenido && procesarTexto()}</div>
        <br/><br/>
      {melodias && <div className="alert alert-primary" role="alert"> <MidiReproductor texto={melodias} tempoEnviado={tempo} transportarProxima={transporte} /> </div>}



    </div>

  );
}

export default PantallaAcordes;