const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const sqlite3 = require('sqlite3').verbose();
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Conectar a la base de datos SQLite
const db = new sqlite3.Database('./alumnos.db', (err) => {
    if (err) {
        console.error('Error al conectar con la base de datos:', err.message);
    } else {
        console.log('Conectado a la base de datos SQLite');
    }
});

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Rutas
app.get('/', (req, res) => {
    res.send('Servidor Node.js con Express funcionando!');
});

// Ruta de login con base de datos
app.post('/api/login', (req, res) => {
    const { legajo, contrasena } = req.body;

    if (!legajo || !contrasena) {
        return res.status(400).json({ mensaje: 'Legajo y contraseña son requeridos' });
    }

    const query = 'SELECT * FROM usuarios WHERE legajo = ?';
    db.get(query, [legajo], (err, row) => {
        if (err) {
            console.error('Error en la consulta SQL:', err.message);
            return res.status(500).json({ mensaje: 'Error en la base de datos' });
        }

        if (!row) {
            return res.status(401).json({ mensaje: 'Usuario no encontrado' });
        }

        // Comparar contraseña sin bcrypt (por ahora)
        if (row.contrasena !== contrasena) {
            return res.status(401).json({ mensaje: 'Contraseña incorrecta' });
        }

        res.json({ mensaje: 'Login exitoso', autorizado: true });
    });
});



// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
