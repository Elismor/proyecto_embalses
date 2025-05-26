document.getElementById('interpolation-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const pointsText = document.getElementById('points').value;
    const xValue = document.getElementById('x-value').value;
    const method = document.getElementById('method').value;
    const resultDiv = document.getElementById('result');

    // Convertir puntos a formato [[x1,y1], [x2,y2], ...]
    const points = pointsText.split(' ').map(point => {
        const [x, y] = point.split(',').map(Number);
        return [x, y];
    });

    try {
        const response = await fetch('http://127.0.0.1:5000/api/calculate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                points: points,
                x: parseFloat(xValue),
                method: method
            })
        });

        const data = await response.json();

        if (data.status === 'success') {
            resultDiv.innerHTML = `
                <p><strong>Resultado:</strong> Y ≈ ${data.y_estimated.toFixed(4)}</p>
                <p><strong>Método:</strong> ${method === 'linear' ? 'Lineal' : 'Lagrange'}</p>
            `;
        } else {
            resultDiv.innerHTML = `<p class="error">Error: ${data.message}</p>`;
        }
    } catch (error) {
        resultDiv.innerHTML = `<p class="error">Error de conexión: ${error.message}</p>`;
    }
});