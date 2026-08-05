<h1>Aplicación Android para lista de supermercado, con filtro y orden de productos en categorías + checklist</h1>
<p>Mockup inicial hecho en Figma, arte conceptual</p>
<img width="6948" height="6384" alt="App super" src="https://github.com/user-attachments/assets/d2afd314-00e9-44d2-b4aa-a1fab2ac6c8b" />

<p> Código en inglés, desarrollador chileno.
Esta app móvil pretende ser una lista de supermercado muy fácil de usar que permite mayor orden para identificar los productos por su categoría,
de forma que se eviten los viajes de vuelta por olvidar algo en una sección diferente.</p>

<p>El público objetivo son todas las damas y caballeros que van a hacer compras por su cuenta y quieran ahorrarse escribir una lista en papel
o en una aplicación de notas común y corriente.</p>

<h1>Stack tecnológico</h1>
<p>La app está construida con:</p>
<ul>
  <li><b>React Native + Expo</b> (SDK 54) — framework principal</li>
  <li><b>TypeScript</b> — tipado en todo el proyecto</li>
  <li><b>expo-sqlite</b> — base de datos local, 100% offline, sin backend ni servidor</li>
  <li><b>React Navigation</b> (Drawer + Native Stack anidado) — navegación entre listas, catálogo, opciones e información</li>
  <li><b>Context API de React</b> — manejo del tema claro/oscuro</li>
  <li><b>expo-file-system</b> + <b>expo-document-picker</b> — exportar/restaurar copias de seguridad como archivo JSON</li>
</ul>

<h1>Funciones de la app</h1>
<ul>
  <li>Múltiples listas de compra independientes entre sí</li>
  <li>Productos organizados en categorías y subcategorías, cada una con su propio color</li>
  <li>Checklist con marcado en cascada: marcar todos los productos de una subcategoría marca la subcategoría, y lo mismo hacia la categoría</li>
  <li>Colapsar/expandir categorías y subcategorías, con memoria de qué quedó colapsado en cada lista</li>
  <li>Catálogo editable: crear, renombrar, reordenar y borrar categorías, subcategorías y productos, con avisos antes de borrar algo usado en una lista</li>
  <li>Detección de productos y categorías duplicadas al crearlos</li>
  <li>Copia de seguridad exportable e importable como archivo JSON</li>
  <li>Tema claro y oscuro</li>
</ul>

<h1>Personalización de la lista y otros usos</h1>
<p>Todas las categorías, subcategorías y productos son 100% personalizables por el usuario — no hay nada fijo "de fábrica" más allá de unos pocos ejemplos iniciales para no partir con la app vacía.</p>
<p>Aunque nació pensada para el supermercado, la misma estructura de categorías + subcategorías + checklist sirve para cualquier lista que se beneficie de estar organizada por secciones</p>