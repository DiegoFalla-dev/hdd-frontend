# 🔧 ARREGLO DEL ERROR 500 - Migración de Base de Datos

## ⚠️ Problema Identificado

**Error:** `Request failed with status code 500` al confirmar y pagar  
**Causa:** La columna `promotion_id` no existe en la tabla `orders`

La entidad `Order.java` intenta usar:
```java
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "promotion_id")
private Promotion promotion;
```

Pero esta columna **no fue creada** en las migraciones anteriores.

---

## ✅ Solución

Se creó la **Migración V7** que agrega la columna faltante:

**Archivo:** `src/main/resources/db/migration/V7__add_promotion_to_orders.sql`

```sql
-- Agregar columna promotion_id a la tabla orders
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS promotion_id BIGINT;

-- Agregar constraint de clave foránea
ALTER TABLE orders
ADD CONSTRAINT IF NOT EXISTS fk_order_promotion
FOREIGN KEY (promotion_id) REFERENCES promotions(id) ON DELETE SET NULL;

-- Crear índice para mejorar búsquedas
ALTER TABLE orders
ADD KEY IF NOT EXISTS idx_promotion_id (promotion_id);
```

---

## 📋 Pasos para Aplicar

### 1. Reinicia el Backend

**Opción A - Si tienes Maven instalado:**
```bash
cd hdd-backend
mvn clean spring-boot:run
```

**Opción B - Si usas IDE (IntelliJ/Eclipse):**
1. Detén la aplicación (Ctrl+C o click en Stop)
2. Espera a que se detenga completamente
3. Vuelve a ejecutar (Play button o Run → Run)
4. Espera a que vea el mensaje "Started Application" en la consola

**Opción C - Si usas Docker:**
```bash
docker-compose restart hdd-backend
```

### 2. Verifica en la Consola

Deberías ver mensajes como:
```
[FlyWay] V7__add_promotion_to_orders.sql
[FlyWay] Successfully validated 7 migrations
[FlyWay] Successfully applied 7 migrations
```

### 3. Prueba Nuevamente

1. Abre el navegador en `http://localhost:5173`
2. Selecciona entradas y dulcería
3. Aplica un código promocional (ej: `2025TODAY`)
4. Click en "Confirmar y Pagar"
5. ✅ **Debe funcionar ahora**

---

## 🧪 Validación de Éxito

Si todo está bien, deberías ver:
- ✅ Descuento aplicado correctamente
- ✅ Total calculado con IGV sobre subtotal con descuento
- ✅ Página de confirmación muestra la orden
- ✅ Compra completada exitosamente

---

## 🔍 Debuggeo si Sigue Fallando

Si aún recibes error 500:

### 1. Verifica que la migración se ejecutó
```sql
-- En MySQL/Database:
DESCRIBE orders;
-- Deberías ver una columna "promotion_id"
```

### 2. Revisa los logs del backend
Busca en la consola del servidor:
- Errores de FlyWay
- Errores de SQL
- Stack traces completos

### 3. Limpia la base de datos y reinicia
```bash
# En MySQL:
DROP DATABASE cineplus;
# Luego reinicia el backend para recrear todo
```

### 4. Verifica que la promoción exista
```sql
SELECT * FROM promotions WHERE code = '2025TODAY';
-- Debe retornar al menos 1 registro
```

---

## 📊 Resumen de Cambios

| Aspecto | Detalle |
|--------|--------|
| **Archivo** | V7__add_promotion_to_orders.sql |
| **Ubicación** | src/main/resources/db/migration/ |
| **Acción** | Agrega columna `promotion_id` a tabla `orders` |
| **Tipo de Cambio** | ALTER TABLE (no destructivo) |
| **Requiere Reinicio** | SÍ, del backend |
| **Afecta Datos Existentes** | NO, los valores serán NULL |

---

## ✨ Después del Arreglo

El sistema funcionará completamente:

✅ Usuarios pueden aplicar códigos promocionales  
✅ Descuentos se calculan correctamente  
✅ Órdenes se guardan con la promoción aplicada  
✅ Página de confirmación muestra todos los detalles  
✅ Base de datos mantiene la relación orden-promoción  

**¡Listo para completar las compras! 🎉**
