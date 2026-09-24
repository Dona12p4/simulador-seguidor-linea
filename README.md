# Simulador web del seguidor de línea — v6.4

Aplicación para celular sobre la pista impresa de 180 × 120 cm, línea de 18 mm y regleta de 16 sensores. Motor nominal de 3000 RPM, con referencia histórica de 1000 RPM separada.

## Comparación con muestras físicas

- Abre CSV locales (hasta 32 MiB y 90.000 filas), sin subirlos a servidores.
- Separa tiempo acumulado/intervalo abierto, periodo candidato y huella de vuelta confirmada.
- Resume tandas y advierte si el archivo no contiene vueltas confirmadas.
- Busca repetición temporal de error y diferencia de PWM, sin rellenar huecos ni reconstruir X/Y. Media pista y vuelta completa pueden confundirse.
- Conserva muestras de los 16 normalizados al máximo, anotando que centroide cero no demuestra centrado.
- Durante reproducción física no muestra velocidad, derrape o cabeceo del simulador como si estuvieran medidos.
- Conserva interpretación histórica por versión del firmware. La búsqueda de una lectura rechazada usa la validez registrada, no una suposición del simulador.

## Simulación

El contador usa avance neto y cierre, con muestreo por paso físico de 2 ms. Reanclajes y pausas no inflan tiempos ni acreditan vueltas parciales; oscilar no suma vueltas.

Se portaron pulsos y protección predictiva de calibración del firmware, pero no toda su máquina de estados. Los microfallos cortan PWM sin reiniciar artificialmente el PD antes de una pausa confirmada.

Hay dos hipótesis motrices seleccionables. La ley 0 conserva la anterior: permite calibrar, pero es demasiado lenta frente al comportamiento observado. La ley 1 separa arranque y respuesta en marcha: es exploratoria y actualmente pierde seguimiento. Cambiar entre ellas no modifica las ganancias PID ni borra rangos.

**La dinámica todavía no reproduce suficientemente el robot real.** Masa, inercia, fricción, frenado, transferencia óptica y respuesta motriz no están identificados. No se ajustaron constantes para garantizar una vuelta ni se guía el robot mediante coordenadas ocultas. Una prueba de software aprobada no es validación física.

El código Arduino original y el firmware cargado no se modifican desde esta web. Las etiquetas de la página que sirve el ESP32 requieren una actualización independiente del firmware. Esta aplicación no envía órdenes al robot.

## Privacidad y verificación

Sólo se publica la aplicación. Los CSV, videos, fotogramas y reportes de ensayos permanecen locales. El HTML es autónomo, sin dependencias remotas.

Pruebas de software: procesamiento de sensores, importación de CSV, periodos temporales, contador, respuesta de planta, regresiones históricas y navegador aislado en escritorio/celular. Los resultados naturales de calibración y seguimiento se reportan separados de las pruebas sintéticas.
