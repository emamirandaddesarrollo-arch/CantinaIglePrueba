import React, { useState, useEffect } from 'react';
import axios from 'axios';  // Importa axios
import ListaCanciones from './ListaCanciones';
import CancionesSeleccionadas from './CancionesSeleccionadas';
import { Link, useNavigate } from 'react-router-dom';


function ListadoCanciones() {
  const navigate = useNavigate();
  const [canciones, setCanciones] = useState([]);  // Inicializa como un array vacío
  const tonalidades = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const [selectedSongs, setSelectedSongs] = useState([]);
  const [filters, setFilters] = useState({ nombre: '', autor: '', categoria: '', acordes: '' });
  const [selectedSongsUrl, setSelectedSongsUrl] = useState([]);
  const [isReload, setIsReload] = useState(false);

useEffect(() => {
  const fetchCanciones = async () => {
    const searchParams = new URLSearchParams(window.location.search);
    setSelectedSongsUrl(searchParams.get('selected'));
    const isr=searchParams.get('isReload');
    if(isr=='true')
    {
        setIsReload(true)
    }
    else
    {
        setIsReload(false)
    }



    const storedCanciones = JSON.parse(localStorage.getItem('canciones'));
    try {
    if (!storedCanciones) {  // No hay cookies, realizamos la solicitud
        try {
            const response = await axios.get('https://x5tau7j9wk.execute-api.us-east-2.amazonaws.com/apiAlabanza');
            const cancionesArray = JSON.parse(response.data.body);
            if (Array.isArray(cancionesArray)) {
                const cancionesConTone = cancionesArray.map(cancion => ({
                  ...cancion,
                  tone: 0
                }));
                localStorage.setItem('canciones', JSON.stringify(cancionesConTone));
                setCanciones(cancionesConTone);
                selectedParameters();
              } else {
                console.error('La respuesta no es un array:', response.data);
              }
        }
        catch(ex)
        {
            console.log(ex)
        }
    }
    else
    {
        setCanciones(storedCanciones);
    }
    } catch (error) {
      console.error('Error al obtener las canciones:', error);
    }
  };

  fetchCanciones();
}, []);


  useEffect(() => {
    selectedParameters()
  }, [canciones]);

const selectedParameters = () => {
    if (canciones !== undefined && canciones.length > 0) {
        const params = new URLSearchParams(window.location.search);
        const selectedParam = params.get('selected');
        if (selectedParam) {
            const selectedIdsAndTones = selectedParam.split('|').map(item => item.split('_'));
            const newSelectedSongs = selectedIdsAndTones
                .map(([id, tone]) => {
                    const cancion = canciones.find(c => c.id == id);
                    if (cancion) {
                        return {
                            ...cancion,
                            tone: parseInt(tone, 10),
                            tonalidad: cambiarTonalidadLetra(cancion.tonalidad, parseInt(tone, 10))
                        };
                    }
                    return null;
                })
                .filter(item => item !== null); // Filtrar solo los objetos actualizados

            setSelectedSongs(newSelectedSongs);
            if(newSelectedSongs.length!=selectedIdsAndTones.length-1 && !isReload)
            {
                localStorage.removeItem('canciones');
                navigate('/alabanza/?isReload=true&selected=' + selectedParam);
                window.location.reload();
            }
        }
    }
};


const borrarCookies = () => {
    localStorage.removeItem('canciones');
    guardarUrl();

};

  const agregarCancion = (id) => {
    const cancion = canciones.find(song => song.id === id);
    if (cancion && !selectedSongs.some(song => song.id === id)) {
      setSelectedSongs([...selectedSongs, cancion]);
    }
  };

  const eliminarCancion = (id) => {
    setSelectedSongs(selectedSongs.filter(song => song.id !== id));
  };

  const moverCancion = (id, direction) => {
    const index = selectedSongs.findIndex(song => song.id === id);
    if (index === -1) return;

    const newSelectedSongs = [...selectedSongs];
    if (direction === 'up' && index > 0) {
      [newSelectedSongs[index - 1], newSelectedSongs[index]] = [newSelectedSongs[index], newSelectedSongs[index - 1]];
    } else if (direction === 'down' && index < newSelectedSongs.length - 1) {
      [newSelectedSongs[index], newSelectedSongs[index + 1]] = [newSelectedSongs[index + 1], newSelectedSongs[index]];
    }
    setSelectedSongs(newSelectedSongs);
  };

  const guardarUrl = () => {
    const cadenasCanciones = [];
    selectedSongs.forEach(cancion => {
      var { id, tone } = cancion;
      if(tone==undefined || isNaN(tone))
      {
        tone=0
      }
      const cadenaCancion = `${id}_${tone}|`;
      cadenasCanciones.push(cadenaCancion);
    });

    const stringFinal = cadenasCanciones.join('');
    navigate('/alabanza/?selected=' + stringFinal);
    window.location.reload();
  };

  const linkYoutube = () => {
  const youtubeVideoIds = []; // Arreglo para los IDs de YouTube

  selectedSongs.forEach(cancion => {
    // Solo desestructuramos 'youtube', ignorando 'id' y 'tone'
    const { youtube } = cancion;

    // Lógica para extraer el ID de YouTube
    if (youtube) {
      try {
        const url = new URL(youtube);
        const videoId = url.searchParams.get('v');
        if (videoId) {
          youtubeVideoIds.push(videoId);
        }
      } catch (error) {
        console.error("Error al parsear la URL de YouTube:", youtube, error);
      }
    }
  });

  const youtubeIdsString = youtubeVideoIds.join(','); // Une los IDs con comas

  // Construye la URL final de YouTube
  const youtubeUrl = `https://www.youtube.com/watch_videos?video_ids=` + youtubeIdsString;

  // Aquí decides cómo manejar la URL generada:
  // Opción 1: Navegar directamente a esa URL (el navegador saldrá de tu app)
  window.location.href = youtubeUrl;

  // Opción 2 (menos común si el objetivo es ir directamente a YouTube):
  // Pasarla como un parámetro a otra ruta de tu aplicación (si tienes una).
  // Si no tienes una ruta que maneje este parámetro, esta línea no hará lo que esperas.
  // navigate('/alguna-ruta-en-tu-app?youtube_url=' + encodeURIComponent(youtubeUrl));

  // La recarga de la página ya no sería necesaria si navegas a una URL externa.
  // window.location.reload(); // Generalmente no se usa con window.location.href
};

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  const filteredCanciones = canciones.filter(song =>
    song.nombre.toLowerCase().includes(filters.nombre.toLowerCase()) &&
    song.autor.toLowerCase().includes(filters.autor.toLowerCase()) &&
    song.categoria.toLowerCase().includes(filters.categoria.toLowerCase()) &&
    song.acordes.toLowerCase().includes(filters.acordes.toLowerCase())
  );

  const cambiarTonalidadSeleccionada = (id, direction) => {
    setSelectedSongs(selectedSongs.map(song => {
      if (song.id === id) {
        const nuevaTonalidad = cambiarTonalidad(song.tonalidad, direction);
        return {
          ...song,
          tonalidad: nuevaTonalidad,
          tone: song.tone + (direction === 'up' ? 1 : -1)
        };
      }
      return song;
    }));
  };

  function cambiarTonalidad(actual, direccion) {
    const index = tonalidades.indexOf(actual);
    if (index === -1) return actual; // Retorna la tonalidad actual si no está en el array

    // Determina la nueva tonalidad dependiendo de la dirección
    let nuevoIndex;
    if (direccion === 'up') {
      nuevoIndex = (index + 1) % tonalidades.length;
    } else if (direccion === 'down') {
      nuevoIndex = (index - 1 + tonalidades.length) % tonalidades.length;
    }
    return tonalidades[nuevoIndex];
  }

  function cambiarTonalidadLetra(actual, valor) {
    const index = tonalidades.indexOf(actual);
    if (index === -1) return actual; // Retorna la tonalidad actual si no está en el array
    let nuevoIndex = (index + valor) % tonalidades.length;
    if (nuevoIndex < 0) nuevoIndex = tonalidades.length + nuevoIndex;
    return tonalidades[nuevoIndex];
  }

  return (
    <div className="container">

      <h1 className="display-4 text-center my-4">Canciones del Grupo de Alabanza</h1>
      {selectedSongs.length > 0 && (
        <CancionesSeleccionadas
          selectedSongs={selectedSongs}
          eliminarCancion={eliminarCancion}
          moverCancion={moverCancion}
          cambiarTonalidadSeleccionada={cambiarTonalidadSeleccionada}
          guardarUrl={guardarUrl}
          selectedSongsUrl={selectedSongsUrl}
          linkYoutube={linkYoutube}
        />
      )}
      <ListaCanciones
        canciones={filteredCanciones}
        agregarCancion={agregarCancion}
        filters={filters}
        handleFilterChange={handleFilterChange}
        borrarCookies={borrarCookies}
      />
    </div>
  );
}

export default ListadoCanciones;
