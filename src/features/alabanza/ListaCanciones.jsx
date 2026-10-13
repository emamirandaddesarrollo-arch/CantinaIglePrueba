import React from 'react';
import { Link } from 'react-router-dom';
function ListaCanciones({ canciones, agregarCancion, filters, handleFilterChange, borrarCookies }) {
    return (
        <section className="alabanza-song-list">
            <h2 className="text-dark">Todas las canciones</h2>
            <div className="alabanza-list-toolbar">
                <div className="alabanza-list-search">
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Buscar por la letra de la canción"
                        name="acordes"
                        value={filters.acordes}
                        onChange={handleFilterChange}
                    />
                </div>
                <div className="alabanza-list-actions">
                    <Link to="/alabanza/edicion" className="btn btn-warning">Nueva canción</Link>
                    <button onClick={borrarCookies} className="btn btn-danger">Actualizar canciones</button>
                </div>
            </div>
            <div className="table-responsive">
            <table className="table table-striped table-bordered table-sm top-table">
                <thead>
                    <tr>
                        <th>
                            Nombre
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Filtrar"
                                name="nombre"
                                value={filters.nombre}
                                onChange={handleFilterChange}
                            />
                        </th>
                        <th>
                            Autor
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Filtrar"
                                name="autor"
                                value={filters.autor}
                                onChange={handleFilterChange}
                            />
                        </th>
                        <th>
                            Categoria
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Filtrar"
                                name="categoria"
                                value={filters.categoria}
                                onChange={handleFilterChange}
                            />
                        </th>
                        <th>
                        Tonalidad</th>
                        <th>Tempo</th>
                        <th>Youtube</th>
                        <th>Ver</th>
                        <th>Acción</th>
                    </tr>
                </thead>
                <tbody>
                    {canciones.map(song => (
                        <tr key={song.id}>
                            <td>{song.nombre}</td>
                            <td>{song.autor}</td>
                            <td>{song.categoria}</td>
                            <td>{song.tonalidad}</td>
                            <td>{song.tempo}</td>
                            <td>
                                <a href={song.youtube} className="btn btn-secondary ">YouTube</a>
                            </td>
                            <td>
                                <a href={`/alabanza/acordes?id=${song.id}&transportar=${song.tone}&selected=${song.id}_${song.tone}|${song.id}_${song.tone}&inList=false`} className="btn btn-success">Acordes</a>

                            </td>
                            <td>
                                <button className="btn btn-default" onClick={() => agregarCancion(song.id)}>Agregar a la lista</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            </div>
        </section>
    );
}

export default ListaCanciones;
