---
name: al-events
description: >-
  Usar al escribir o modificar codeunits AL de Business Central que usen eventos:
  event subscribers, integration events, patrones de extensibilidad. Define reglas
  de subscribers, integration events con IsHandled y diseño de parámetros.
  Complementa al MCP bc-code-intel.
paths:
  - "**/*.Codeunit.al"
---

# Eventos y extensibilidad AL (LiderIT)

Reglas de desarrollo orientado a eventos. Adaptadas de la AL Development
Collection (ALDC) de Javier Armesto (MIT), ajustadas a LiderIT.

## 1. Eventos para extensibilidad
Nunca modifiques objetos estándar de Business Central: extiende vía event
subscribers, table/page extensions o integration events propios. Los codeunits
que solo suscriben terminan en `Handler` y contienen únicamente subscribers, sin
lógica de negocio propia.

```al
codeunit 50100 "Sales Document Events Handler"
{
    [EventSubscriber(ObjectType::Table, Database::"Sales Header", OnBeforeInsert, '', false, false)]
    local procedure OnBeforeInsertSalesHeader(var SalesHeader: Record "Sales Header"; RunTrigger: Boolean)
    begin
        ValidateCustomFields(SalesHeader);
    end;
}
```

## 2. Integration events con patrón handled
Crea integration events en puntos lógicos del proceso, con nombres significativos
y el patrón `OnBefore`/`OnAfter`. Usa `IsHandled` cuando el subscriber deba poder
abortar el flujo por defecto.

```al
procedure CreateCustomer(var Customer: Record Customer): Boolean
var
  IsHandled: Boolean;
begin
  OnBeforeCreateCustomer(Customer, IsHandled);
  if IsHandled then
    exit(true);
  if not Customer.Insert(true) then
    exit(false);
  OnAfterCreateCustomer(Customer);
  exit(true);
end;

[IntegrationEvent(false, false)]
procedure OnBeforeCreateCustomer(var Customer: Record Customer; var IsHandled: Boolean)
begin
end;

[IntegrationEvent(false, false)]
procedure OnAfterCreateCustomer(var Customer: Record Customer)
begin
end;
```

## 3. Buenas prácticas en parámetros de eventos
Pasa registros por referencia (`var`) cuando proceda, incluye contexto suficiente
(fechas, resultado) y usa nombres descriptivos. Los subscribers deben ser `local`
y con la firma **exacta** del evento publicado: una firma desalineada compila pero
no engancha. **Nunca** hagas `Commit` dentro de un subscriber: rompe la
transacción del publicador y deja datos inconsistentes.
