# Simulador web del seguidor de línea

Página estática para celular sobre la pista impresa de 180 × 120 cm y línea de 18 mm. La interfaz permite variar velocidad, control, agarre, motores, elevación de la nariz, geometría y sensores.

Incluye dos modos: referencia histórica para motor nominal de 1000 RPM y procesamiento de sensores/paradas alineado con el firmware v6.2 para motor nominal de 3000 RPM. No ejecuta `.ino` en el navegador. Los originales del firmware no se modificaron.

La actualización separa ADC, calibración min/max e intensidades normalizadas de los 16 canales. Conserva el rechazo de grupos mayores de siete, pausa a 24 ms de lectura inválida o 80 ms con error mayor de 35 mm y permite reanudar centrado sin recalibrar. La escala PWM del código queda separada del voltaje físico ajustable.

En «Qué lee la regleta» se puede abrir un CSV físico para inspeccionar ADC, rangos, intensidades y motivo de rechazo. Los archivos se procesan localmente en el navegador, sin enviarse al sitio. Las 1509 muestras calibradas del registro de comprobación coincidieron en validez con el detector trasladado. No se publican las muestras ni se reconstruyen mínimos ausentes o coordenadas X/Y.

El derrape, tiempo de vuelta y cabeceo son resultados de un modelo reducido con parámetros aún no calibrados físicamente. No deben tratarse como predicciones garantizadas del robot real.

El movimiento de calibración y la dinámica siguen simplificados; no se portaron todas las fases de calibración, el gestor progresivo, la huella de pista ni Wi-Fi. La entrada óptica de la referencia 1000 RPM es ideal. La transferencia sintética ADC=500+3000×reflectancia es una hipótesis, no una curva identificada.
