---
name: al-style-naming
description: >-
  Usar al escribir o modificar cualquier código AL de Business Central. Define
  las reglas de estilo (indentación, comentarios, modularidad) y de nombrado
  (objetos, ficheros, variables, interfaces, parámetros de eventos) que el código
  AL generado debe cumplir. Complementa al MCP bc-code-intel y a las normas de
  empresa de la skill bc365-code-intelligence.
paths:
  - "**/*.al"
---

# Estilo y nombrado AL (LiderIT)

Reglas de estilo y nombrado para todo código AL. Adaptadas de la AL Development
Collection (ALDC) de Javier Armesto (github.com/javiarmesto/ALDC-AL-Development-Collection,
MIT), ajustadas a las convenciones de LiderIT.

## Nombrado

### Nombres de objeto
PascalCase y descriptivos. Máximo 30 caracteres en total; reservando espacio para
el sufijo de LiderIT (ver skill `bc365-code-intelligence`), el nombre propio debe
dejar margen. Sin abreviaturas crípticas.

```al
// Correcto
table 50100 "Customer Ledger Entry"
codeunit 50102 "Sales Invoice Posting"

// Evitar
table 50100 "CustLE"                            // demasiado abreviado
codeunit 50102 "SIPoster"                       // abreviatura poco clara
table 50104 "Very Long Customer Ledger Entry"   // supera el límite
```

### Nombre de fichero
Patrón `<ObjectName>.<ObjectType>.al`, coincidiendo con el nombre del objeto.

```
NoSeries.Table.al        NoSeries.Page.al
SalesHeader.TableExt.al  InventorySetup.PageExt.al
INoSeries.Interface.al   NoSeriesImpl.Codeunit.al
```

### Variables y procedimientos
PascalCase y nombres descriptivos; evita abreviaturas salvo términos de negocio
bien conocidos.

```al
var
  CustomerLedgerEntry: Record "Cust. Ledger Entry";
  TotalAmount: Decimal;
  IsValidTransaction: Boolean;

procedure CalculateCustomerBalance(CustomerNo: Code[20]): Decimal
procedure ValidateSalesDocument(var SalesHeader: Record "Sales Header")
```

### Parámetros en event subscribers
Nombres descriptivos que indiquen el registro o dato, siguiendo las convenciones
de Business Central (`SalesHeader`, `Customer`), nunca genéricos como `Rec`/`xRec`
salvo que la firma del evento lo exija.

### Interfaces e implementaciones
Interfaces con prefijo `I` (`INoSeries`); implementaciones con sufijo `Impl`
(`NoSeriesImpl`), con la misma raíz y dentro del límite de caracteres.

```al
interface ICustomerService
codeunit 50100 "Customer Service Impl" implements ICustomerService
```

## Estilo

### Indentación y formato
2 espacios, sin tabuladores y sin mezclar; formato consistente dentro de cada
procedimiento.

### Documentación y comentarios
Comentarios solo cuando el "por qué" no es obvio (el código debe autodocumentarse
con buenos nombres). La documentación XML (`/// <summary>`) es obligatoria en
procedimientos `public`/globales de codeunits expuestos como API.

```al
/// <summary>
/// Valida el porcentaje de descuento contra las reglas de negocio.
/// </summary>
/// <param name="DiscountPct">Porcentaje de descuento a validar.</param>
procedure ValidateDiscountPercentage(DiscountPct: Decimal)
```

### Procedimientos modulares y enfocados
Cada procedimiento hace una sola cosa. Si supera ~40 líneas o mezcla validación +
cálculo + persistencia, divídelo.

```al
procedure PostDocument(var DocumentHeader: Record "Sales Header")
begin
  ValidateDocument(DocumentHeader);
  CalculateTotals(DocumentHeader);
  CreateLedgerEntries(DocumentHeader);
  UpdateStatus(DocumentHeader);
end;
```

> Nota: las reglas de organización de carpetas (feature-based vs. por tipo de
> objeto) NO se incluyen a propósito, porque la estructura no es uniforme entre
> los proyectos de LiderIT. Sigue la estructura del proyecto en el que trabajes.
