#include <stdio.h>
#include <string.h>
#include "SerialBuffer.h"

#define STR_SIZE 20

char const cStringToTest[STR_SIZE] = "desserts";

// ==========================================
// Question a : Test FIFO simple
// ==========================================

void testBuffer(char const text[])
{
    SerialBuffer_t myBuffer;
    size_t const cTextLen = strlen(text);

    printf("String to test             : \"%s\"\n",
           text);

    // Initialiser le buffer en FIFO
    SerialBuffer_init(&myBuffer, eModeFIFO);

    // Ajouter les caractères
    for (size_t i = 0;
         i < cTextLen &&
         !SerialBuffer_isFull(&myBuffer);
         i++)
    {
        SerialBuffer_addData(&myBuffer, text[i]);
    }

    // Relire les caractères
    printf("Reading back stored string : \"");

    while (!SerialBuffer_isEmpty(&myBuffer))
    {
        printf("%c", SerialBuffer_getData(&myBuffer));
    }

    printf("\"\n");
}

// ==========================================
// Question f : Test configurable FIFO/LIFO
// ==========================================

void testBufferConfigurable(
    char const text[],
    BufferMode_t mode
)
{
    SerialBuffer_t myBuffer;
    size_t const cTextLen = strlen(text);

    printf("String to test             : \"%s\"\n",
           text);

    // Configuration FIFO ou LIFO
    SerialBuffer_init(&myBuffer, mode);

    // Ecriture avec pointeurs de fonction
    for (size_t i = 0;
         i < cTextLen &&
         !myBuffer.isFull(&myBuffer);
         i++)
    {
        myBuffer.addData(&myBuffer, text[i]);
    }

    // Lecture avec pointeurs de fonction
    printf("Reading back stored string : \"");

    while (!myBuffer.isEmpty(&myBuffer))
    {
        printf("%c", myBuffer.getData(&myBuffer));
    }

    printf("\"\n");
}

// ==========================================
// Question g : Main
// ==========================================

int main(void)
{
    // Question a : version FIFO simple
    // Décommenter pour tester :
    // testBuffer(cStringToTest);

    // Test FIFO configurable
    testBufferConfigurable(
        cStringToTest,
        eModeFIFO
    );

    // Test LIFO configurable
    testBufferConfigurable(
        cStringToTest,
        eModeLIFO
    );

    return 0;
}
