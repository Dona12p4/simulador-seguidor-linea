# Simulador del seguidor · Fase 2 v7

Pista impresa de 180 × 120 cm, línea de 18 mm, regleta curva de 16 sensores y motor nominal de 3000 RPM.

Esta revisión abre con el **perfil de código 2**: consigna de recta 400/curva 216, Kp 122,5 y Kd 3,2, salida del pivote a 20 mm, retención posterior 80 ms y rampas de giro 100/250 rad/s². El arranque sigue en 300. Las consignas internas de RPM no son mediciones del robot.

En «Código» puedes seleccionar **perfil 1** para recuperar el control anterior, sin cambiar sensores, física ni calibración. Cambiar de perfil detiene la marcha simulada. También se mantiene la referencia histórica de 1000 RPM.

## Comparación de software

La misma planta física v6.5, sin ajustar agarre ni reloj para favorecer al nuevo controlador:

| Medida, caso nominal de 120 s | Perfil 1 | Perfil 2 |
|---|---:|---:|
| Mediana por vuelta | 10,114 s | 8,566 s |
| Variación total de PWM por segundo, ambas ruedas | 754,47 | 376,89 |
| Error absoluto p95 | 28,172 mm | 26,715 mm |
| Muestras con órdenes de signos opuestos | 7,44 % | 0 % |

Se compararon 36 condiciones de marcha por perfil: tres agarres, tres respuestas dinámicas, dos ruidos y dos sentidos. Se calibró naturalmente en condiciones nominales **antes** de aplicar las perturbaciones. Ambos perfiles completaron los ensayos de 120 s; fase 2 redujo tiempo, variación de PWM y error p95 en las 36 comparaciones. El tiempo de uso de pivote no mejoró en todos los casos. Otros doce ensayos con factor manual 1,05/1,10 también completaron 120 s.

Se corrigió el redondeo del temporizador web: al vencer el postpivote ya no agrega ocasionalmente un ciclo de control de 8 ms. El control compilado C++ y JavaScript coincide en una prueba de 1.200 lecturas sintéticas (factor 1, signo calibrado positivo). No se aceleró el reloj físico.

La calibración bajo algunas condiciones alteradas sigue fallando, también en fase 1. No se corrigió manipulando sensores ni se ocultó con rangos inyectados.

## Alcance

Es un candidato para recoger nuevas muestras reales, no una validación del carro a esta velocidad. La respuesta del motor, fricción y óptica siguen siendo aproximadas y no únicas. El CSV anterior muestra PWM y sensores; no mide velocidad instantánea, deslizamiento, inclinación ni coordenadas X/Y.

La tabla «Físico» conserva los datos de **fase 1**: todavía no existen datos reales de fase 2. El video sugiere unos 9–10 s por vuelta, sin sincronización exacta con el CSV. El tramo de salida por falta de madera no representa el modelo de suelo continuo.

La reproducción local acepta el CSV anterior y el de `Seguidor_v7_Fase2_WiFi`. No sube archivos, no localiza el robot sobre el dibujo y no cambia automáticamente el modelo.

La web pública no controla el ESP32. Para capturar datos reales hay que cargar el firmware v7 por USB y usar su panel Wi-Fi local. No se publica información privada, grabaciones ni muestras crudas en este repositorio.

El reloj usa pasos físicos de 2 ms y muestra el retraso si el navegador no alcanza tiempo real. No acorta vueltas cambiando el cronómetro.
