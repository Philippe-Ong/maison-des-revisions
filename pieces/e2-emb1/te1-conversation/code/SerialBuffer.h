#ifndef SERIAL_BUFFER_H
#define SERIAL_BUFFER_H

#include <stdint.h>
#include <stdbool.h>

// Taille du buffer
#define eMAX_BUFFER_SIZE 16

// Question b : modes du buffer
typedef enum {
    eModeFIFO,
    eModeLIFO
} BufferMode_t;

// Question d : structure et pointeurs de fonction
typedef struct SerialBuffer_s
{
    // Tableau de stockage
    char myData[eMAX_BUFFER_SIZE];

    // Indices de lecture et d'écriture
    uint16_t myWrIndex;
    uint16_t myRdIndex;

    // Pointeurs de fonction
    void (*addData)(
        struct SerialBuffer_s *const pBuf,
        char data
    );

    char (*getData)(
        struct SerialBuffer_s *const pBuf
    );

    bool (*isEmpty)(
        struct SerialBuffer_s *const pBuf
    );

    bool (*isFull)(
        struct SerialBuffer_s *const pBuf
    );

} SerialBuffer_t;

// Question e : initialisation configurable
void SerialBuffer_init(
    SerialBuffer_t *const pBuf,
    BufferMode_t mode
);

// Fonctions de gestion du buffer
void SerialBuffer_addData(
    SerialBuffer_t *const pBuf,
    char data
);

char SerialBuffer_getData(
    SerialBuffer_t *const pBuf
);

char SerialBuffer_getDataLIFO(
    SerialBuffer_t *const pBuf
);

bool SerialBuffer_isEmpty(
    SerialBuffer_t *const pBuf
);

bool SerialBuffer_isFull(
    SerialBuffer_t *const pBuf
);

#endif
