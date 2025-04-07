const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.JWT_SECRET || 'clave_secreta';
const cookieParser = require('cookie-parser');
app.use(cookieParser());
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

function verificarToken(req, res, next) {
    const token = req.cookies.token;

    if (!token) return res.sendStatus(401);

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403);
        req.usuario = user;
        next();
    });
}

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Rutas
app.get('/', (req, res) => {
    res.send('Servidor Node.js con Express funcionando!');
});


app.post('/api/crear-usuario', async (req, res) => {
    const { legajo, nombre, email, contrasena } = req.body;

    const hash = await bcrypt.hash(contrasena, 10);
    const query = `INSERT INTO usuarios (legajo, nombre, email, contrasena) VALUES (?, ?, ?, ?)`;

    db.run(query, [legajo, nombre, email, hash], function(err) {
        if (err) {
            console.error('Error al insertar usuario:', err.message);
            return res.status(500).json({ mensaje: 'Error en la base de datos' });
        }
        res.json({ mensaje: 'Usuario creado correctamente', id: this.lastID });
    });
});

// Ruta de login con base de datos
app.post('/api/login', (req, res) => {
    const { legajo, contrasena } = req.body;

    db.get("SELECT * FROM usuarios WHERE legajo = ?", [legajo], async (err, user) => {
        if (err || !user) {
            return res.status(401).json({ mensaje: 'Usuario o contraseña incorrectos' });
        }

        const match = await bcrypt.compare(contrasena, user.contrasena);
        if (!match) {
            return res.status(401).json({ mensaje: 'Usuario o contraseña incorrectos' });
        }

        const token = jwt.sign({ legajo: user.legajo }, SECRET_KEY, { expiresIn: '1h' });

        // Enviar cookie segura
        res.cookie('token', token, {
            httpOnly: true,
            secure: false, // ⚠️ Usar true si estás en HTTPS
            sameSite: 'Lax',
            maxAge: 60 * 60 * 1000 // 1 hora
        });

        res.json({ mensaje: 'Login exitoso' });
    });
});

app.get('/api/usuario-logueado', verificarToken, (req, res) => {
    db.get("SELECT nombre, email FROM usuarios WHERE legajo = ?", [req.usuario.legajo], (err, row) => {
        if (err) return res.status(500).json({ mensaje: 'Error del servidor' });
        if (!row) return res.status(404).json({ mensaje: 'Usuario no encontrado' });

        res.json(row);
    });
});

app.post('/api/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ mensaje: 'Sesión cerrada' });
});


// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
