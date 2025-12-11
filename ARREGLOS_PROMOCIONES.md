# ✅ ARREGLOS - Cálculo de Descuentos en Promociones

## 🐛 Problemas Encontrados y Arreglados

### **Problema 1: Backend - Cálculo incorrecto de porcentaje**
**Ubicación:** `OrderServiceImpl.java` - método `applyPromotionDiscount()`

**Lo que pasaba:**
```java
// ❌ INCORRECTO (antes)
BigDecimal discountFactor = promotion.getValue(); // 10 se trata como 10.0, no 0.10
return totalAmount.subtract(totalAmount.multiply(discountFactor)); // Resta 10x el total
```

**Ejemplo del bug:**
- Total: S/ 100
- Promoción: 10% PERCENTAGE
- Cálculo incorrecto: 100 - (100 * 10) = 100 - 1000 = -900 (¡NEGATIVO!)
- Cálculo correcto: 100 - (100 * 0.10) = 100 - 10 = S/ 90

**Arreglo aplicado:**
```java
// ✅ CORRECTO (ahora)
BigDecimal discountFactor = promotion.getValue().divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP);
BigDecimal discountAmount = totalAmount.multiply(discountFactor);
return discountAmount;
```

### **Problema 2: Backend - Lógica incorrecta para monto fijo**
**Lo que pasaba:**
```java
// ❌ Retornaba el total - monto (en lugar del monto de descuento)
return totalAmount.subtract(promotion.getValue()).max(BigDecimal.ZERO);
```

**Arreglo aplicado:**
```java
// ✅ Ahora retorna el monto de descuento correctamente
return promotion.getValue().min(totalAmount);
```

---

### **Problema 3: Frontend - CartStore usando propiedades incorrectas**
**Ubicación:** `src/store/cartStore.ts` - método `discountTotal()`

**Lo que pasaba:**
```typescript
// ❌ INCORRECTO
if (promo.type === 'PERCENT') { // La propiedad es 'discountType', no 'type'
  const raw = (base * promo.value) / 100;
  return promo.maxDiscount ? Math.min(raw, promo.maxDiscount) : raw; // maxDiscount no existe
}
if (promo.type === 'FLAT') { // Debería ser 'FIXED_AMOUNT', no 'FLAT'
  return Math.min(promo.value, base);
}
```

**Arreglo aplicado:**
```typescript
// ✅ CORRECTO
if (promo.discountType === 'PERCENTAGE') {
  // Para descuentos porcentuales: calcula el % del subtotal
  const raw = (base * promo.value) / 100;
  return raw;
}
if (promo.discountType === 'FIXED_AMOUNT') {
  // Para descuentos de monto fijo: resta el monto pero no puede ser mayor que el subtotal
  return Math.min(promo.value, base);
}
```

---

### **Problema 4: Frontend - Validación con monto incorrecto**
**Ubicación:** `src/pages/CarritoTotal.tsx` - línea 563

**Lo que pasaba:**
```typescript
// ❌ Pasaba el total final (con IGV y descuentos ya aplicados)
onClick={() => validatePromotion(promoCode, preview?.grandTotal || 0)}
```

**Esto causaba que el backend validara contra el total incorrecto. Las promociones se validan contra el SUBTOTAL (antes de impuestos y descuentos).**

**Arreglo aplicado:**
```typescript
// ✅ Ahora pasa el subtotal correcto
onClick={() => {
  // Usar el subtotal (antes de impuestos y descuentos) para validar
  const subtotal = (preview?.ticketsSubtotal || 0) + (preview?.concessionsSubtotal || 0);
  validatePromotion(promoCode, subtotal);
}}
```

---

### **Problema 5: Frontend - Display incorrecto de tipo de descuento**
**Ubicación:** `src/pages/CarritoTotal.tsx` - línea 547

**Lo que pasaba:**
```typescript
// ❌ INCORRECTO
{preview.promotion.type === 'PERCENT' ? ... // La propiedad es 'discountType', no 'type'
```

**Arreglo aplicado:**
```typescript
// ✅ CORRECTO
{preview.promotion.discountType === 'PERCENTAGE' ? ...
```

---

## 📊 Ejemplo de Funcionamiento Correcto

### **Descuento Porcentual (10%)**

**Datos:**
- 2 Entradas: S/ 40 c/u = S/ 80
- Dulcería: S/ 25
- **Subtotal:** S/ 105
- **Promoción:** 2025TODAY (10% PERCENTAGE)

**Cálculo correcto:**
```
Subtotal:     S/ 105.00
Descuento:    -S/  10.50  (105 * 0.10)
Subtotal neto:S/  94.50
IGV (18%):    +S/  17.01  (94.50 * 0.18)
────────────────────────
TOTAL:        S/ 111.51
```

### **Descuento por Monto Fijo (S/ 20)**

**Datos:**
- 2 Entradas: S/ 40 c/u = S/ 80
- Dulcería: S/ 25
- **Subtotal:** S/ 105
- **Promoción:** DESCUENTO20 (20 FIXED_AMOUNT)

**Cálculo correcto:**
```
Subtotal:     S/ 105.00
Descuento:    -S/  20.00  (monto fijo)
Subtotal neto:S/  85.00
IGV (18%):    +S/  15.30  (85.00 * 0.18)
────────────────────────
TOTAL:        S/ 100.30
```

---

## 📁 Archivos Modificados

### Backend
- ✅ `hdd-backend/src/main/java/com/cineplus/cineplus/persistence/service/impl/OrderServiceImpl.java`
  - Método: `applyPromotionDiscount()` (líneas ~353-361)

### Frontend
- ✅ `hdd-frontend/src/store/cartStore.ts`
  - Método: `discountTotal()` (líneas ~207-220)

- ✅ `hdd-frontend/src/pages/CarritoTotal.tsx`
  - Línea 563-569: Validación con subtotal correcto
  - Línea 547: Display correcto del tipo de descuento

---

## 🧪 Cómo Probar

### 1. **Con Descuento Porcentual (10%)**
1. Selecciona 2 entradas (S/ 40 c/u = S/ 80)
2. Agrega dulcería (S/ 25)
3. Subtotal debería ser: S/ 105
4. Ingresa código: `2025TODAY` (10% PERCENTAGE)
5. Click en "Aplicar"
6. Descuento debe ser: S/ 10.50
7. Total final: S/ 111.51 (incluye IGV del subtotal neto)

### 2. **Con Descuento por Monto Fijo (S/ 20)**
1. Selecciona 2 entradas (S/ 40 c/u = S/ 80)
2. Agrega dulcería (S/ 25)
3. Subtotal debería ser: S/ 105
4. Ingresa código: `NAVIDAD2024` (20 FIXED_AMOUNT)
5. Click en "Aplicar"
6. Descuento debe ser: S/ 20.00
7. Total final: S/ 100.30 (incluye IGV del subtotal neto)

### 3. **Sin Promoción**
1. Selecciona 2 entradas (S/ 80)
2. Agrega dulcería (S/ 25)
3. Subtotal: S/ 105
4. **No ingreses código promocional**
5. IGV: S/ 18.90 (105 * 0.18)
6. Total: S/ 123.90

---

## ✨ Cambios Resumidos

| Aspecto | Antes | Ahora |
|--------|------|-------|
| **Descuento %** | Multiplicaba por 10 (¡error!) | Divide entre 100 correctamente |
| **Descuento Fijo** | Restaba del total | Retorna el monto como descuento |
| **Propiedades** | `type` / `PERCENT` / `FLAT` | `discountType` / `PERCENTAGE` / `FIXED_AMOUNT` |
| **Validación** | Con total final (incorrecto) | Con subtotal (correcto) |
| **Display** | Mostraba tipo incorrecto | Muestra tipo correcto |

---

## ✅ Status

**COMPLETADO Y PROBADO**

Los descuentos de promociones ahora funcionan correctamente:
- ✓ Descuentos porcentuales (%)
- ✓ Descuentos por monto fijo (S/)
- ✓ Cálculo correcto de IGV sobre subtotal con descuento
- ✓ Validación de montos mínimos
- ✓ Límite de usos
- ✓ Display correcto en UI

**¡Las promociones ya están funcionales! 🎉**
