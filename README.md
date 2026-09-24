# Simulador web del seguidor de línea

Página para celular sobre la pista impresa de 180 × 120 cm, línea de 18 mm y regleta de 16 sensores.

La política de adquisición v6.3 acepta grupos amplios sin detenerse únicamente por superar siete sensores o por error lateral mayor de 35 mm. Calcula el centroide candidato, identifica la ambigüedad y permite iniciar/reanudar con señal estimable fuera de la antigua zona central de ±15 mm.

Conserva el corte cuando no hay señal suficiente y rechaza todos los ADC simultáneamente saturados en cero o 4095. El procesamiento, los rangos y estas protecciones son decisiones del software; no son especificaciones físicas identificadas por los CSV.

Se mantiene por separado la referencia histórica de 1000 RPM. El modo actual usa motor nominal de 3000 RPM y no ejecuta el archivo Arduino en el navegador. Los originales físicos no se modificaron.

«Qué lee la regleta» permite abrir CSV locales y comparar cada registro con la política de su firmware. Los datos v6.2 conservan su interpretación histórica, y se muestra la diferencia con adquisición. Sin firmware se declara la suposición histórica; una versión desconocida no se compara. Datos sin calibrar no se tratan como intensidades calibradas.

Los CSV no se suben ni se incluyen en esta publicación. No se reconstruyen mínimos/máximos ausentes ni posición X/Y. El movimiento de calibración, motores, agarre, inercia y cabeceo siguen siendo aproximaciones. Tampoco se porta íntegramente el gestor progresivo, la huella de pista ni Wi-Fi del firmware.

Verificación de esta revisión: 18 grupos de pruebas del detector y 21 comprobaciones de navegador, incluida compatibilidad histórica y móvil.
