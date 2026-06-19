---
name: al-performance
description: >-
  Usar al escribir o modificar codeunits y queries AL de Business Central. Define
  reglas de rendimiento (filtrado temprano, SetLoadFields, tablas temporales,
  operaciones de conjunto, escrituras mínimas) con ejemplos. Complementa al MCP
  bc-code-intel.
paths:
  - "**/*.Codeunit.al"
  - "**/*.Query.al"
---

# Rendimiento AL (LiderIT)

Reglas de rendimiento para código AL. Adaptadas de la AL Development Collection
(ALDC) de Javier Armesto (MIT), ajustadas a LiderIT.

## 1. Filtrado temprano y optimización de consultas
Filtra lo antes posible; aplica filtros antes de procesar y usa claves adecuadas.

```al
// Correcto
Customer.SetRange(City, CityFilter);
Customer.SetRange(Blocked, Customer.Blocked::" ");
if Customer.FindSet() then
  repeat
    // procesa solo los ya filtrados
  until Customer.Next() = 0;
```

```al
// Evitar — procesar todo y filtrar dentro
if Customer.FindSet() then
  repeat
    if (Customer.City = CityFilter) then
      Count += 1;
  until Customer.Next() = 0;
```

## 2. SetLoadFields para recuperar solo lo necesario
Colócalo antes del `Get`/`Find`; solo los campos a usar. No listes campos de clave
primaria: la plataforma los carga sola.

```al
// Correcto — antes del filtro y del Find
Item.SetRange("Third Party Item Exists", false);
Item.SetLoadFields("Item Category Code");
Item.FindFirst();
```

```al
// Evitar — después de filtrar
Item.SetLoadFields("Item Category Code");
Item.SetRange("Third Party Item Exists", false);
Item.FindFirst();
```

## 3. Tablas temporales, diccionarios y listas
Temporal para datos estructurados, `Dictionary` para clave-valor, `List` para
colecciones simples; evita golpear la BD repetidamente.

```al
// Correcto — cargar una vez y procesar varias sin ir a BD
if SalesLine.FindSet() then
  repeat
    TempSalesLine := SalesLine;
    TempSalesLine.Insert();
  until SalesLine.Next() = 0;
ProcessDiscounts(TempSalesLine);
CalculateTotals(TempSalesLine);
```

```al
// Correcto — diccionario como caché
if Customer.FindSet() then
  repeat
    CustomerCache.Add(Customer."No.", Customer.Name);
  until Customer.Next() = 0;
```

## 4. Operaciones de conjunto en vez de bucles
Usa agregación de plataforma (`CalcSums`, `CalcFields`) en lugar de iterar y
acumular. Evita bucles anidados.

```al
// Correcto
CustLedgerEntry.SetRange("Customer No.", CustomerNo);
CustLedgerEntry.CalcSums(Amount);
exit(CustLedgerEntry.Amount);
```

```al
// Evitar — acumulación manual
if CustLedgerEntry.FindSet() then
  repeat
    TotalAmount += CustLedgerEntry.Amount;
  until CustLedgerEntry.Next() = 0;
```

## 5. Una sola escritura por registro
Calcula todo en memoria y emite un único `Modify(true)`. Para volúmenes grandes,
procesa por lotes.

```al
// Correcto
CalculateCustomerTotals(CustomerNo, TotalBalance, LastPaymentDate);
Customer.SetLoadFields("Balance (LCY)", "Last Payment Date");
if Customer.Get(CustomerNo) then begin
  Customer."Balance (LCY)" := TotalBalance;
  Customer."Last Payment Date" := LastPaymentDate;
  Customer.Modify(true);
end;
```
