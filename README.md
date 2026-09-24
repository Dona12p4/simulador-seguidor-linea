# Simulador v6.5 — ajuste a observaciones del robot físico

Versión `fisica-v65-20260924`. Copia independiente: v6.4 y los archivos físicos permanecen intactos. Abre el modelo de 3000 RPM con la planta inferida 2 y recorrido antihorario, como en el video. No ejecuta Arduino en el navegador ni envía órdenes al ESP32.

## Qué cambió

- Se dejó de restar un umbral de arranque a todo el PWM de marcha. PWM 60 ya no implica necesariamente una rueda parada si está girando. La calibración física observada sí movió el carro con impulsos de PWM 70.
- Se separaron respuesta efectiva al impulsar (12 ms), cortar/reducir/invertir (5 ms) y tracción (15 ms). Sustituyen en la planta 2 la cascada anterior de 70 + 55 ms. Son parámetros ajustados del modelo reducido, **no constantes medidas independientemente ni identificación única de los motores**. Ganancia efectiva 1, sin multiplicador de tiempo.
- Se conservan Kp/Kd y el perfil de órdenes del firmware v6.3. Los límites del código y la capacidad física de aceleración/frenado son controles diferentes. Los escenarios de poco agarre, nariz elevada y sesgo ya no cambian simultáneamente las consignas de velocidad del código.
- La calibración natural incluye adquisición, barridos, retorno y centrado normalizado. No se inyectan rangos ideales para conseguir seguimiento. Son posibles coberturas incompletas, como en las muestras físicas.
- Se igualó el sentido del recorrido del video. No se intercambiaron los nombres de motores o las columnas del CSV.
- Se eliminó el recorte silencioso de tiempo a 50 ms por cuadro. El reloj conserva la deuda de cálculo, limita el trabajo por cuadro y muestra el retraso. Una pestaña oculta se suspende explícitamente; no acumula movimiento para ejecutarlo al volver.
- Una tabla compara vuelta, error lateral, PWM y anchura del grupo. Sus cifras no alimentan el controlador ni la planta.

## Resultado y límites

Con valores por defecto y calibración natural, una prueba de 120 s produjo 11 vueltas sin perder la línea. Mediana: **10,51 s**; intervalo observado **9,39–12,73 s**. La referencia visual física es aproximadamente 9–10 s, con incertidumbre de inspección cercana a un segundo; no es una señal sincronizada con cada fila del CSV.

| Indicador en marcha | CSV físico | Modelo, prueba de 120 s |
|---|---:|---:|
| Mediana de error absoluto | 14,8 mm | 16,1 mm |
| Percentil 95 del error absoluto | 33,6 mm | 28,0 mm |
| PWM mediano izquierdo / derecho | 60 / 78 | 63 / 84 |
| Ruedas con PWM de signos opuestos | 5,22 % | 6,90 % |
| Sensores del grupo: mediana / p95 | 5 / 10 | 4 / 5 |

La anchura óptica y las saturaciones comunes **todavía no se reproducen suficientemente**. La transferencia ADC sintética sigue siendo una hipótesis de 500–3500; la real muestra otros fondos, techos y coberturas por canal. No se ensanchó la cinta de 18 mm ni se inyectaron saturaciones aleatorias para hacer coincidir las estadísticas.

La calibración del ensayo físico duró aproximadamente 3,324 s. La prueba centrada del modelo termina en 2,352 s con 15 canales de rango suficiente; otras dos colocaciones a ±26,4 mm terminan con 16 canales y permiten vueltas sostenidas. No se afirma igualdad de calibración o robustez para todas las colocaciones.

El código fuente contiene aproximaciones en sondeo de signo, recuperación, física de contacto y óptica. La regleta virtual se lee simultáneamente; el barrido físico de los 16 canales tarda alrededor de 3,3 ms. El gestor de aprendizaje de huella, progresión y Wi-Fi del firmware no está portado íntegramente.

No se han medido por separado fricción, inercia, RPM reales, par, altura o centro de masa. La geometría es la pista impresa de 180 × 120 cm, trazo 18 mm, rueda de radio 10 mm, separación 120 mm y regleta curva de 160–175 mm de adelanto. Se supone apoyo continuo bajo las ruedas. La salida final del video donde falta madera se excluye del ajuste y no se convierte en un supuesto fallo del PID.

El contador geométrico exige avance neto y cierre de la trayectoria. No alimenta al controlador. Los 89,928 s del CSV son una tanda abierta, no una vuelta confirmada. La reproducción del CSV no reconstruye X/Y ni muestra velocidad, derrape o cabeceo como si estuvieran medidos.

## Uso

1. Abrir la página nueva; el encabezado debe decir V6.5.
2. Pulsar **Calibrar** y después **BOOT · Iniciar**. No cambia firmware ni mueve hardware.
3. Revisar la tabla de comparación y el reloj. Si se modifican parámetros, la respuesta puede empeorar o perder la línea; no se fuerza el seguimiento.
4. **Recolocar** conserva la calibración. **Reenergizar** inicia una sesión nueva. La referencia histórica de 1000 RPM permanece separada, con su ley motriz anterior.

## Verificación reproducible

```text
node build.mjs
node qa-fidelity-v65.mjs
node qa-clock-v65.mjs
node qa-sensors-v63.mjs
node qa-laps-v64.mjs
node qa-replay-v64.mjs
node qa-patterns-v64.mjs <CSV físico>
node qa-model-v65.mjs
node qa-web-v65.mjs
node qa-release-v65.mjs
```

Las pruebas de navegador usan Chrome aislado, sin el perfil del usuario ni conexión al ESP32. Los informes/copias de QA anteriores conservados en esta carpeta son históricos; no sustituyen los resultados v6.5. Los ensayos acelerados por pasos no se presentan como pruebas de rendimiento en tiempo real.

Sólo se publican la aplicación y documentación. CSV y video se mantienen privados; la importación se procesa localmente en el navegador. El HTML contiene únicamente referencias estadísticas agregadas. `node build.mjs --public-copy` genera el HTML autónomo para el repositorio existente de GitHub Pages.
