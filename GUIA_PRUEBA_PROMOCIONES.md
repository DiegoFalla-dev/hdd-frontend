# 🎬 Guía de Prueba - Página de Promociones

## Pasos para Probar la Implementación

### 1️⃣ Preparar Base de Datos

**Opción A - Automático (Recomendado):**
- Reinicia el backend. Flyway ejecutará automáticamente `V6__insert_promotional_codes.sql`

**Opción B - Manual:**
```bash
# En MySQL/MariaDB GUI (DBeaver, MySQL Workbench, etc.)
1. Abre el proyecto hdd-backend
2. Abre: src/main/resources/db/migration/V6__insert_promotional_codes.sql
3. Ejecuta el script completo
```

**Opción C - Línea de comandos:**
```bash
mysql -u root -p cineplus_db < insert_promotional_codes_manual.sql
```

### 2️⃣ Verificar Datos en BD

```sql
USE cineplus_db;
SELECT * FROM promotions ORDER BY id DESC;
```

**Resultado esperado:** 8 registros con promociones

### 3️⃣ Iniciar Aplicación Backend

```bash
cd hdd-backend
mvn clean spring-boot:run
```

Espera a ver: `Tomcat started on port 8080`

### 4️⃣ Iniciar Aplicación Frontend

```bash
cd hdd-frontend
npm run dev
```

Verás: `Local: http://localhost:5173/`

### 5️⃣ Navegar a la Página de Promociones

**Opción A - Por URL:**
```
http://localhost:5173/promociones
```

**Opción B - Por Navbar:**
1. Ve a `http://localhost:5173/`
2. Click en "Promociones" en la navbar

## ✅ Verificaciones

### Visual
- [ ] Se cargan 8 tarjetas de promociones
- [ ] Cada tarjeta muestra:
  - Código (ej: NAVIDAD2024)
  - Tipo de descuento (% o S/)
  - Descripción
  - Fecha de expiración
  - Monto mínimo (si aplica)
  - Usos disponibles (si aplica)
- [ ] La interfaz es responsive (prueba en mobile)

### Funcional
- [ ] Botón "Copiar Código" funciona
  - Click → debe mostrar "✓ Copiado"
  - Código se copia al clipboard
  - Puedes pegar en otra aplicación
- [ ] Botón "Usar Código" redirige a `/cartelera`
- [ ] Las fechas son legibles (formato: "25 de diciembre de 2024")

### Promociones Próximas a Vencer
- [ ] Si alguna promoción vence en ≤7 días:
  - Debe mostrar badge naranja: "¡Vence en X día(s)!"
  - Tarjeta tiene borde naranja
  - Animación de pulso

### Integración con Carrito
1. Copia código: `NAVIDAD2024`
2. Ve a `/cartelera`
3. Selecciona película y horario
4. Completa selección de asientos
5. En `/pago`, ingresa el código
6. Verifica que el descuento se aplique (20%)

## 🐛 Solución de Problemas

### Problema: "No hay promociones activas"

**Causas posibles:**
1. Base de datos no tiene datos
   - Solución: Ejecutar SQL manual (Opción C)

2. Dates en la BD están en el pasado
   - Solución: Actualizar `start_date` y `end_date` en `V6__insert_promotional_codes.sql`
   - Ejemplo: Cambiar `2024-12-01` a fecha actual

3. `is_active` es false
   - Solución: SQL Manual:
     ```sql
     UPDATE promotions SET is_active = 1 WHERE is_active = 0;
     ```

### Problema: Error 404 en `/api/promotions`

**Verificación:**
1. Backend está corriendo? (puerto 8080)
2. Verifica logs del backend por errores

**Prueba con curl:**
```bash
curl http://localhost:8080/api/promotions
```

Debe devolver JSON con array de promociones

### Problema: Botón "Copiar Código" no funciona

1. Check browser console (F12 → Console)
2. Verifica que no haya errores

### Problema: Los estilos CSS no se ven

1. Limpia cache del navegador: `Ctrl+Shift+Delete`
2. Recarga página: `Ctrl+F5`

## 📊 Datos de Prueba

| Código | ¿Debería Verse? | Razón |
|--------|-----------------|-------|
| NAVIDAD2024 | ❌ No (expirada) | 25/12/2024 |
| WEEKEND50 | ❌ No (expirada) | 31/12/2024 |
| ESTUDIANTE15 | ✅ Sí | Vence 31/03/2025 |
| REFIERE20 | ✅ Sí | Vence 28/02/2025 |
| BLACK2025 | ❌ No (no comienza) | Comienza 15/01/2025 |
| PROMO6ENTRADAS | ❌ No (expirada) | 31/12/2024 |
| DULCERIA35 | ✅ Sí | Vence 15/01/2025 |
| NEWYEAR2025 | ✅ Sí | Vence 07/01/2025 |

**Nota:** Para desarrollo, actualiza las fechas en el SQL:
```sql
-- Cambiar estas líneas:
start_date: '2024-12-01 00:00:00' → TODAY
end_date: '2024-12-25 23:59:59' → TODAY + 30 days
```

## 🎯 Test de Flujo Completo

### Scenario: Usuario usa código promocional

```
1. Usuario en HOME
   ↓ Click "Promociones"
2. VE: Promociones activas
   ↓ Click "Copiar" en NAVIDAD2024
3. VE: "✓ Copiado"
   ↓ Click "Usar Código"
4. REDIRECT a /cartelera
   ↓ Selecciona película + horario
5. VE: /butacas/:showtimeId
   ↓ Selecciona asientos
6. REDIRECT a /pago (CarritoTotal)
   ↓ Ingresa código promocional
7. VE: 
   - Código validado ✓
   - Descuento de 20% aplicado
   - Nuevo total = (Subtotal - (Subtotal × 0.20)) × 1.18
   ↓ Ingresa datos de pago
8. VE: /confirmacion/:orderId
   - Promoción usada: NAVIDAD2024
   - Descuento: S/ XX.XX
   - Total final correcto
```

## 📱 Test Responsividad

Prueba en diferentes tamaños:
- [ ] Desktop (1920px)
- [ ] Tablet (768px)
- [ ] Mobile (375px)

F12 → Responsive Design Mode → Selecciona device

---

**¿Listo?** ¡Comienza en el paso 1! 🚀
