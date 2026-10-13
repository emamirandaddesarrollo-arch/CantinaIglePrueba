import React, { useState, useEffect , useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Form, Button } from 'react-bootstrap';
import { Modal } from 'react-bootstrap';
import MidiGenerator from './MidiGenerator';




function EdicionCanciones() {
    const [searchParams] = useSearchParams();  // Obtener el id desde la URL
    const navigate = useNavigate();  // Cambiado useHistory por useNavigate
    const id = searchParams.get('id');
    const [textoMidi, setTextoMidi] = useState('');
    const [instrumento, setInstrumento] = useState(null);
    const audioContext = useRef(null);
    const notas = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'];
    const [showModalComentarios, setShowModalComentarios] = useState(false);
    const [showModalMelodias, setShowModalMelodias] = useState(false);
    const [showModalAcordes, setShowModalAcordes] = useState(false);
    const [resultado, setResultado] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [urlAcorde, setUrlAcorde] = useState('');

    // Estado inicial del formulario
    const [cancion, setCancion] = useState({
        id: 0,
        nombre: '',
        autor: '',
        categoria: '',
        tempo: '',
        tonalidad: '',
        youtube: '',
        acordes: '',
        comentarios: '',
        melodias: ''
    });


    const generarCifrado = async () => {
    setLoading(true);
    setError('');
    setResultado('');
    var textoCrudo;

    try {
    const url = urlAcorde.trim();
    if (!url) {
      throw new Error('Ingresá una URL de Lacuerda o Cifra Club para usar la búsqueda por IA.');
    }
    if (!url.includes('lacuerda.net') && !url.includes('cifraclub')) {
      throw new Error('La búsqueda por IA solo admite URLs de Lacuerda o Cifra Club.');
    }

    if (url.includes('lacuerda.net')) {
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
      console.log('Fetching from URL:', proxyUrl);
      const responseTest = await fetch(proxyUrl, { method: 'GET' });  // Sin headers extras
      const html = await responseTest.text();

      // 2. Parsear el HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // 3. Extraer el div con id="t_body"
      const tBodyDiv = doc.getElementById('t_body');

      if (!tBodyDiv) {
        throw new Error('No se encontró el div con id="t_body". ¿Es la URL correcta de lacuerda.net?');
      }

      // 4. Obtener solo el texto (acordes + letra) limpio
      textoCrudo = tBodyDiv.textContent || tBodyDiv.innerText || '';
    }

    if (url.includes('cifraclub')) {
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
      console.log('Fetching from URL:', proxyUrl);
      const responseTest = await fetch(proxyUrl, { method: 'GET' });  // Sin headers extras
      const html = await responseTest.text();

      // 2. Parsear el HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // 3. Buscar elementos <pre> (CifraClub suele usar <pre> para mostrar el cifrado)
      // Usamos querySelectorAll para obtener todos los <pre> y concatenar su contenido
      const preElems = doc.querySelectorAll('pre');

      if (!preElems || preElems.length === 0) {
        throw new Error('No se encontraron elementos <pre> en la página. ¿Es la URL correcta de cifraclub?');
      }

      // Concatenar el HTML/texto interno de todos los <pre>, separando bloques por doble salto
      const combined = Array.from(preElems)
        .map(el => (el.innerHTML || el.textContent || '').trim())
        .filter(Boolean)
        .join('\n\n');

      textoCrudo = combined;
    }





    // Construye el prompt maestro exactamente como el tuyo
    const prompt = `Eres un experto en cifrado de canciones cristianas y worship en español. Tarea estricta:
    1. Analiza el HTML proporcionado a continuación para extraer la letra de la canción y los acordes.
    2. Usa exactamente los acordes que aparecen en el HTML.
       estas reglas son obligatorias:
          - Convertir todos los bemoles a sostenidos
          - Acordes entre corchetes [G] [A#m]
          - Cifrado americano. sin abreviaciones ni aclaraciones
          - Alineación perfecta con espacios
          - Sin guiones en la letra
          - Sin títulos de sección (Verso, Coro, etc.)
          - Todo dentro de un bloque de código markdown (pero SIN poner \\\\ dentro del string, solo el texto limpio)
          - El texto debe empezar directamente con [Acorde] y letra, sin saltos de línea ni espacios al principio ni al final.
          - Debe haber una línea de acordes seguida inmediatamente por una línea de letra. Se pueden dejar líneas en blanco entre versos, pero no espacios innecesarios.
          - En caso de que haya intro o interludios instrumentales, inclúyelos con los acordes correspondientes y la indicación [Instrumental] en la línea de letra.
          - no puede haber letra sin acorde encima, en caso de no tener acorde poner el ultimo acorde usado en la linea de arriba.
          - no puede haber acordes sin letra debajo, en caso de no tener letra poner Instrumental en la linea de abajo.
          - en la linea de acordes no poner ningun otro texto que no sea acorde.
          - no puede haber acorde sin corchetes.
          - si aparece una introduccion al principio de la cancion, poner los acordes correspondientes y en la linea de abajo poner [Instrumental]
            ¡IMPORTANTE!
            - una vez finalizado, revisar que no exista dos lineas consecutivas de acordes o dos lineas consecutivas de letra.
            - NO inventes nada si no lo puedes extraer del HTML.
            - El campo acordes debe empezar directamente con [Acorde] y letra, sin \\\\\ al principio ni al final.
            HTML proporcionado:
            ${textoCrudo}


`;

      const response = await fetch('/api/generate-chords', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',  // O 'grok-3' si preferís el más barato/gratis
          messages: [ {
                        "role": "system",
                        "content": "Eres un transcriptor extremadamente estricto de acordes cristianos. NUNCA inventas canciones ni acordes. Solo usas los datos extraídos del HTML proporcionado en el mensaje del usuario. Si no puedes extraer la información completa y precisa del HTML, respondes el JSON de 'No encontrado'. Sigues el formato al 100% sin agregar texto extra."
                      },
                      { role: 'user', content: prompt }],
          temperature: 0.1,  // Baja para respuestas más precisas
          max_tokens: 2500,  // Suficiente para canciones largas
        }),
      });

      if (!response.ok) {
        throw new Error('El servicio seguro de IA no está disponible. Podés ingresar los acordes manualmente.');
      }
      const data = await response.json();


        let content2 = data.choices[0].message.content.trim();

        // Si empieza con ```json o ```, quitamos bloques
        if (content2.startsWith('```')) {
            content2 = content2.replace(/^```json?\n?/, '').replace(/\n?```$/, '').trim();
        }
        let cleanString = content2.trim().replace(/^"|"$/g, '');

        let fixedJsonString = cleanString.replace(
          /"acordes":\s*`(.*?)`/s,
          (match, p1) => {
            // Escapar saltos de línea (\n) y comillas dobles (") en el contenido capturado
            let escapedContent = p1.replace(/\\/g, '\\\\') // Escapar barras invertidas existentes
                                      .replace(/"/g, '\\"') // Escapar comillas dobles
                                      .replace(/\n/g, '\\n') // Escapar saltos de línea
                                      .trim();
            return `"acordes": "${escapedContent}"`;
          }
        );





        if (typeof fixedJsonString === 'string') {
            fixedJsonString = fixedJsonString
            .replace(/^```[\w]*\n?/, '')   // Quita ``` al principio (con o sin lenguaje)
            .replace(/\n?```$/g, '')       // Quita ``` al final
            .trim();                       // Quita espacios/saltos extra
        }

        setCancion(current => ({ ...current, acordes: fixedJsonString }));

    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron obtener los acordes. Revisá la URL y la conexión.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

    // Cargar los datos si hay un ID en la URL (modo edición)
    useEffect(() => {
        if (id) {
            axios.get('https://x5tau7j9wk.execute-api.us-east-2.amazonaws.com/apiAlabanza?id='+id)
                .then(response => {
                    setCancion(JSON.parse(response.data.body));
                })
                .catch(error => {
                    console.error('Error al cargar la canción', error);
                });
        }
    }, [id]);

    // Manejar cambios en los campos del formulario
    const handleChange = (e) => {
        const { name, value } = e.target;
        setCancion({
            ...cancion,
            [name]: value
        });
    };

    const handleChange2 = (e) => {
        const { name, value } = e.target;
        setUrlAcorde(value);
    };

    // Enviar el formulario (PUT o POST según si es edición o nuevo)
    const handleSubmit = (e) => {
        e.preventDefault();

    const cancionAEnviar = { ...cancion };

    if (cancionAEnviar.acordes) { // Asegúrate de que 'acordes' exista
        cancionAEnviar.acordes = cancionAEnviar.acordes.replace(/{/g, '[').replace(/}/g, ']');
    }

        if (id) {

            axios.post('https://x5tau7j9wk.execute-api.us-east-2.amazonaws.com/apiAlabanza', cancionAEnviar)
                .then(response => {
                    alert('Canción actualizada con éxito');
                    localStorage.removeItem('canciones');
                    navigate('/alabanza/');  // Cambiado history.push por navigate
                })
                .catch(error => {
                    console.error('Error al actualizar la canción', error);
                });
        } else {
            // Realizar un POST si estamos creando
            axios.post('https://x5tau7j9wk.execute-api.us-east-2.amazonaws.com/apiAlabanza', cancionAEnviar)
                .then(response => {
                    alert('Canción creada con éxito');
                    localStorage.removeItem('canciones');
                    navigate('/alabanza/');  // Cambiado history.push por navigate
                })
                .catch(error => {
                    console.error('Error al crear la canción', error);
                });
        }
    };

    return (
        <div className="container mt-4 alabanza-edit-page">
            <h1>{id ? 'Editar Canción' : 'Crear Canción'}</h1>
          {error && <p className="alert alert-danger" role="alert">{error}</p>}
            <Form onSubmit={handleSubmit}>
                {/* Nombre */}
                <Form.Group controlId="nombre">
                    <Form.Label>Nombre</Form.Label>
                    <Form.Control
                        type="text"
                        name="nombre"
                        value={cancion.nombre}
                        onChange={handleChange}
                        required
                    />
                </Form.Group>

                {/* Autor */}
                <Form.Group controlId="autor">
                    <Form.Label>Autor</Form.Label>
                    <Form.Control
                        type="text"
                        name="autor"
                        value={cancion.autor}
                        onChange={handleChange}
                        required
                    />
                </Form.Group>

                {/* YouTube */}
                <Form.Group controlId="youtube">
                    <Form.Label>URL de YouTube</Form.Label>
                    <Form.Control
                        type="url"
                        name="youtube"
                        value={cancion.youtube}
                        onChange={handleChange}
                        required
                    />

                </Form.Group>

                {/* Categoría */}
                <Form.Group controlId="categoria">
                    <Form.Label>Categoría</Form.Label>
                    <Form.Control
                        type="text"
                        name="categoria"
                        value={cancion.categoria}
                        onChange={handleChange}
                        required
                    />
                </Form.Group>

                {/* Tempo */}
                <Form.Group controlId="tempo">
                    <Form.Label>Tempo</Form.Label>
                    <Form.Control
                        type="number"
                        name="tempo"
                        value={cancion.tempo}
                        onChange={handleChange}
                        required
                    />
                </Form.Group>

                {/* Tonalidad */}
                <Form.Group controlId="tonalidad">
                    <Form.Label>Tonalidad</Form.Label>
                    <Form.Control
                        as="select" // Cambia el tipo a select
                        name="tonalidad"
                        value={cancion.tonalidad}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Seleccione una tonalidad</option> {/* Opción por defecto */}
                        {notas.map((nota) => (
                          <option key={nota} value={nota}>
                            {nota}
                          </option>
                        ))}
                      </Form.Control>
                </Form.Group>


                {/* Comentarios */}
                <Form.Group controlId="comentarios">
                    <Form.Label>Comentarios</Form.Label>
                      <Button variant="link" onClick={() => setShowModalComentarios(true)}>
                        ?
                      </Button>
                      <Modal show={showModalComentarios} onHide={() => setShowModalComentarios(false)}>
                        <Modal.Header closeButton>
                          <Modal.Title>Ayuda Comentarios</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>Ingresa cualquier cosa que te sirva para la cancion. ej: tonalidad de los directores, estructuras de la cancion, efectos en tu instrumento etc.</Modal.Body>
                      </Modal>
                    <Form.Control
                        as="textarea"
                        rows={3}
                        name="comentarios"
                      value={cancion.comentarios}
                        onChange={handleChange}
                      spellCheck={false}
                      data-gramm="false"
                      data-enable-grammarly="false"
                      autoComplete="off"
                    />
                </Form.Group>
                 <Form.Group controlId="melodias">
                    <Form.Label>Melodias</Form.Label>
                    <Button variant="link" onClick={() => setShowModalMelodias(true)}>
                        ?
                      </Button>
                      <Modal show={showModalMelodias} onHide={() => setShowModalMelodias(false)} size='xl'>
                        <Modal.Header closeButton>
                          <Modal.Title>Generador Melodias</Modal.Title>
                        </Modal.Header>
                        <Modal.Body><MidiGenerator tempoEnviado={cancion.tempo}/> </Modal.Body>

                      </Modal>
                    <Form.Control
                        as="textarea"
                        rows={3}
                        name="melodias"
                      value={cancion.melodias}
                        onChange={handleChange}
                      spellCheck={false}
                      data-gramm="false"
                      data-enable-grammarly="false"
                      autoComplete="off"
                    />
                </Form.Group>




                <Form.Group controlId="urlAcorde">
                    <Form.Label>Buscar acordes con IA (opcional)</Form.Label>
                    <Form.Control
                        type="text"
                        name="urlAcorde"
                        value={urlAcorde}
                        onChange={handleChange2}
                        placeholder="Pegá una URL de Lacuerda o Cifra Club"
                    />
                    <Form.Text muted>
                      Si preferís, podés escribir los acordes manualmente abajo y guardar sin usar esta búsqueda.
                    </Form.Text>
                </Form.Group>
                <div className="alabanza-ai-actions">
                  <Button type="button" onClick={generarCifrado} disabled={loading}>
                      {loading ? 'Buscando...' : 'Obtener acordes desde la página'}
                  </Button>
                </div>
                {/* Acordes */}
                <Form.Group controlId="acordes">
                    <Form.Label>Acordes</Form.Label>
                     <Button variant="link" onClick={() => setShowModalAcordes(true)}>
                        ?
                      </Button>
                      <Modal show={showModalAcordes} onHide={() => setShowModalAcordes(false)}>
                        <Modal.Header closeButton>
                          <Modal.Title>Ayuda Acordes</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>Ingresar la cancion con los acordes en cifrado americano. no se aceptan bemoles. la nota debe estar arriba del texto de la cancion y estar entre corchetes. primero debe haber una linea de acordes y luego otra de texto. se puede saltear linas pero no dejar espacios inecesarios</Modal.Body>
                      </Modal>
                    <Form.Control
                        as="textarea"
                        rows={20}
                        name="acordes"
                      value={cancion.acordes}
                        onChange={handleChange}
                        style={{ fontFamily: 'Courier New, monospace' }} // Fuente monoespaciada
                      spellCheck={false}
                      data-gramm="false"
                      data-enable-grammarly="false"
                      autoComplete="off"
                    />
                </Form.Group>


                {/* Botón de envío */}

                <div className="alabanza-form-actions">
                  <Button className="btn btn-success" type="submit">
                    {id ? 'Actualizar canción' : 'Crear canción'}
                  </Button>
                  <Link to="/alabanza/" className="btn btn-dark">Salir</Link>
                </div>
            </Form>

        </div>
    );
}

export default EdicionCanciones;
