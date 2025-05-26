from flask import Flask, request, jsonify
import subprocess
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Permite conexiones desde el frontend

# Ruta donde está instalado Octave
OCTAVE_PATH = r"C:\Program Files\GNU Octave\Octave-10.1.0\mingw64\bin\octave-cli.exe"

@app.route('/api/calculate', methods=['POST'])
def calculate():
    try:
        # 1. Recibir datos del frontend
        data = request.json
        points = data["points"]  # Ej: [[6,2.5], [9,2.7]]
        method = data["method"]  # "linear" o "lagrange"
        x = data["x"]            # Valor a interpolar (ej: 7.5)

        # 2. Convertir datos para Octave
        points_str = " ".join([f"{p[0]},{p[1]}" for p in points])

        # 3. Llamar a Octave
        cmd = [
            OCTAVE_PATH,
            "--eval",
            f"addpath('octave_scripts'); interpolacion('{method}', '{points_str}', {x});"
        ]
        result = subprocess.run(cmd, capture_output=True, text=True)

        # 4. Devolver resultado
        return jsonify({
            "y_estimated": float(result.stdout.strip()),
            "status": "success"
        })

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        })

if __name__ =='__main__':
    app.run(debug=True, port=5000)  # Inicia el servidor