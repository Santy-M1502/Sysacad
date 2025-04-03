document.querySelector('.main-container').addEventListener('submit', async function(event) {
        event.preventDefault(); // Evita que el formulario recargue la página

        const legajo = document.querySelector('.legajo').value;
        const contrasena = document.querySelector('.contrasena').value;
        
        try {
            const response = await fetch('http://localhost:3000/api/login', {                          //fetch se encarga de enviar la peticion al server
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ legajo, contrasena })
            });
    
            if (!response.ok) { // si la respuesta es que no llego la informacion del legajo y contrasema
                throw new Error('Error en la respuesta del servidor');
            }
    
            const data = await response.json();
            document.getElementById('mensaje').textContent = data.mensaje; // Muestra el mensaje
        }
         catch (error) {
            console.log(error)
        }
})
