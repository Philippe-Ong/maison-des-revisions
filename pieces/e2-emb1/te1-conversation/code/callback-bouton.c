#include <stdio.h>

// 1. Définir le type du callback
typedef void (*Callback_t)(void);

// 2. Pointeur dans la HAL
static Callback_t buttonCallback = NULL;

// 3. Enregistrer le callback
void HAL_RegisterCallback(Callback_t callback)
{
    buttonCallback = callback;
}

// 4. Simuler un appui sur le bouton
void HAL_ButtonPressed(void)
{
    printf("HAL : bouton detecte\n");

    if (buttonCallback != NULL)
    {
        buttonCallback();
    }
}

// 5. Fonction de l'application
void LED_On(void)
{
    printf("Application : LED allumee\n");
}

// 6. Programme principal
int main(void)
{
    // Donner l'adresse de LED_On a la HAL
    HAL_RegisterCallback(LED_On);

    // Simuler un événement matériel
    HAL_ButtonPressed();

    return 0;
}
