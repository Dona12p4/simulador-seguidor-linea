# Simulador del seguidor · PID actual v7.10

Modelo web de la pista impresa de 180 × 120 cm, línea de 18 mm, regleta curva de 16 sensores y motor nominal de 3000 RPM. Los originales `.ino` y las versiones físicas registradas como éxito no se modifican.

## Control que abre por defecto

El **perfil 3** traduce `ControlPIDDirecto.h` y `MemoriaLinea.h` de `Seguidor_v7_10_Memoria_Calibracion` a JavaScript. Mantiene el factor **1,50** y entrega PWM directamente, sin la conversión RPM→PWM, zona muerta de posición, pivotes y guardia de 24 ms del simulador histórico.

- Kp = 100, Ki = 4, Kd = 1,6 para error normalizado entre −1 y 1.
- P usa el centroide actual; solamente D tiene filtro de 16 ms.
- Bases de recta/curva 120/80 PWM antes del factor (180/120 a factor 1,50), con rampas, penalización por error/derivada, saturación y piso de marcha del firmware.
- Recuperación por memoria óptica: pausa inicial de 16 ms, retorno 82→110 PWM en 160 ms, máximo 1200 ms. La primera lectura válida devuelve el PID; tres lecturas consecutivas confirman el retorno. No usa coordenadas ni recorrido conocido para dirigirlo.
- BOOT inicia/pausa/reanuda. La pausa conserva los rangos de calibración virtuales. Una pérdida sin historial reciente o un retorno agotado sigue siendo una causa de pausa, igual que en v7.10.

`control-pid-actual.js` conserva operaciones float32. La traducción del núcleo y la memoria se contrastó con el C++ original: 67.214 pasos PID, 3.015 casos de memoria, 1.545.922 comparaciones numéricas idénticas y ninguna diferencia en PWM redondeado. Esta paridad de software no demuestra fidelidad física.

Los **perfiles 1 y 2** conservan los controles de septiembre; también permanece la referencia de **1000 RPM**. Cambiar de perfil pausa la simulación y no modifica la planta. Los parámetros de código y los físicos siguen separados. Los controles que no intervienen en el perfil elegido se ocultan.

## Calibración virtual, no calibración física

El perfil actual abre con 16 rangos virtuales preparados: ADC blanco 500 / negro 3500. Son supuestos explícitos de la transferencia óptica del modelo, no los rangos medidos de la última prueba. El botón de preparación espera 5 segundos sin mover motores y restaura estos rangos; no pretende reproducir el movimiento manual del robot real.

Los perfiles históricos conservan su barrido automático anterior. No se afirma que esos barridos representen la calibración manual del firmware actual.

## Referencia de video de octubre

En el video 38461 se midieron cuatro vueltas completas por el mismo punto y sentido: **3,90; 3,91; 3,88 y 3,86 s**, con incertidumbre manual aproximada de ±0,1 s. El movimiento visible es suave hasta la salida cercana a 20,3 s. No se interpreta esa suavidad como error cero.

El CSV de octubre no está sincronizado con el video. Por eso la tabla no mezcla las medianas de septiembre con las vueltas actuales ni inventa valores de PWM o error extraídos de los fotogramas.

La planta representa de forma reducida motor, tracción, fricción y cabeceo. Sus parámetros son efectivos y no están identificados de manera única: varios conjuntos pueden dar tiempos similares. La correspondencia de una vuelta por sí sola no permite conocer torque, deslizamiento, inercia ni altura óptica reales.

Tras instalar el PID actual se ajustó **un solo parámetro físico efectivo: ganancia motriz de 1,00 a 0,90**. Se conservaron masa, agarre, inercia, constantes de respuesta, geometría y óptica. No se modificó el controlador para obtener un tiempo conveniente. Este ajuste conjunto de PWM→movimiento contrasta tiempo y suavidad, pero no demuestra una ganancia de motor medida; volver a 1,00 permite comparar la planta anterior. Los controles históricos usan también la planta que el usuario tenga seleccionada.

## Comprobaciones reproducibles del candidato

Prueba local con el código HTML/JavaScript entregado, geometría raster de la pista y pasos físicos de 2 ms (no es una medición de hardware):

| Caso | Resultado |
|---|---|
| PID actual, factor 1,50, 120 s | 30 vueltas; mediana 3,946 s; cero pérdidas de lectura |
| Mismo caso, sentido contrario, 60 s | 15 vueltas; mediana 3,946 s; cero pérdidas |
| Agarre μ = 0,60 | Pérdidas; mediana de vueltas válidas ≈5,04 s |
| Agarre μ = 0,30 | Sale de la pista y pausa |
| Respuesta lenta 24/10/30 ms | 18 pérdidas; mediana ≈9,49 s |
| Kp = Ki = Kd = 0 | No completa vueltas |
| Altura del sensor = 20 mm | No inicia por falta de contraste |

En un contraste de 30 s, las correcciones que cruzan ±3 mm pasan de aproximadamente 21,75 por vuelta con el controlador histórico a 4,14 con el actual. Es una métrica del modelo, no una cantidad extraída del video; incluye cambios naturales entre curvas y no mide por sí sola el zigzag. El PWM varía aproximadamente 2704 unidades por vuelta frente a 3867 de la referencia histórica. La comparación favorece un movimiento visual más suave, sin declarar error cero.

También se comprobaron BOOT, pausa/reinicio sin recalibración, preparación inmóvil de 5 s, retorno y reincorporación desde la primera lectura válida, agotamiento a 1,2 s, ausencia de historial y cambio entre perfiles. Las condiciones adversas siguen pudiendo fallar: no hay una trayectoria oculta que garantice que el robot complete la pista.

## Sensores, telemetría y reloj

El control recibe exclusivamente el centroide de 16 lecturas de reflectancia sobre el mismo trazo que se dibuja. El contador geométrico de vueltas está separado y sólo informa: no entrega posición ni consignas al PID. El reloj integra pasos de 2 ms y avisa cuando el navegador se retrasa; no acelera artificialmente para obtener 3,9 s.

El visor local acepta `Telemetria.csv` unificado y CSV históricos de muestras. Filtra y cuenta los registros de metadatos/eventos sin tratarlos como sensores; en firmware no compatible muestra las lecturas registradas sin reinventar el grupo ni la validez. Importar un CSV pausa el modelo. No reconstruye X/Y, no aprende automáticamente parámetros y no sube datos a ningún servidor.

La web pública no controla el ESP32. Para capturar lecturas físicas se utiliza el panel Wi-Fi del firmware. No se publican grabaciones, credenciales ni CSV crudos privados en este repositorio.
