#include "SerialBuffer.h"
#include <assert.h>
#include <stddef.h>

// ==========================================
// Vérifier si le buffer est vide
// ==========================================

bool SerialBuffer_isEmpty(
    SerialBuffer_t *const pBuf
)
{
    assert(pBuf != NULL);

    return (pBuf->myWrIndex == pBuf->myRdIndex);
}

// ==========================================
// Vérifier si le buffer est plein
// ==========================================

bool SerialBuffer_isFull(
    SerialBuffer_t *const pBuf
)
{
    assert(pBuf != NULL);

    return (
        (pBuf->myWrIndex + 1U) % eMAX_BUFFER_SIZE
        == pBuf->myRdIndex
    );
}

// ==========================================
// Ajouter un caractère au buffer
// Identique pour FIFO et LIFO
// ==========================================

void SerialBuffer_addData(
    SerialBuffer_t *const pBuf,
    char data
)
{
    assert(pBuf != NULL);
    assert(!SerialBuffer_isFull(pBuf));

    // Ecrire le caractère
    pBuf->myData[pBuf->myWrIndex] = data;

    // Avancer l'indice d'écriture
    pBuf->myWrIndex =
        (pBuf->myWrIndex + 1U) % eMAX_BUFFER_SIZE;
}

// ==========================================
// Question c : Lecture FIFO
// First In, First Out
// ==========================================

char SerialBuffer_getData(
    SerialBuffer_t *const pBuff
)
{
    assert(pBuff != NULL);
    assert(!SerialBuffer_isEmpty(pBuff));

    // Lire le plus ancien caractère
    char const cData =
        pBuff->myData[pBuff->myRdIndex];

    // Avancer l'indice de lecture
    pBuff->myRdIndex =
        (pBuff->myRdIndex + 1U) % eMAX_BUFFER_SIZE;

    return cData;
}

// ==========================================
// Question c : Lecture LIFO
// Last In, First Out
// ==========================================

char SerialBuffer_getDataLIFO(
    SerialBuffer_t *const pBuff
)
{
    assert(pBuff != NULL);
    assert(!SerialBuffer_isEmpty(pBuff));

    // Trouver la dernière position écrite
    uint16_t const cIndexOfLastWrite =
        (pBuff->myWrIndex + eMAX_BUFFER_SIZE - 1U)
        % eMAX_BUFFER_SIZE;

    // Lire le dernier caractère
    char const cData =
        pBuff->myData[cIndexOfLastWrite];

    // Reculer l'indice d'écriture
    pBuff->myWrIndex = cIndexOfLastWrite;

    return cData;
}

// ==========================================
// Question e : Initialisation configurable
// ==========================================

void SerialBuffer_init(
    SerialBuffer_t *const pBuf,
    BufferMode_t mode
)
{
    assert(pBuf != NULL);
    assert(mode == eModeFIFO || mode == eModeLIFO);

    // Initialiser les indices
    pBuf->myWrIndex = 0;
    pBuf->myRdIndex = 0;

    // Fonctions communes
    pBuf->addData = &SerialBuffer_addData;
    pBuf->isEmpty = &SerialBuffer_isEmpty;
    pBuf->isFull  = &SerialBuffer_isFull;

    // Choisir la fonction de lecture
    pBuf->getData =
        (mode == eModeFIFO)
        ? &SerialBuffer_getData
        : &SerialBuffer_getDataLIFO;
}
