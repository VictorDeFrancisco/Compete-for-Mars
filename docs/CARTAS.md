# Cartas antes de los minijuegos

Reglas iniciales implementadas a partir de las propuestas del equipo. Las cantidades son provisionales y se editan en `server/data/boardSlots.json`. La lógica autoritativa está en `server/cards.ts` y el ciclo de rondas en `server/gameEngine.ts`.

## Elección y disponibilidad

- Tres opciones comunes, distintas y aleatorias por ronda. Al menos una es Comer o Descansar. Pueden salir ambas.
- La elección y su objetivo son privados. Solo se publica si una persona ha elegido.
- Al finalizar los 25 segundos, quien no haya elegido recibe la primera carta de Comer o Descansar del tablero.
- Se conservan las profesiones de `main`: los valores iniciales y máximos son `100 + stats.health`, `100 + stats.food` y `100 + stats.energy`. Radiación inicial: 0, sin límite superior. Las cartas, incluido Intercambio, respetan los topes del destinatario.
- Descontaminación, Traje reforzado y Contagio solo salen si al generar la ronda hay algún jugador vivo contaminado. Contagio, además, solo se puede elegir si tú tienes radiación.
- Sabotaje, Robo, Intercambio y Contagio no salen en la prueba de un único jugador.
- Los objetivos deben ser otros jugadores vivos de la misma sala. Un objetivo que abandona antes de resolver cancela esa acción.
- Los costes se validan al elegir y se cobran una única vez al resolver.

## Catálogo y equilibrio provisional

| Carta | Efecto |
|---|---|
| Descansar | Fondo de 40 de energía dividido entre sus participantes. |
| Comer | Fondo independiente de 40 de comida dividido entre sus participantes. |
| Expedición | Probabilidad: vivos / 5. Éxito: +30 comida y +30 energía. Fracaso: +1 radiación. |
| Descontaminación | Un único visitante contaminado elimina toda su radiación. Varios visitantes cancelan la limpieza. Cada visitante inicialmente limpio recibe 1 de radiación, incluso si se cancela. |
| Escudo antirradiación | Bloquea la próxima recepción positiva de radiación, de cualquier origen. |
| Traje reforzado | Anula el próximo daño de radiación al final de una ronda. No elimina la radiación. |
| Reciclaje · comida | Paga 15 energía y recibe 15 comida. |
| Reciclaje · energía | Paga 15 comida y recibe 15 energía. |
| Sabotaje | Retira hasta 20 comida al objetivo. Dos sabotajes recíprocos se cancelan; terceros sabotajes siguen activos. |
| Robo de suministros | Botín total de hasta 30 comida, compartido entre los ladrones. |
| Tormenta de polvo | 50 %: +30 energía. Fracaso: −15 comida o −15 energía, al azar con igual probabilidad. |
| Cueva de hielo | 40 %: +40 comida. Fracaso: −20 vida. |
| Todo o nada | Coste: 20 energía. 1/3: +60 comida. Si falla, el coste se pierde. |
| Señal misteriosa | 60 %: +25 comida y +25 energía. Fracaso: +1 radiación. |
| Intercambio | Rotación aleatoria de las parejas de reservas (comida y energía) de quienes la elijan. Con uno solo no ocurre nada. |
| Contagio | Añade 1 radiación al objetivo inicialmente limpio, sin reducir la del emisor. Si el objetivo ya tenía radiación, no ocurre nada. |
| Aterrizaje de emergencia | Cada participante recibe +25 comida, +25 energía y +1 radiación. |

## Resolución simultánea

Las siguientes convenciones completan las propuestas ambiguas y pueden ajustarse:

1. Se fijan todos los participantes, sus reservas y su contaminación inicial. El orden de asientos no altera los efectos.
2. Se activan las defensas y se cobran los costes. Después se resuelven los intercambios.
3. Se aplican suministros, descontaminación, contagio y azar. Cada expedición tiene una tirada independiente.
4. Sabotajes y robos usan un presupuesto único de comida por víctima. Si no alcanza para todos, se reparte proporcionalmente entre las acciones; así nunca se roba comida inexistente.
5. Se aplican los abonos del robo, respetando el máximo de comida de la profesión de cada destinatario.

Para Robo se elige al jugador con más comida **entre los que no estén robando**, después de los efectos anteriores. Los empates se deshacen al azar. Si todos roban, no hay víctima y no ocurre nada. El botín se divide en enteros; los restos se asignan en un orden estable de jugadores. En Comer/Descansar, cada persona recibe `floor(40 / participantes)` y se descarta el sobrante. Alcanzar el tope de la profesión no redistribuye el excedente a otros jugadores. Lo mismo sucede cuando un intercambio entrega reservas superiores al tope del receptor.

Las defensas son cargas booleanas: repetir la misma carta no acumula varias. Persisten entre rondas hasta consumirse. El escudo también puede impedir la contaminación de un visitante limpio. El traje no se consume en una ronda sin daño de radiación.

## Radiación, eliminación y final de partida

Se conserva el orden de supervivencia de `main`: al terminar el minijuego se gastan 5 de comida y 5 de energía, el ganador recibe el premio del recurso principal (20 inicial, reducido en 2 por cada ronda posterior) y el último pierde `ronda × (muertes previas + 1)` de vida. Cada reserva que quede a cero añade 10 de daño. La radiación quita **5 puntos de vida por unidad**. El traje reforzado cancela una sola aplicación del daño de radiación; no evita el gasto, el hambre, el agotamiento ni la penalización de clasificación. Un escudo no protege de radiación que ya se tenía.

La vida puede llegar a 0. Los eliminados permanecen como observadores: no eligen, no reciben premios y no bloquean la preparación ni las entregas del resto. Si una carta mata antes del minijuego, esa persona tampoco participa. Una partida iniciada con varios jugadores termina al quedar uno (ganador). Si todos mueren al final de un minijuego, se conserva el desempate de `main`: gana el primero de la clasificación final. Si no hay clasificación (todos mueren por cartas), termina sin ganador. La prueba individual continúa hasta que su único participante muera. Para volver a competir se crea una sala nueva.

También se mantiene el sorteo de minijuegos de `main`, con al menos dos minijuegos distintos entre repeticiones. El catálogo de 17 cartas sustituye las tres cartas temporales ligadas a un solo recurso: Comer y Descansar siguen siendo fondos independientes y el resto conserva los efectos definidos por el equipo.

El resultado de la carta, las reservas y las cargas defensivas solo se envían al propio jugador. El servidor publica la vida y el resultado final de la partida, sin revelar los recursos o elecciones de los rivales.

## Verificación

`pnpm build` y `pnpm test`. La suite `server/cards.test.ts` cubre disponibilidad, fondos, costes, objetivos, azar, cancelaciones, intercambio, privacidad, defensas y eliminación. `server/socket.test.ts` comprueba objetivos inválidos, elección única y efectos entre dos clientes Socket.io reales.
