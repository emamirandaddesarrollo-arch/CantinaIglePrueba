import React, { useState, useEffect, useRef } from 'react';
import Soundfont from 'soundfont-player';
import axios from 'axios';

function MidiGenerator({tempoEnviado}) {

  const [transportarProxima, setTransportarProxima] = useState(0);
  const [cambioTonalidad, setCambioTonalidad] = useState(0);
  const [instrumento, setInstrumento] = useState(null);
  const [textoAcordes, setTextoAcordes] = useState("[F-n-4]");
  const [textoNotas, setTextoNotas] = useState("[S-4][Fm-5-b]");
  const audioContext = useRef(null);
  const [tempo, setTempo] = useState(tempoEnviado);
  const [nombreParte, setNombreParte] = useState("Estribillo 1 Voz");
  const [duracionSemiCorchea, setDuracionSemiCorchea] = useState((60 / tempoEnviado) * 1000 / 4);



  useEffect(() => {
    audioContext.current = new AudioContext();
    Soundfont.instrument(audioContext.current, 'acoustic_grand_piano').then((instrument) => {
      setInstrumento(instrument);
    });
  }, []);

    useEffect(() => {
    setTempo(tempoEnviado);
    setDuracionSemiCorchea((60 / tempo) * 1000 / 4);
  }, [tempoEnviado]);

   useEffect(() => {
    setCambioTonalidad(transportarProxima);
  }, [transportarProxima]);

const handleGenerarTexto = () => {
    const textoGenerado = '%' + nombreParte + '%' + '\n' + textoAcordes + '\n' + '@' + textoNotas;
    console.log(textoGenerado);

    const textArea = document.createElement('textarea');
    textArea.value = textoGenerado;
    document.body.appendChild(textArea);
    textArea.select();

    try {
        const successful = document.execCommand('copy');
        const msg = successful ? 'Texto copiado al portapapeles' : 'Error al copiar el texto';
        console.log(msg);
        alert(msg);
    } catch (err) {
        console.error('Error al copiar el texto: ', err);
        alert('Error al copiar el texto: ' + err);
    }

    document.body.removeChild(textArea);
};

 const handleReproducir = () => {
    if (!instrumento) return;

    const notas = textoAcordes.split(']').filter(Boolean).map((nota) => nota.replace('[', '').trim());

    let duracionTotal = 0;

    notas.forEach((nota) => {
        if(nota!='')
        {
            const [notaTexto, figuraTexto, repeticionNota] = nota.split('-');
            duracionTotal = duracionTotal + obtenerDuracionEnSemicorchea(figuraTexto) * repeticionNota;//semicorcheas
        }
     });
     const arregloCancionGeneral = new Array(duracionTotal)

     agregarMelodia(arregloCancionGeneral, notas, true);

     const notas2 = textoNotas.split(']').filter(Boolean).map((nota) => nota.replace('[', '').trim());

     agregarMelodia(arregloCancionGeneral, notas2, false);

     console.log(duracionSemiCorchea)
     reproducirMelodia(arregloCancionGeneral, duracionSemiCorchea);

  };

 const reproducirMelodia = (arregloCancionGeneral, duracionSemiCorchea)=>
 {
    for (let i = 0; i<arregloCancionGeneral.length; i++){
        if(arregloCancionGeneral[i]!= null)
        {
            for(let j=0; j<arregloCancionGeneral[i].length; j++)
            {
                instrumento.play(arregloCancionGeneral[i][j].nota, audioContext.current.currentTime + i * duracionSemiCorchea / 1000, {
                    duration: arregloCancionGeneral[i][j].duracion * duracionSemiCorchea / 1000,
                });
            }
        }
     }
 }

 const agregarMelodia = (arregloCancionGeneral, notas, esAcorde) =>
 {
    var index=0;
    if(esAcorde)
    {
        notas.forEach((nota) => {
            const [notaTexto, figuraTexto, repeticionNota] = nota.split('-');

            const notaMidi = obtenerNotaMidiAcorde(notaTexto) + transportarProxima;

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
            const notaMidi = obtenerNotaMidi(notaTexto, parseInt(octavaTexto)) + transportarProxima;
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

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px'}}>
      <h2 style={{ textAlign: 'center' }}>Crear Parte Cancion</h2>

      <div style={{ marginBottom: '15px' }}>
        <label htmlFor="nombreParte" style={{ display: 'block', marginBottom: '5px' }}>Nombre de la Parte:</label>
        <input
          type="text"
          id="nombreParte"
          value={nombreParte}
          onChange={(e) => setNombreParte(e.target.value)}
          style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
        />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label htmlFor="textoAcordes" style={{ display: 'block', marginBottom: '5px' }}>Base de la Parte (Acordes): ej [F-n-8] (fa mayor, en negras, 8 veces)</label>
        <textarea
          id="textoAcordes"
          value={textoAcordes}
          onChange={(e) => setTextoAcordes(e.target.value)}
          rows={4}
          style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label htmlFor="textoNotas" style={{ display: 'block', marginBottom: '5px' }}>Notas de la Parte: ej [C-5-b] (Do, 5ta octava, blancas), [S-24] (silencio 24 corcheas) </label>
        <textarea
          id="textoNotas"
          value={textoNotas}
          onChange={(e) => setTextoNotas(e.target.value)}
          rows={4}
          style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
        />
      </div>
      <div style={{ marginBottom: '20px' }}>
        <label htmlFor="textoNotas" style={{ display: 'block', marginBottom: '5px' }}>Espacio de texto auxiliar:</label>
        <textarea
          rows={8}
          style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
        />
      </div>

      <div style={{ textAlign: 'center' }}>
        <button onClick={handleReproducir} style={{ padding: '10px 40px', marginRight: '40px'}}>Reproducir</button>
        <button onClick={handleGenerarTexto} style={{ padding: '10px 40px' }}>Generar Texto</button>
      </div>
    </div>
  );
}

export default MidiGenerator;