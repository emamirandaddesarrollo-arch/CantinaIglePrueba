import React from 'react';

function CancionesSeleccionadas({ selectedSongs, eliminarCancion, moverCancion, cambiarTonalidadSeleccionada, guardarUrl, selectedSongsUrl, linkYoutube  }) {
    return (
        <section className="alabanza-selected-songs">
        <div className="alabanza-selected-header">
            <h2 className="text-info">Lista de canciones seleccionadas</h2>
            <div className="alabanza-list-actions">
                <button className="btn btn-warning" onClick={() => guardarUrl()} >Guardar</button>
                <button className="btn btn-info" onClick={() => linkYoutube()} >Link YouTube</button>
            </div>
        </div>


            <div className="table-responsive">
            <table className="table table-striped table-bordered table-sm top-table">
                <thead>
                    <tr>
                        <th>Nombre</th>
                        <th>Autor</th>
                        <th>Categoria</th>
                        <th>Tempo</th>
                        <th>Tonalidad</th>
                        <th>Cambiar </th>
                        <th>Youtube</th>
                        <th>Ver</th>
                        <th>Acción</th>
                        <th>Orden</th>
                    </tr>
                </thead>
                <tbody>
                    {selectedSongs.map((song, index) => (
                        <tr key={song.id}>
                            <td>{song.nombre}</td>
                            <td>{song.autor}</td>
                            <td>{song.categoria}</td>
                            <td>{song.tempo}</td>
                            <td>{song.tonalidad}</td>
                            <td>
                                <button className="btn btn-default" onClick={() => cambiarTonalidadSeleccionada(song.id, 'up')}>↑</button>
                                <button className="btn btn-default" onClick={() => cambiarTonalidadSeleccionada(song.id, 'down')}>↓</button>
                            </td>

                            <td>
                                <a href={song.youtube} className="btn btn-secondary ">YouTube</a>
                            </td>
                            <td>
                                <a href={`/alabanza/acordes?id=${song.id}&transportar=${song.tone}&selected=${selectedSongsUrl}`} className="btn btn-success">Acordes</a>
                            </td>
                            <td>
                                <button className="btn btn-danger" onClick={() => eliminarCancion(song.id)}>Eliminar</button>
                            </td>
                            <td>
                                <button className="btn btn-default" onClick={() => moverCancion(song.id, 'up')}>↑</button>
                                <button className="btn btn-default" onClick={() => moverCancion(song.id, 'down')}>↓</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            </div>
        </section>
    );
}

export default CancionesSeleccionadas;
