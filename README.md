# snake_game

Juego de la serpiente clásico, implementado en HTML, CSS y JavaScript puro (sin dependencias).

## Reglas

- La serpiente crece cada vez que come un alimento.
- El espacio jugable empieza limitado (un recuadro pequeño en el centro del tablero) y se amplía cada 3 alimentos consumidos, hasta ocupar todo el tablero.
- El juego termina si la serpiente se muerde a sí misma o choca contra el borde del espacio jugable actual.
- El puntaje y el mejor puntaje (guardado localmente en el navegador) se muestran en pantalla.

## Cómo jugar

Abre `index.html` en tu navegador (no requiere instalación ni build). Controles:

- Flechas del teclado o `W`/`A`/`S`/`D` para moverte.
- Botón "Jugar de nuevo" para reiniciar tras perder.
