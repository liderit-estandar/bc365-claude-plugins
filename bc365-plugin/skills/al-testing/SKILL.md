---
name: al-testing
description: >-
  Usar al escribir o modificar tests AL de Business Central (ficheros bajo
  carpetas test/). Define cuándo generar tests, la separación App/Test de AL-Go y
  las buenas prácticas de unit testing con librerías estándar y patrón
  Given/When/Then. Complementa al MCP bc-code-intel.
paths:
  - "**/test/**/*.al"
  - "**/Test/**/*.al"
---

# Testing AL (LiderIT)

Reglas para tests AL. Adaptadas de la AL Development Collection (ALDC) de Javier
Armesto (MIT), ajustadas a LiderIT.

## 1. No generar tests salvo petición explícita
No generes tests automáticamente. El foco por defecto es la App. Genera tests solo
ante peticiones del tipo "crea tests para…", "añade cobertura", "escribe unit
tests…".

## 2. Separación App/Test (AL-Go)
Los tests solo en el proyecto `Test`, nunca en `App`. El `app.json` de Test
referencia al de App como dependencia (e incluye frameworks como `Library
Assert`); el de App **no** depende del de Test.

## 3. Buenas prácticas de unit testing
Codeunits con `Subtype = Test` y librerías estándar (`Codeunit Assert`,
`Library - Sales`, `Library - Inventory`, `Library - ERM`, `Library - Random`)
para crear datos y registrar documentos; no construyas registros a mano. Nombres
de método en patrón `GivenX_WhenY_ThenZ`, y cada test termina con `Assert.*`
explícitos.

```al
codeunit 50200 "Customer Management Tests"
{
    Subtype = Test;

    var
        Assert: Codeunit Assert;
        LibrarySales: Codeunit "Library - Sales";
        LibraryRandom: Codeunit "Library - Random";

    [Test]
    procedure GivenValidCustomer_WhenCreatingCustomer_ThenCustomerIsCreated()
    var
        Customer: Record Customer;
        CustomerManagement: Codeunit "Customer Management";
        CustomerNo: Code[20];
    begin
        // Given
        LibrarySales.CreateCustomer(Customer);
        Customer."Credit Limit (LCY)" := LibraryRandom.RandDec(10000, 2);
        // When
        CustomerNo := CustomerManagement.CreateCustomer(Customer);
        // Then
        Assert.IsTrue(Customer.Get(CustomerNo), 'Customer should be created');
    end;
}
```
