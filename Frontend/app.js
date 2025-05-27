document.getElementById('file-input').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        const text = event.target.result;
        const lines = text.trim().split('\n');
        const points = lines.map(line => line.trim());
        document.getElementById('points').value = points.join(' ');
    };
    reader.readAsText(file);
});

document.getElementById('interpolation-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const pointsText = document.getElementById('points').value;
    const xValue = document.getElementById('x-value').value;
    const method = document.getElementById('method').value;
    const resultDiv = document.getElementById('result');

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
                <canvas id="myChart" width="400" height="200"></canvas>
            `;
            renderChart(points, data.y_estimated, parseFloat(xValue), method);
        } else {
            resultDiv.innerHTML = `<p class="error">Error: ${data.message}</p>`;
        }
    } catch (error) {
        resultDiv.innerHTML = `<p class="error">Error de conexión: ${error.message}</p>`;
    }
});

function renderChart(points, estimatedY, targetX, method) {
    const ctx = document.getElementById('myChart').getContext('2d');

    // Asegurarse de que el gráfico anterior exista antes de destruirlo
    if (window.myChart && typeof window.myChart.destroy === 'function') {
        window.myChart.destroy();
    }

    const labels = points.map(p => p[0]);
    const dataPoints = points.map(p => p[1]);

    const datasets = [
        {
            label: 'Puntos dados',
            data: points.map(([x, y]) => ({ x, y })),
            borderColor: 'gray',
            backgroundColor: 'gray',
            showLine: false,
            pointRadius: 5
        },
        {
            label: `Interpolación ${method === 'linear' ? 'Lineal' : 'Lagrange'}`,
            data: [
                ...points.map(([x, _]) => ({ x, y: null })),
                { x: targetX, y: estimatedY }
            ],
            borderColor: method === 'linear' ? 'blue' : 'green',
            backgroundColor: 'transparent',
            borderWidth: 2,
            tension: 0.3
        },
        {
            label: 'Valor estimado',
            data: [{ x: targetX, y: estimatedY }],
            borderColor: 'red',
            backgroundColor: 'red',
            pointRadius: 6
        }
    ];

    window.myChart = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: datasets
        },
        options: {
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'X'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Y'
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top'
                }
            }
        }
    });
}