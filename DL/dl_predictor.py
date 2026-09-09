
import numpy as np
import joblib
from tensorflow.keras.models import load_model

model = load_model("final_lstm_model.keras")
x_scaler = joblib.load("x_scaler.pkl")
y_scaler = joblib.load("y_scaler.pkl")


def predict_168h(input_data):

    input_data = np.array(input_data, dtype=float)

    if input_data.shape == (16,):
        input_data = input_data.reshape(1, -1)

    if input_data.shape[1] != 16:
        raise ValueError("Expected 16 input values.")

    input_scaled = x_scaler.transform(input_data)

    input_lstm = input_scaled.reshape(-1, 4, 4)

    prediction_scaled = model.predict(
        input_lstm,
        verbose=0
    )

    prediction = y_scaler.inverse_transform(
        prediction_scaled
    )

    # Leakage cannot be negative
    prediction[:, 2] = np.maximum(
        prediction[:, 2],
        0
    )

    return prediction
