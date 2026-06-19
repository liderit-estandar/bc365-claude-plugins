---
name: al-error-handling
description: >-
  Usar al escribir o modificar codeunits AL de Business Central que manejen
  errores, validaciones o mensajes al usuario. Define reglas de TryFunction, uso
  de Labels (alineadas con la convención de textos de LiderIT), y telemetría.
  Complementa al MCP bc-code-intel y a la skill bc365-code-intelligence.
paths:
  - "**/*.Codeunit.al"
---

# Manejo de errores AL (LiderIT)

Reglas de manejo de errores para codeunits. Adaptadas de la AL Development
Collection (ALDC) de Javier Armesto (MIT), ajustadas a LiderIT.

## 1. TryFunction para operaciones que pueden fallar
Úsala cuando la operación pueda fallar por causas externas (HTTP, parsing,
llamadas a otra app) o necesite rollback. Recupera el texto con
`GetLastErrorText()`. Nunca dejes un error sin registrar ni propagar (un
`if not TryX() then exit;` sin más es un bug).

```al
procedure ProcessPayment(Amount: Decimal): Boolean
var
  ErrorText: Text;
  PaymentFailedLbl: Label 'Payment processing failed: %1', Comment = 'ESP="Fallo al procesar el pago: %1"; %1 = Error message';
  PaymentFailedTelemetryLbl: Label 'Payment processing failed', Locked = true;
begin
  if not TryProcessPaymentInternal(Amount) then begin
    ErrorText := GetLastErrorText();
    LogError(PaymentFailedTelemetryLbl, ErrorText);
    Message(PaymentFailedLbl, ErrorText);
    exit(false);
  end;
  exit(true);
end;

[TryFunction]
local procedure TryProcessPaymentInternal(Amount: Decimal)
begin
  PaymentService.ProcessPayment(Amount);
end;
```

## 2. Todos los mensajes en Label (convención de LiderIT)
Todo texto de error/aviso/mensaje va en un `Label`, nunca como literal en línea en
`Error`, `Message` o `Confirm`. Convención de textos de LiderIT: literal en
**inglés** y traducción al **castellano** en el `Comment` con formato `ESP="..."`
(ver skill `bc365-code-intelligence`). Identificadores técnicos no traducibles
(telemetría, claves): `Locked = true`.

```al
// Correcto
procedure ValidateBusinessLogic(SalesHeader: Record "Sales Header")
var
  CustomerNotFoundErr: Label 'Customer %1 does not exist for sales document %2.', Comment = 'ESP="El cliente %1 no existe para el documento de venta %2."; %1 = Customer No., %2 = Sales Header No.';
  EmptyHeaderNoErr: Label 'Sales header number cannot be empty.', Comment = 'ESP="El número de cabecera de venta no puede estar vacío."';
begin
  if SalesHeader."No." = '' then
    Error(EmptyHeaderNoErr);
  if not Customer.Get(SalesHeader."Sell-to Customer No.") then
    Error(CustomerNotFoundErr, SalesHeader."Sell-to Customer No.", SalesHeader."No.");
end;
```

```al
// Evitar — literales codificados
if not Customer.Get(SalesHeader."Sell-to Customer No.") then
  Error('Customer not found');
```

## 3. Prioriza la corrección sobre la compilación inmediata
Si la lógica de negocio es correcta pero hay dudas sobre nombres de funciones o
firmas de eventos base, mantén la lógica correcta y deja espacio para corrección
manual, en lugar de alterar el comportamiento previsto solo para que compile.

## 4. Telemetría personalizada solo si se pide
Añade `Session.LogMessage` solo cuando el usuario lo pida expresamente. Con
verbosidad y clasificación de datos adecuadas, dimensiones de contexto y scope
`ExtensionPublisher`.

```al
TelemetryCustomDimensions.Add('DocumentType', Format(SalesHeader."Document Type"));
Session.LogMessage('SAL001', SalesDocPostedMsg,
                   Verbosity::Normal, DataClassification::SystemMetadata,
                   TelemetryScope::ExtensionPublisher, TelemetryCustomDimensions);
```
