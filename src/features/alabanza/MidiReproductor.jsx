import React, { useState, useEffect, useRef } from 'react';
import Soundfont from 'soundfont-player';
import * as Tone from 'tone'; // Importa Tone.js

function MidiGenerator({tempoEnviado, texto, transportarProxima }) {

  const [cambioTonalidad, setCambioTonalidad] = useState(transportarProxima);
  const [instrumento, setInstrumento] = useState(null);
  const audioContext = useRef(null);
  const [tempo, setTempo] = useState(tempoEnviado);
  const [duracionSemiCorchea, setDuracionSemiCorchea] = useState((60 / tempoEnviado) * 1000 / 4);
  const [seccion, setSeccion] = useState([]);
  const [iphoneMode, setIphoneMode] = useState(false); // Estado para el modo iPhone
  const [toneInstrument, setToneInstrument] = useState(null); // Estado para el instrumento de Tone.js



useEffect(() => {
        audioContext.current = new AudioContext();
        Soundfont.instrument(audioContext.current, 'acoustic_grand_piano').then((instrument) => {
            setInstrumento(instrument);
        });

        // Inicializa Tone.js solo si iphoneMode es true
        if (iphoneMode) {
            Tone.start();
            const synth = new Tone.PolySynth(Tone.Synth).toDestination();
            setToneInstrument(synth);
        }
    }, [iphoneMode]); // Dependencia en iphoneMode

      useEffect(() => {
        setTempo(tempoEnviado);
        setDuracionSemiCorchea((60 / tempo) * 1000 / 4);
    }, [tempoEnviado, tempo]);

   useEffect(() => {
        setCambioTonalidad(transportarProxima);
    }, [transportarProxima]);

    const handleReproducir = (notas, acordes) => {
        if (iphoneMode) {
            reproducirMelodiaTone(notas, acordes);
        } else {
            reproducirMelodiaSoundfont(notas, acordes);
        }
    };

     const reproducirMelodiaSoundfont = (notas, acordes) => {
        if (!instrumento) return;

        let duracionTotal = 0;
        const acordesCancion = acordes.split(']').filter(Boolean).map((nota) => nota.replace('[', '').trim());
        acordesCancion.forEach((nota) => {
            if (nota !== '') {
                const [notaTexto, figuraTexto, repeticionNota] = nota.split('-');
                duracionTotal = duracionTotal + obtenerDuracionEnSemicorchea(figuraTexto) * repeticionNota;//semicorcheas
            }
        });
        const arregloCancionGeneral = new Array(duracionTotal);

        agregarMelodia(arregloCancionGeneral, acordesCancion, true);

        const notas2 = notas.split(']').filter(Boolean).map((nota) => nota.replace('[', '').trim());

        agregarMelodia(arregloCancionGeneral, notas2, false);

        reproducirMelodia(arregloCancionGeneral, duracionSemiCorchea);
    };

    const reproducirMelodiaTone = (notas, acordes) => {
        if (!toneInstrument) return;

        let duracionTotal = 0;
        const acordesCancion = acordes.split(']').filter(Boolean).map((nota) => nota.replace('[', '').trim());
        acordesCancion.forEach((nota) => {
            if (nota !== '') {
                const [notaTexto, figuraTexto, repeticionNota] = nota.split('-');
                duracionTotal = duracionTotal + obtenerDuracionEnSemicorchea(figuraTexto) * repeticionNota;//semicorcheas
            }
        });
        const arregloCancionGeneral = new Array(duracionTotal);

        agregarMelodia(arregloCancionGeneral, acordesCancion, true);

        const notas2 = notas.split(']').filter(Boolean).map((nota) => nota.replace('[', '').trim());

        agregarMelodia(arregloCancionGeneral, notas2, false);

        reproducirMelodiaToneJs(arregloCancionGeneral, duracionSemiCorchea);
    };

    const reproducirMelodiaToneJs = (arregloCancionGeneral, duracionSemiCorchea) => {
        const now = Tone.now();
        for (let i = 0; i < arregloCancionGeneral.length; i++) {
            if (arregloCancionGeneral[i] != null) {
                for (let j = 0; j < arregloCancionGeneral[i].length; j++) {
                    const notaMidi = arregloCancionGeneral[i][j].nota;
                    const notaFrecuencia = Tone.Frequency(notaMidi, 'midi').toFrequency();
                    const duracionSegundos = arregloCancionGeneral[i][j].duracion * duracionSemiCorchea / 1000;
                    toneInstrument.triggerAttackRelease(notaFrecuencia, duracionSegundos, now + i * duracionSemiCorchea / 1000);
                }
            }
        }
    };

    const reproducirMelodia = (arregloCancionGeneral, duracionSemiCorchea) => {
        const jsonMidi = [];
        for (let i = 0; i < arregloCancionGeneral.length; i++) {
            if (arregloCancionGeneral[i] != null) {
                for (let j = 0; j < arregloCancionGeneral[i].length; j++) {
                    const notaMidi = arregloCancionGeneral[i][j].nota;
                    const tiempoInicioSegundos = audioContext.current.currentTime + i * duracionSemiCorchea / 1000;
                    const duracionSegundos = arregloCancionGeneral[i][j].duracion * duracionSemiCorchea / 1000;

                    instrumento.play(notaMidi, tiempoInicioSegundos, { duration: duracionSegundos });
                }
            }
        }
    };



 const agregarMelodia = (arregloCancionGeneral, notas, esAcorde) =>
 {
    var index=0;
    if(esAcorde)
    {
        notas.forEach((nota) => {
            const [notaTexto, figuraTexto, repeticionNota] = nota.split('-');

            const notaMidi = obtenerNotaMidiAcorde(notaTexto) + cambioTonalidad;

            const duracion = obtenerDuracionEnSemicorchea(figuraTexto);

             for (let i = 0; i<repeticionNota; i++){

                if(arregloCancionGeneral[index]==null)
                {
                    arregloCancionGeneral[index]=new Array();
                }

                arregloCancionGeneral[index].push({nota: notaMidi, duracion: duracion  });

                if (notaTexto.includes('m'))
                {
                    arregloCancionGeneral[index].push({nota: notaMidi+3, duracion: duracion  });
                }
                else
                {
                 arregloCancionGeneral[index].push({nota: notaMidi+4, duracion: duracion  });
                }

                arregloCancionGeneral[index].push({nota: notaMidi+7, duracion: duracion });
                index=index+duracion;
                }
              });
    }
    else
    {
        notas.forEach((nota) => {
          const [notaTexto, octavaTexto, duracionTexto] = nota.split('-');
          if (notaTexto === 'S') {
            index=index+obtenerDuracionEnSemicorchea(octavaTexto);//aca es poroque es el segundo
            return;
          }
          else
          {
            const notaMidi = obtenerNotaMidi(notaTexto, parseInt(octavaTexto));
            const duracion = obtenerDuracionEnSemicorchea(duracionTexto);

             if(arregloCancionGeneral[index]==null)
              {
                  arregloCancionGeneral[index]=new Array();
              }

            arregloCancionGeneral[index].push({nota: notaMidi, duracion: duracion  });

            index=index+duracion;
          }

        });
    }
 }
 const obtenerNotaMidiAcorde = (notaTexto) => {
  const notasMidi = {
    'C': 0,
    'C#': 1,
    'D': 2,
    'D#': 3,
    'E': 4,
    'F': 5,
    'F#': 6,
    'G': 7,
    'G#': 8,
    'A': 9,
    'A#': 10,
    'B': 11,
    'Cm': 0,
    'C#m': 1,
    'Dm': 2,
    'D#m': 3,
    'Em': 4,
    'Fm': 5,
    'F#m': 6,
    'Gm': 7,
    'G#m': 8,
    'Am': 9,
    'A#m': 10,
    'Bm': 11,
  };
  return notasMidi[notaTexto] +  48;
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
    return notasMidi[notaTexto] + (octava + 1) * 12;
  };

 const obtenerDuracionEnSemicorchea = (duracionTexto) => {
  const duraciones = {
    r: 16,
    b: 8,
    n: 4,
    c: 2,
    sc: 1,
  };

  const duracion = duraciones[duracionTexto];

  if (duracion === undefined) {
    const numero = parseInt(duracionTexto);

    if (!isNaN(numero)) {
      return numero;
    }
  }
  return duracion;
};

  useEffect(() => {
    if (!texto) { // Verifica si texto es null o undefined
      setSeccion([]); // Establece seccion como un array vacío si texto es nulo
      return; // Detiene la ejecución si texto es nulo
    }

    const secciones = [];
    const regex = /%([^%]*)%/g;
    let match;
    let lastIndex = 0;

    let seccion =  separarSecuencias(texto);

    setSeccion(seccion);

    for(let i=0; i<seccion.length; i++)
    {
        let nuevasNotas = procesarNotas(seccion[i].notas);
        seccion[i].notas=nuevasNotas;
    }

  }, [texto, cambioTonalidad]);

  function procesarNotas(textoNotas) {
  const notas = textoNotas.match(/\[.*?\]/g);
  var nuevasNotas='';

  if (notas) {
    notas.forEach((nota) => {
      const contenido = transponerNotas(nota, cambioTonalidad); // Llama al método nuevo con cada nota
      if(contenido.includes('S'))
      {
        nuevasNotas=nuevasNotas+contenido+'\n'+'\n';
      }
      else
      {
        nuevasNotas=nuevasNotas+contenido;
      }

    });
  }
  return nuevasNotas;
};


const separarSecuencias = (texto) => {
  const secuencias = [];
  const partes = texto.split('%');

  for (let i = 1; i < partes.length; i += 2) {
    const nombre = partes[i].trim();
    const acordesNotas = partes[i + 1].split('@');
    const acordes = acordesNotas[0].trim();
    const notas = acordesNotas[1].trim();

    console.log(notas);
    secuencias.push({ nombre, acordes, notas });
  }

  return secuencias;
};


  function transponerNotas(texto, transporte) {
  const notas = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  const transponerNota = (nota, octava, semitonos) => {

    let index = notas.indexOf(nota);
    if (index === -1) return { nota, octava }; // Si no es una nota válida, devuelve la misma nota

    let nuevoIndex = (index + semitonos) % 12;
    if (nuevoIndex < 0) nuevoIndex += 12; // Asegura que el índice sea positivo

    let nuevaOctava = octava + Math.floor((index + semitonos) / 12);

    return { nota: notas[nuevoIndex], octava: nuevaOctava };
  };

  const regex = /\[([A-G]#?)-(\d+)-([a-z]+)\]/g;
  return texto.replace(regex, (match, nota, octava, figura) => {
    const { nota: nuevaNota, octava: nuevaOctava } = transponerNota(nota, parseInt(octava), transporte);
    return `[${nuevaNota}-${nuevaOctava}-${figura}]`;
  });
}


return (
  <div>
   <button onClick={() => setIphoneMode(!iphoneMode)} className='btn btn-warning'>
        {iphoneMode ? 'Desactivar Sonido iPhone' : 'Activar Sonido iPhone'}
    </button>
    <br/><br/>
    {seccion.map((item, index) => (
      <div key={index} className="alabanza-midi-section">
        <div className="alabanza-midi-section-header">
          <div className="alabanza-midi-section-title">{item.nombre}</div>
          <div className="alabanza-midi-actions">
            <button
              type="button"
              className="btn btn-outline-primary"
              onClick={handleReproducir.bind(null, item.notas, "")}
            >
              Solo melodía
            </button>
            <button
              type="button"
              className="btn btn-outline-success"
              onClick={handleReproducir.bind(null, "", item.acordes)}
            >
              Solo acordes
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleReproducir.bind(null, item.notas, item.acordes)}
            >
              Melodía + acordes
            </button>
          </div>
        </div>
        <textarea
          value={item.notas}
          readOnly
          rows={10}
          style={{ width: '100%', marginTop: '10px', boxSizing: 'border-box' }}
        />
        <br />
        <br />
      </div>
    ))}
  </div>
);
}

export default MidiGenerator;