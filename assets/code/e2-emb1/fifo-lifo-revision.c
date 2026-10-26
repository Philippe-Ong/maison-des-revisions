/* Fiche E2-EMB1 : code C11 sequentiel. Proteger les acces partages en ISR. */
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>

enum { BUFFER_SIZE = 16 };

typedef struct {
    uint8_t myData[BUFFER_SIZE];
    size_t myWrIndex;  /* prochaine case a ecrire */
    size_t myRdIndex;  /* prochaine case a lire */
} Fifo;

static size_t next_index(size_t index)
{
    return (index + 1u) % BUFFER_SIZE;
}

void fifo_init(Fifo *fifo)
{
    fifo->myWrIndex = 0u;
    fifo->myRdIndex = 0u;
}

bool fifo_is_empty(const Fifo *fifo)
{
    return fifo->myWrIndex == fifo->myRdIndex;
}

bool fifo_is_full(const Fifo *fifo)
{
    return next_index(fifo->myWrIndex) == fifo->myRdIndex;
}

size_t fifo_count(const Fifo *fifo)
{
    return (fifo->myWrIndex + BUFFER_SIZE - fifo->myRdIndex)
           % BUFFER_SIZE;
}

bool fifo_push(Fifo *fifo, uint8_t value)
{
    if (fifo_is_full(fifo)) {
        return false;  /* refus : aucune donnee existante ecrasee */
    }
    fifo->myData[fifo->myWrIndex] = value;
    fifo->myWrIndex = next_index(fifo->myWrIndex);
    return true;
}

bool fifo_pop(Fifo *fifo, uint8_t *value)
{
    if (fifo_is_empty(fifo)) {
        return false;  /* *value reste inchange */
    }
    *value = fifo->myData[fifo->myRdIndex];
    fifo->myRdIndex = next_index(fifo->myRdIndex);
    return true;
}

/* LIFO classique : myTop est le nombre d'elements / prochaine case libre. */
typedef struct {
    uint8_t myData[BUFFER_SIZE];
    size_t myTop;
} Lifo;

void lifo_init(Lifo *lifo)
{
    lifo->myTop = 0u;
}

bool lifo_push(Lifo *lifo, uint8_t value)
{
    if (lifo->myTop == BUFFER_SIZE) {
        return false;
    }
    lifo->myData[lifo->myTop] = value;
    ++lifo->myTop;
    return true;
}

bool lifo_pop(Lifo *lifo, uint8_t *value)
{
    if (lifo->myTop == 0u) {
        return false;
    }
    --lifo->myTop;
    *value = lifo->myData[lifo->myTop];
    return true;
}

/* Variante d'annale : retirer le dernier ecrit d'un buffer circulaire.
 * A utiliser en mode LIFO exclusif, sans producteur concurrent. */
bool circular_lifo_pop(Fifo *buffer, uint8_t *value)
{
    if (fifo_is_empty(buffer)) {
        return false;
    }
    const size_t previous =
        (buffer->myWrIndex + BUFFER_SIZE - 1u) % BUFFER_SIZE;
    *value = buffer->myData[previous];
    buffer->myWrIndex = previous;
    return true;
}
