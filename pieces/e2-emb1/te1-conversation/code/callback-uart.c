#include <stdio.h>

typedef void (*UART_Callback_t)(char);

// Pointeur de fonction
static UART_Callback_t rxCallback = NULL;

// Enregistrer le callback
void UART_RegisterCallback(UART_Callback_t callback)
{
    rxCallback = callback;
}

// Simuler la reception d'un caractère
void UART_Receive(char data)
{
    if (rxCallback != NULL)
    {
        rxCallback(data);
    }
}

// Fonction de l'application
void Application_OnReceive(char character)
{
    printf("Caractere recu : %c\n", character);
}

int main(void)
{
    // Enregistrer le callback
    UART_RegisterCallback(Application_OnReceive);

    // Simuler les receptions
    UART_Receive('A');
    UART_Receive('B');
    UART_Receive('C');

    return 0;
}
