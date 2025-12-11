# 🎟️ Panel de Administración de Promociones

## Acceso

**Para acceder al panel de administración:**

1. Navega a: `http://localhost:5173/staff`
2. O desde la Navbar: **Staff** → **Panel de Administración**
3. Haz click en la tarjeta: **"Gestionar Promociones"**
4. O directamente: `http://localhost:5173/staff/promotions`

**Requisitos:**
- Estar autenticado
- Tener rol: **STAFF** o **ADMIN**

---

## Interfaz

### 📋 Secciones

#### 1. **Nueva Promoción / Editar Promoción** (Arriba)
Formulario para crear o editar códigos promocionales

#### 2. **Promociones** (Abajo)
Tabla listando todas las promociones con búsqueda

---

## 🆕 Crear Promoción

### Pasos:

1. **Rellena los campos obligatorios (*):**

   - **Código**: Texto único, sin espacios (ej: `NAVIDAD2024`)
     - Se convierte automáticamente a MAYÚSCULAS
     - No se puede cambiar después de crear
   
   - **Descripción**: Texto descriptivo para los usuarios
     - Ej: "Descuento especial de Navidad - 20% en todas tus compras"
   
   - **Tipo de Descuento**: Elige uno:
     - **Porcentaje (%)**: Descuento relativo (20% de $150 = $30)
     - **Monto Fijo (S/.)**: Descuento fijo (S/ 50 siempre)
   
   - **Valor**: Número según el tipo
     - Porcentaje: 0-100 (ej: 20 para 20%)
     - Monto: Cantidad en soles (ej: 50 para S/ 50)
   
   - **Fecha Inicio**: Cuándo comienza la promoción
   - **Fecha Fin**: Cuándo termina la promoción
     - Debe ser DESPUÉS de la fecha de inicio

2. **Rellena los campos opcionales:**

   - **Monto Mínimo**: Compra mínima requerida
     - Ej: 100 (usuario debe gastar mínimo S/ 100)
   
   - **Máximo de Usos**: Límite de veces que se puede usar
     - Ej: 1000 (se puede usar hasta 1000 veces)
     - Dejar vacío = ilimitado

3. **Estado:**
   - Marcar "Activa" para que esté disponible
   - Desmarcar para desactivarla sin borrar

4. **Haz click en:**
   - **Botón "➕ Crear"** para crear
   - Se confirma con mensaje de éxito

### Validaciones:
- ✓ Código requerido
- ✓ Descripción requerida
- ✓ Valor > 0
- ✓ Fechas requeridas
- ✓ Fecha inicio < Fecha fin

---

## ✏️ Editar Promoción

### Pasos:

1. En la tabla, busca la promoción a editar
2. Haz click en el botón **"✎"** (lápiz)
3. El formulario se carga con los datos
4. Modifica lo que necesites
5. **Nota**: El código NO se puede cambiar
6. Haz click en **"💾 Actualizar"**
7. Haz click en **"✕ Cancelar"** para descartar cambios

---

## 🗑️ Eliminar Promoción

### Pasos:

1. En la tabla, busca la promoción
2. Haz click en el botón **"🗑"** (basura)
3. Confirma en el popup: "¿Estás seguro?"
4. Se elimina permanentemente

---

## 🔍 Buscar Promoción

1. Usa el campo de búsqueda en la tabla
2. Escribe:
   - Código de promoción (ej: `NAVIDAD2024`)
   - Parte de la descripción (ej: `Navidad`, `descuento`)
3. Los resultados se filtran automáticamente

---

## 📊 Columnas de la Tabla

| Columna | Descripción |
|---------|-------------|
| **Código** | Código único de la promoción (en rojo) |
| **Descuento** | Tipo y valor (% o S/) en verde |
| **Descripción** | Primeras 60 caracteres de la descripción |
| **Rango de Fechas** | Fecha inicio → Fecha fin (formato DD/MM/YYYY) |
| **Mín./Máx.** | Monto mínimo / Máximo de usos (∞ = ilimitado) |
| **Estado** | Indicador de si está activa o inactiva |
| **Acciones** | Botones editar (✎) y eliminar (🗑) |

### Indicadores de Estado:

- **✓ Activa** (verde): Está disponible para usuarios
  - Cumple: is_active=true + en rango de fechas + no agotada
  
- **○ Inactiva** (gris): No disponible para usuarios
  - Razones: está desactivada, vencida o agotada

### Filas atenuadas:
- Promociones inactivas aparecen con menos opacidad

---

## 📈 Ejemplo Completo

### Crear una promoción navideña:

```
Código:           NAVIDAD2024
Descripción:      Descuento especial de Navidad - 20% en todas tus compras
Tipo:             Porcentaje (%)
Valor:            20
Fecha Inicio:     2024-12-01 00:00
Fecha Fin:        2024-12-25 23:59
Monto Mínimo:     50 (compra mínima S/ 50)
Máximo de Usos:   1000 (se puede usar 1000 veces)
Estado:           ✓ Activa
```

**Resultado:**
- Usuario gasta S/ 100
- Descuento: 20% de S/ 100 = S/ 20
- Subtotal: S/ 80
- IGV (18%): S/ 14.40
- Total: S/ 94.40

---

## ⚠️ Casos Especiales

### Promoción próxima a vencer (≤7 días)
- No se muestra diferente en el panel admin
- Para usuarios: Se muestra badge rojo "¡Vence en X días!"

### Promoción agotada (current_uses ≥ max_uses)
- Sigue apareciendo en la tabla
- Estado muestra como inactiva
- Ya no aparece en `/promociones` para usuarios
- No se puede validar en `/api/promotions/validate`

### Promoción vencida (end_date < now)
- Sigue apareciendo en la tabla (para referencia histórica)
- Estado muestra como inactiva
- Ya no aparece en `/promociones` para usuarios
- No se puede validar

---

## 💡 Mejores Prácticas

### Código:
- ✓ Usa nombres descriptivos y en MAYÚSCULAS
- ✓ Sin espacios ni caracteres especiales (solo letras/números)
- ✓ Ej: `NAVIDAD2024`, `ESTUDIANTE15`, `WEEKEND50`

### Descripción:
- ✓ Sé claro y conciso (máx 200 caracteres)
- ✓ Incluye condiciones importantes
- ✓ Ej: "20% descuento + compra mínima S/ 100"

### Fechas:
- ✓ Siempre fecha inicio en pasado o presente
- ✓ Fecha fin en futuro (idealmente)
- ✓ Usa formatos claros (ej: 2024-12-25 para fin de año)

### Límites:
- ✓ Para promociones masivas: usa max_uses alto (2000+)
- ✓ Para promociones limitadas: usa max_uses bajo (100-500)
- ✓ Sin límite = dejar vacío (no poner 0)

### Montos Mínimos:
- ✓ 20% descuento: mínimo S/ 80 (requiere gasto de S/ 100+)
- ✓ S/ 50 descuento: mínimo S/ 150 (compra de tamaño medio)
- ✓ Estudiantiles: mínimo S/ 80 (2 entradas)

---

## 🎯 Flujo de una Promoción

```
1. ADMIN crea en /staff/promotions
   ├─ Código: NAVIDAD2024
   ├─ Activa desde: 01/12/2024
   └─ Válida hasta: 25/12/2024

2. USUARIOS ven en /promociones
   ├─ Card con código y descuento
   ├─ Botón "Copiar Código"
   └─ Botón "Usar Código"

3. USUARIO ingresa código en /pago
   ├─ Sistema valida
   ├─ Aplica descuento
   └─ Recalcula total

4. ADMIN puede en /staff/promotions
   ├─ Ver usos: current_uses/max_uses
   ├─ Editar descuento
   ├─ Extender fecha
   └─ Desactivar o borrar

5. Automáticamente:
   ├─ Cuando vence: ya no aparece para usuarios
   ├─ Si se agota: contador llega a max_uses
   └─ Si se desactiva: is_active = false
```

---

## ❓ Preguntas Frecuentes

**P: ¿Se puede cambiar el código después de crear?**
- R: No, el código es inmutable. Si necesitas cambiar, borra y recrea.

**P: ¿Qué pasa cuando se agota una promoción?**
- R: current_uses llega a max_uses. Ya no aparece para usuarios, pero sigue en la tabla.

**P: ¿Puedo crear una promoción con fecha pasada?**
- R: Sí, pero no aparecerá en `/promociones` hasta que sea presente/futura.

**P: ¿El monto mínimo es para IGV o subtotal?**
- R: Es para el subtotal (antes de IGV).

**P: ¿Cuál es el descuento máximo?**
- R: Técnicamente ilimitado, pero recomendamos no más de 50%.

**P: ¿Puedo crear descuentos negativos?**
- R: No, el sistema valida que value > 0.

**P: ¿Se puede usar un código varias veces por usuario?**
- R: Sí, el límite max_uses es global, no por usuario.

---

## 📞 Soporte

Si tienes problemas:

1. Verifica que estés logueado como STAFF/ADMIN
2. Revisa la consola (F12 → Console) por errores
3. Verifica que el backend está corriendo (`localhost:8080`)
4. Recarga la página (Ctrl+F5)

---

**¡Listo para administrar promociones! 🎬**
